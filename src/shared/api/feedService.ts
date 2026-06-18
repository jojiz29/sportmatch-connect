/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ===================================================================
 * ARCHIVO: src/shared/api/feedService.ts
 * PROPÓSITO: Servicio del feed de noticias sociales.
 *            Gestiona la obtención y creación de posts con
 *            lógica de visibilidad (seguidos, propios, patrocinados
 *            cercanos) y notificaciones B2B.
 * ===================================================================
 */

import { supabase } from "./supabase";
import { Post } from "@/entities/types";
import { calculateDistance } from "./geoService";
import { createNotification } from "./notificationService";
import { useAuthStore } from "@/entities/user/useAuth";
import { backendApi } from "./backendApi";
import { withTimeout } from "./timeoutHelper";
import { getCatalogItems } from "./businessService";
import { useSocialStore } from "@/features/social/model/useSocialStore";
import { cryptoSecureRandomString } from "@/shared/lib/crypto";

const LOCAL_STORAGE_KEY_POSTS = "sportmatch_demo_posts";

// ==============================================================
// DATOS MOCK: Posts iniciales de demostración
// ==============================================================
const DEFAULT_MOCK_POSTS: Post[] = [
  {
    id: "post-demo-1",
    user_id: "user-1",
    content:
      "¡Gran partido hoy con Ana Sofía en SportMatch Arena! Terminamos con un supertiebreak de infarto. 🏓🔥",
    type: "TEXT",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    sport: "Pádel",
    user_name: "Carlos Mendoza",
    user_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
  },
  {
    id: "post-demo-2",
    user_id: "user-2",
    content:
      "Buscando gente para armar un dobles mixto de tenis este sábado por la mañana. ¿Quién se suma?",
    type: "TEXT",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    sport: "Tenis",
    user_name: "Ana Sofía Prado",
    user_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
  },
  {
    id: "post-demo-3",
    user_id: "user-3",
    content:
      "¡Listo para la pichanga de fútbol 7! Reservado en Complejo DeporLima. ¡Traigan hidratación!",
    type: "TEXT",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    sport: "Fútbol",
    user_name: "Juan Diego Torres",
    user_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
  },
];

// ==============================================================
// HELPERS DE DEMO MODE
// ==============================================================

function getMockPosts(): Post[] {
  if (globalThis.window === undefined) return DEFAULT_MOCK_POSTS;
  try {
    const saved = globalThis.window.localStorage.getItem(LOCAL_STORAGE_KEY_POSTS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load mock posts from localStorage:", e);
  }
  return DEFAULT_MOCK_POSTS;
}

function saveMockPosts(posts: Post[]) {
  if (globalThis.window === undefined) return;
  try {
    globalThis.window.localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(posts));
  } catch (e) {
    console.warn("Failed to save mock posts to localStorage:", e);
  }
}

/** Interfaz de post tal como lo devuelve Supabase (con perfil anidado) */
interface SupabasePost {
  id: string;
  user_id: string;
  content: string;
  type: string;
  created_at: string;
  media_url: string | null;
  sport: string | null;
  profile: {
    id: string;
    name: string;
    avatar_url: string | null;
    user_role?: "PLAYER" | "BUSINESS";
    company_name?: string | null;
    is_sponsored?: boolean;
    last_location_lat?: number | null;
    last_location_lng?: number | null;
  } | null;
}

// ==============================================================
// FUNCIONES PRINCIPALES
// ==============================================================

/**
 * getFeed(): Obtiene posts para el feed del usuario
 * ------------------------------------------------------------------
 * Lógica de visibilidad en modo real:
 *   1. Posts propios del usuario
 *   2. Posts de usuarios que el usuario sigue
 *   3. Posts patrocinados de negocios dentro de un radio de 5km
 *      (para mostrar contenido relevante cerca de la ubicación)
 */
export async function getFeed(userId: string): Promise<Post[]> {
  try {
    if (useAuthStore.getState().isDemoMode) {
      return getMockPosts();
    }

    // 1. Obtiene ubicación del usuario actual para calcular distancias
    const { data: currentUser } = await withTimeout(
      supabase
        .from("profiles")
        .select("last_location_lat, last_location_lng")
        .eq("id", userId)
        .single(),
    ).catch(() => ({ data: null }));

    // 2. Obtiene la lista de usuarios seguidos
    const { data: following } = await withTimeout(
      supabase.from("followers").select("following_id").eq("follower_id", userId),
    ).catch(() => ({ data: null }));

    const followingIds = new Set((following || []).map((f) => f.following_id));

    // 3. Obtiene todos los posts con sus autores
    const { data: posts, error } = await withTimeout(
      supabase
        .from("posts")
        .select("*, profile:profiles(*)")
        .order("created_at", { ascending: false }),
    );

    if (error) {
      console.error(`Error fetching feed from Supabase (code: ${error.code}):`, error);
      return [];
    }

    // 4. Filtra posts según visibilidad
    const filtered = ((posts as unknown as SupabasePost[]) || []).filter((post) => {
      const author = post.profile;
      if (!author) return false;

      // Post propio: siempre visible
      if (post.user_id === userId) return true;

      // Post de usuario seguido: visible
      if (followingIds.has(post.user_id)) return true;

      // Post patrocinado dentro de 5km: visible (marketing geolocalizado)
      if (author.is_sponsored) {
        if (!currentUser?.last_location_lat || !currentUser?.last_location_lng) return false;
        if (!author.last_location_lat || !author.last_location_lng) return false;

        const dist = calculateDistance(
          Number.parseFloat(String(currentUser.last_location_lat)),
          Number.parseFloat(String(currentUser.last_location_lng)),
          Number.parseFloat(String(author.last_location_lat)),
          Number.parseFloat(String(author.last_location_lng)),
        );
        return dist <= 5;
      }

      return false;
    });

    // 5. Normaliza la respuesta
    return filtered.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      type: post.type as Post["type"],
      created_at: post.created_at,
      media_url: post.media_url || undefined,
      sport: (post.sport as Post["sport"]) || undefined,
      user_name: post.profile?.name || "Deportista",
      user_avatar: post.profile?.avatar_url || "",
    }));
  } catch (err) {
    console.error("Critical error in getFeed, falling back to empty feed list:", err);
    return [];
  }
}

/**
 * createPost(): Crea un nuevo post en el feed
 * ------------------------------------------------------------------
 * Soporta dos modos de subida:
 *   - Sin imagen: insert normal en Supabase
 *   - Con imagen (imageFile): subida multipart al backend NestJS
 *     (Task 2.2 - E2E Hydration)
 *
 * Si el autor es un negocio (BUSINESS), notifica automáticamente
 * a todos sus seguidores sobre la nueva publicación (ofertas,
 * promociones, etc.)
 *
 * @param userId    - ID del autor
 * @param content   - Contenido del post
 * @param type      - Tipo de post (TEXT, IMAGE, etc.)
 * @param mediaUrl  - URL de media (opcional)
 * @param sport     - Deporte relacionado (opcional)
 * @param imageFile - Archivo de imagen para subida directa (opcional)
 */
async function createDemoPost(
  userId: string,
  content: string,
  type: Post["type"],
  mediaUrl?: string,
  sport?: Post["sport"],
): Promise<Post> {
  const currentUser = useAuthStore.getState().user;
  const newPost: Post = {
    id: `post-demo-${Date.now()}`,
    user_id: userId,
    content,
    type,
    media_url: mediaUrl,
    sport,
    user_name: currentUser?.name || "Usuario Demo",
    user_avatar: currentUser?.avatar_url || "",
    created_at: new Date().toISOString(),
  };
  const posts = getMockPosts();
  posts.unshift(newPost);
  saveMockPosts(posts);

  // Notifica a seguidores si es negocio (Demo Mode)
  if (currentUser?.user_role === "BUSINESS") {
    const businessName = currentUser.company_name || currentUser.name;
    getCatalogItems(userId)
      .then(async (catalog) => {
        const itemIdToLink = catalog[0]?.id;
        const notifLink = itemIdToLink ? `/app/wallet?buyItem=${itemIdToLink}` : "/app/wallet";
        const notifTitle = `Nueva oferta de ${businessName}`;
        const notifContent = content.length > 80 ? content.substring(0, 77) + "..." : content;

        const relationships = useSocialStore.getState().relationships;
        const followerIds = relationships
          .filter((r) => r.followingId === userId)
          .map((r) => r.followerId);

        for (const followerId of followerIds) {
          await createNotification(
            followerId,
            "AD_IMPRESSION",
            notifTitle,
            notifContent,
            notifLink,
          );
        }
      })
      .catch((err) => {
        console.warn("Could not trigger B2B post notifications in demo mode:", err);
      });
  }

  return newPost;
}

async function uploadPostImage(
  userId: string,
  content: string,
  type: Post["type"],
  sport?: Post["sport"],
  imageFile?: File,
): Promise<Post> {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("content", content);
  formData.append("type", type);
  if (sport) formData.append("sport", sport);
  formData.append("image", imageFile!);

  const { data: uploadResult, error: uploadError } = await backendApi.posts.createMultipart(
    "",
    formData,
  );
  if (uploadError || !uploadResult) {
    throw new Error(uploadError || "Failed to create post with image file");
  }
  return uploadResult as Post;
}

async function generateAndInsertHashtags(postId: string, content: string): Promise<void> {
  try {
    const { generateHashtags } = await import("@/features/ai-text/api/textApi");
    const res = await generateHashtags({ content, minTags: 3, maxTags: 5 });
    if (res.tags.length > 0) {
      const tagRows = res.tags.map((tag) => ({
        post_id: postId,
        tag,
        created_at: new Date().toISOString(),
      }));
      await supabase.from("post_tags").insert(tagRows).select();
    }
  } catch (err) {
    console.warn("Auto-hashtags failed (non-blocking):", err);
  }
}

async function notifyFollowersAboutNewPost(
  userId: string,
  content: string,
  author: any,
): Promise<void> {
  try {
    const businessName = author.company_name || author.name;

    const { data: catalogItems } = await supabase
      .from("business_catalog")
      .select("id")
      .eq("business_id", userId)
      .limit(1);

    const itemIdToLink = catalogItems?.[0]?.id;
    const notifLink = itemIdToLink ? `/app/wallet?buyItem=${itemIdToLink}` : "/app/wallet";
    const notifTitle = `Nueva oferta de ${businessName}`;
    const notifContent = content.length > 80 ? content.substring(0, 77) + "..." : content;

    const { data: followers } = await supabase
      .from("followers")
      .select("follower_id")
      .eq("following_id", userId);

    if (followers && followers.length > 0) {
      for (const f of followers) {
        await createNotification(
          f.follower_id,
          "AD_IMPRESSION",
          notifTitle,
          notifContent,
          notifLink,
        );
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("Could not trigger B2B post notifications:", err);
  }
}

export async function createPost(
  userId: string,
  content: string,
  type: Post["type"],
  mediaUrl?: string,
  sport?: Post["sport"],
  imageFile?: File,
): Promise<Post> {
  if (useAuthStore.getState().isDemoMode) {
    return createDemoPost(userId, content, type, mediaUrl, sport);
  }

  // --- MODO REAL ---

  // Si hay archivo de imagen, sube via multipart FormData al backend NestJS
  if (imageFile) {
    return uploadPostImage(userId, content, type, sport, imageFile);
  }

  // Post de texto: inserta en Supabase
  const newPostId = `post-${Date.now()}-${cryptoSecureRandomString(9)}`;

  const { data: post, error } = await withTimeout(
    supabase
      .from("posts")
      .insert({
        id: newPostId,
        user_id: userId,
        content,
        type,
        media_url: mediaUrl || null,
        sport: sport || null,
      })
      .select("*, profile:profiles(*)")
      .single(),
  );

  if (error || !post) {
    const code = error ? error.code : "UNKNOWN";
    console.error(`Error creating post in Supabase (code: ${code}):`, error);
    throw error || new Error("Failed to create post");
  }

  // Feature #3 — Auto-Hashtags: trigger async no bloqueante después de crear el post
  generateAndInsertHashtags(newPostId, content);

  // Notifica a seguidores si el autor es un negocio
  const author = (post as unknown as SupabasePost).profile;
  if (author?.user_role === "BUSINESS") {
    notifyFollowersAboutNewPost(userId, content, author);
  }

  // Normaliza la respuesta
  const postAuthor = (post as unknown as SupabasePost).profile || {
    name: "Deportista",
    avatar_url: "",
  };

  return {
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    type: post.type as Post["type"],
    created_at: post.created_at,
    media_url: post.media_url || undefined,
    sport: post.sport || undefined,
    user_name: postAuthor.name || "Deportista",
    user_avatar: postAuthor.avatar_url || "",
  };
}

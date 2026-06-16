/**
 * ===================================================================
 * ARCHIVO: src/shared/api/commentService.ts
 * PROPÓSITO: Servicio de comentarios y reacciones en posts.
 *            CRUD completo: crear/eliminar comentarios, agregar/
 *            eliminar reacciones (LIKE, ❤️, 🔥, etc.), y construir
 *            resúmenes de reacciones.
 * INCLUYE: Estructura jerárquica de comentarios (respuestas anidadas),
 *          reacciones por comentario, y detección de reacción del usuario.
 * ===================================================================
 */

import { supabase } from "./supabase";
import { PostComment, ReactionType, CommentReaction } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";

const LOCAL_STORAGE_KEY_COMMENTS = "sportmatch_demo_comments";

// ==============================================================
// TIPOS
// ==============================================================

/** Comentario con respuestas anidadas y reacción del usuario actual */
export interface CommentWithReplies extends PostComment {
  replies: CommentWithReplies[];
  userReaction?: ReactionType;
}

/** Estructura de comentario desde Supabase */
interface SupabaseComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profile: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

/** Estructura de reacción desde Supabase */
interface SupabaseReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: ReactionType;
}

// ==============================================================
// HELPERS DE DEMO MODE
// ==============================================================

/** Almacena comentarios mock: { postId: PostComment[] } */
function getMockComments(): Record<string, PostComment[]> {
  if (typeof globalThis.window === "undefined") return {};
  try {
    const saved = globalThis.window.localStorage.getItem(LOCAL_STORAGE_KEY_COMMENTS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveMockComments(comments: Record<string, PostComment[]>) {
  if (typeof globalThis.window === "undefined") return;
  try {
    globalThis.window.localStorage.setItem(LOCAL_STORAGE_KEY_COMMENTS, JSON.stringify(comments));
  } catch {
    console.warn("Failed to save mock comments to localStorage");
  }
}

// ==============================================================
// FUNCIONES PRINCIPALES
// ==============================================================

/**
 * getCommentsByPostId(): Obtiene comentarios de un post con estructura jerárquica
 * ------------------------------------------------------------------
 * En modo real:
 *   1. Obtiene comentarios del post ordenados por fecha
 *   2. Obtiene reacciones de esos comentarios (batch)
 *   3. Obtiene perfiles de los autores (batch)
 *   4. Construye árbol de comentarios: padres -> hijos (replies)
 *
 * Los comentarios se organizan en estructura de árbol donde los
 * comentarios raíz tienen su array "replies" con respuestas hijas.
 */
export async function getCommentsByPostId(postId: string): Promise<CommentWithReplies[]> {
  try {
    if (useAuthStore.getState().isDemoMode) {
      const allComments = getMockComments();
      const postComments = (allComments[postId] || []).map((c) => ({
        ...c,
        replies: (allComments[c.id] || []).map((r) => ({ ...r, replies: [] })),
      }));
      return postComments;
    }

    // 1. Obtiene comentarios del post
    const { data: comments, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    const commentIds = ((comments as unknown as SupabaseComment[]) || []).map((c) => c.id);
    const userIds = [
      ...new Set(((comments as unknown as SupabaseComment[]) || []).map((c) => c.user_id)),
    ];

    // 2. Obtiene reacciones y perfiles en paralelo
    let reactions: SupabaseReaction[] = [];
    const profiles: Record<string, { name: string; avatar_url: string | null }> = {};

    if (commentIds.length > 0) {
      const [reactionsResult, profilesResult] = await Promise.all([
        supabase.from("post_comment_reactions").select("*").in("comment_id", commentIds),
        userIds.length > 0
          ? supabase.from("profiles").select("id, name, avatar_url").in("id", userIds)
          : Promise.resolve({ data: [] }),
      ]);

      reactions = (reactionsResult.data as SupabaseReaction[]) || [];
      const profilesData = profilesResult.data || [];
      profilesData.forEach((p: { id: string; name: string; avatar_url: string | null }) => {
        profiles[p.id] = { name: p.name, avatar_url: p.avatar_url };
      });
    }

    // 3. Construye mapa de reacciones: "commentId_userId" -> ReactionType
    const reactionMap: Record<string, ReactionType> = {};
    (reactions || []).forEach((r: SupabaseReaction) => {
      reactionMap[`${r.comment_id}_${r.user_id}`] = r.reaction_type;
    });

    // 4. Construye árbol de comentarios
    const commentMap: Record<string, CommentWithReplies> = {};
    const topLevel: CommentWithReplies[] = [];

    ((comments as unknown as SupabaseComment[]) || []).forEach((c) => {
      const comment: CommentWithReplies = {
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        parent_id: c.parent_id || null,
        user_name: profiles[c.user_id]?.name || "Deportista",
        user_avatar: profiles[c.user_id]?.avatar_url || "",
        replies: [],
      };
      commentMap[c.id] = comment;
    });

    // Asigna hijos a padres o a topLevel
    Object.values(commentMap).forEach((comment) => {
      if (comment.parent_id && commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies.push(comment);
      } else {
        topLevel.push(comment);
      }
    });

    return topLevel;
  } catch (err) {
    console.error("Critical error in getCommentsByPostId:", err);
    return [];
  }
}

/**
 * createComment(): Crea un nuevo comentario en un post
 * Si parentId se especifica, es una respuesta a otro comentario.
 */
export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<PostComment> {
  if (useAuthStore.getState().isDemoMode) {
    const currentUser = useAuthStore.getState().user;
    const newComment: PostComment = {
      id: `comment-demo-${Date.now()}`,
      post_id: postId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      parent_id: parentId || null,
      user_name: currentUser?.name || "Usuario Demo",
      user_avatar: currentUser?.avatar_url || "",
    };

    const allComments = getMockComments();
    if (!allComments[postId]) allComments[postId] = [];
    allComments[postId].push(newComment);
    if (parentId) {
      if (!allComments[parentId]) allComments[parentId] = [];
      allComments[parentId].push({ ...newComment, parent_id: parentId });
    }
    saveMockComments(allComments);
    return newComment;
  }

  const { data: comment, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    throw error;
  }

  const currentUser = useAuthStore.getState().user;
  const c = comment as unknown as SupabaseComment;
  return {
    id: c.id,
    post_id: c.post_id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    parent_id: c.parent_id || null,
    user_name: currentUser?.name || "Deportista",
    user_avatar: currentUser?.avatar_url || "",
  };
}

/**
 * deleteComment(): Elimina un comentario (solo el autor puede hacerlo)
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    const allComments = getMockComments();
    Object.keys(allComments).forEach((postId) => {
      allComments[postId] = allComments[postId].filter((c) => c.id !== commentId);
    });
    saveMockComments(allComments);
    return;
  }

  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

/**
 * addReaction(): Agrega una reacción a un comentario
 * Las reacciones son tipo emoji: LIKE, ❤️, 🔥, 👏, 😂, 😢, 🎉
 */
export async function addReaction(
  commentId: string,
  userId: string,
  reactionType: ReactionType,
): Promise<CommentReaction> {
  if (useAuthStore.getState().isDemoMode) {
    return {
      id: `reaction-demo-${Date.now()}`,
      comment_id: commentId,
      user_id: userId,
      reaction_type: reactionType,
      created_at: new Date().toISOString(),
    };
  }

  const { data: reaction, error } = await supabase
    .from("post_comment_reactions")
    .insert({
      comment_id: commentId,
      user_id: userId,
      reaction_type: reactionType,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding reaction:", error);
    throw error;
  }

  return reaction as unknown as CommentReaction;
}

/**
 * removeReaction(): Elimina una reacción específica
 */
export async function removeReaction(
  commentId: string,
  userId: string,
  reactionType: ReactionType,
): Promise<void> {
  if (useAuthStore.getState().isDemoMode) return;

  const { error } = await supabase
    .from("post_comment_reactions")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .eq("reaction_type", reactionType);

  if (error) {
    console.error("Error removing reaction:", error);
    throw error;
  }
}

/**
 * getReactionsByCommentId(): Lista todas las reacciones de un comentario
 */
export async function getReactionsByCommentId(commentId: string): Promise<CommentReaction[]> {
  if (useAuthStore.getState().isDemoMode) return [];

  const { data, error } = await supabase
    .from("post_comment_reactions")
    .select("*")
    .eq("comment_id", commentId);

  if (error) {
    console.error("Error fetching reactions:", error);
    return [];
  }

  return ((data as unknown as SupabaseReaction[]) || []).map((r) => ({
    id: r.id,
    comment_id: r.comment_id,
    user_id: r.user_id,
    reaction_type: r.reaction_type,
    created_at: new Date().toISOString(),
  }));
}

/**
 * getUserReactionForComment(): Reacción del usuario actual en un comentario
 * Útil para mostrar el botón de reacción "activo" en la UI.
 */
export async function getUserReactionForComment(
  commentId: string,
  userId: string,
): Promise<ReactionType | null> {
  if (useAuthStore.getState().isDemoMode) return null;

  const { data, error } = await supabase
    .from("post_comment_reactions")
    .select("reaction_type")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return (data as unknown as { reaction_type: ReactionType }).reaction_type;
}

/**
 * buildReactionSummary(): Convierte array de reacciones en resumen
 * count por tipo. Útil para mostrar "5 🔥" en la UI.
 */
export function buildReactionSummary(reactions: CommentReaction[]): Record<ReactionType, number> {
  const summary: Record<ReactionType, number> = {
    LIKE: 0,
    DISLIKE: 0,
    "❤️": 0,
    "🔥": 0,
    "👏": 0,
    "😂": 0,
    "😢": 0,
    "🎉": 0,
  };
  reactions.forEach((r) => {
    summary[r.reaction_type]++;
  });
  return summary;
}

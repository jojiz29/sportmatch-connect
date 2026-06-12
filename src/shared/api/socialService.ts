/**
 * ===================================================================
 * ARCHIVO: src/shared/api/socialService.ts
 * PROPÓSITO: Servicio de funcionalidades sociales: seguir/dejar de
 *            seguir usuarios, consultar estadísticas de seguidores
 *            y verificar relaciones.
 * FLUJO: followUser() -> notifica al seguido -> inserta relación ->
 *        sincroniza con store social.
 * ===================================================================
 */

import { supabase } from "./supabase";
import { createNotification } from "@/shared/api/notificationService";
import { useAuthStore } from "@/entities/user/useAuth";
import { withTimeout } from "./timeoutHelper";
import { useSocialStore } from "@/features/social/model/useSocialStore";

/**
 * followUser(): Crea una relación de seguimiento entre dos usuarios
 * ------------------------------------------------------------------
 * 1. Valida que no sea autoseguimiento
 * 2. En modo real: obtiene el nombre del seguidor para la notificación
 * 3. Envía notificación "FOLLOW" al usuario seguido
 * 4. Inserta la relación en Supabase (ignora violación unique 23505)
 *
 * @param followerId  - Usuario que sigue
 * @param followingId - Usuario que recibe el follow
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) {
    throw new Error("Self-following is not allowed.");
  }

  if (useAuthStore.getState().isDemoMode) {
    useSocialStore.getState().follow(followerId, followingId);
    return;
  }

  // 1. Obtiene el nombre del seguidor para la notificación
  let followerName = "Un usuario";
  try {
    const { data } = await supabase.from("profiles").select("name").eq("id", followerId).single();
    if (data?.name) {
      followerName = data.name;
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn("Could not query follower name for notification:", e);
  }

  // 2. Dispara notificación de nuevo seguidor
  try {
    await createNotification(
      followingId,
      "FOLLOW",
      "Nuevo Seguidor",
      `¡${followerName} comenzó a seguirte!`,
      `/app/match/${followerId}`,
    );
  } catch (error) {
    if (import.meta.env.DEV) console.warn("Could not create follow notification:", error);
  }

  // 3. Inserta relación en Supabase
  const { error } = await withTimeout(
    supabase.from("followers").insert({
      follower_id: followerId,
      following_id: followingId,
    }),
  );

  // Ignora violación de unique constraint (duplicado = ya sigue)
  if (error && error.code !== "23505") {
    if (import.meta.env.DEV) console.error("Error inserting follower relation:", error);
    throw error;
  }
}

/**
 * unfollowUser(): Elimina una relación de seguimiento
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    useSocialStore.getState().unfollow(followerId, followingId);
    return;
  }

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    if (import.meta.env.DEV) console.error("Error unfollowUser from Supabase:", error);
    throw error;
  }
}

/**
 * getFollowStats(): Obtiene conteo de seguidores y seguidos
 * Usa { count: "exact", head: true } para contar sin descargar datos.
 */
export async function getFollowStats(
  userId: string,
): Promise<{ followersCount: number; followingCount: number }> {
  if (useAuthStore.getState().isDemoMode) {
    return useSocialStore.getState().getFollowStats(userId);
  }

  // Cuenta seguidores (where following_id = userId)
  const { count: followersCount, error: followersError } = await supabase
    .from("followers")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (followersError) {
    if (import.meta.env.DEV) console.error("Error getting followers count:", followersError);
    throw followersError;
  }

  // Cuenta seguidos (where follower_id = userId)
  const { count: followingCount, error: followingError } = await supabase
    .from("followers")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (followingError) {
    if (import.meta.env.DEV) console.error("Error getting following count:", followingError);
    throw followingError;
  }

  return {
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
  };
}

/**
 * isFollowing(): Verifica si un usuario sigue a otro
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (useAuthStore.getState().isDemoMode) {
    return useSocialStore.getState().isFollowing(followerId, followingId);
  }

  const { data, error } = await supabase
    .from("followers")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .limit(1);

  if (error) {
    if (import.meta.env.DEV) console.error("Error checking isFollowing:", error);
    throw error;
  }

  return data && data.length > 0;
}

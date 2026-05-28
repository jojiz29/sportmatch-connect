import { query } from "@/shared/lib/database";
import { useSocialStore } from "@/features/social/model/useSocialStore";
import { createNotification } from "@/shared/api/notificationService";
import { MOCK_USERS } from "@/lib/mock";

const USE_MOCKS =
  (typeof process !== "undefined" && process.env?.VITE_USE_MOCKS !== "false") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_MOCKS !== "false");

/**
 * Follows a user.
 * Prevents self-following at the application boundary.
 * In mock mode, updates the persistent Zustand social store.
 * In production mode, inserts the relationship directly into Vercel Postgres.
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) {
    throw new Error("Self-following is not allowed.");
  }

  // Retrieve follower's name for notification
  let followerName = "Un usuario";
  if (USE_MOCKS) {
    const fUser = MOCK_USERS.find((u) => u.id === followerId);
    if (fUser) followerName = fUser.name;
    useSocialStore.getState().follow(followerId, followingId);
  } else {
    try {
      const nameRes = await query("SELECT name FROM public.users WHERE id = $1", [followerId]);
      if (nameRes.rows?.[0]) followerName = nameRes.rows[0].name;
    } catch (e) {
      console.warn("Could not query follower name for notification:", e);
    }
  }

  // Trigger FOLLOW notification
  try {
    await createNotification(
      followingId,
      "FOLLOW",
      "Nuevo Seguidor",
      `¡${followerName} comenzó a seguirte!`,
      `/app/match/${followerId}`,
    );
  } catch (error) {
    console.warn("Could not create follow notification:", error);
  }

  if (USE_MOCKS) {
    return Promise.resolve();
  }

  const sqlQuery = `
    INSERT INTO public.followers (follower_id, following_id)
    VALUES ($1, $2)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
  `;

  try {
    await query(sqlQuery, [followerId, followingId]);
  } catch (error) {
    console.error("Vercel Postgres followUser query failed:", error);
    throw error;
  }
}

/**
 * Unfollows a user.
 * In mock mode, updates the persistent Zustand social store.
 * In production mode, deletes the relationship from Vercel Postgres.
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  if (USE_MOCKS) {
    useSocialStore.getState().unfollow(followerId, followingId);
    return Promise.resolve();
  }

  const sqlQuery = `
    DELETE FROM public.followers
    WHERE follower_id = $1 AND following_id = $2;
  `;

  try {
    await query(sqlQuery, [followerId, followingId]);
  } catch (error) {
    console.error("Vercel Postgres unfollowUser query failed:", error);
    throw error;
  }
}

/**
 * Gets follower/following statistics for a specific user.
 * In mock mode, reads from the local Zustand social store.
 * In production mode, runs a single optimized query with sub-queries to fetch both counts.
 */
export async function getFollowStats(
  userId: string,
): Promise<{ followersCount: number; followingCount: number }> {
  if (USE_MOCKS) {
    return Promise.resolve(useSocialStore.getState().getFollowStats(userId));
  }

  const sqlQuery = `
    SELECT 
      (SELECT COUNT(*)::int FROM public.followers WHERE following_id = $1) as followers_count,
      (SELECT COUNT(*)::int FROM public.followers WHERE follower_id = $1) as following_count;
  `;

  try {
    const result = await query(sqlQuery, [userId]);
    const row = result.rows?.[0] || { followers_count: 0, following_count: 0 };
    return {
      followersCount: row.followers_count,
      followingCount: row.following_count,
    };
  } catch (error) {
    console.error("Vercel Postgres getFollowStats query failed:", error);
    throw error;
  }
}

/**
 * Checks if a user is following another user.
 * In mock mode, queries the local Zustand social store.
 * In production mode, queries the Vercel Postgres database using EXISTS check.
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (USE_MOCKS) {
    return Promise.resolve(useSocialStore.getState().isFollowing(followerId, followingId));
  }

  const sqlQuery = `
    SELECT EXISTS (
      SELECT 1 FROM public.followers 
      WHERE follower_id = $1 AND following_id = $2
    ) as following_exists;
  `;

  try {
    const result = await query(sqlQuery, [followerId, followingId]);
    return result.rows?.[0]?.following_exists || false;
  } catch (error) {
    console.error("Vercel Postgres isFollowing query failed:", error);
    throw error;
  }
}

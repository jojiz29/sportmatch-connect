import { supabase } from "./supabase";
import { createNotification } from "@/shared/api/notificationService";
import { useAuthStore } from "@/entities/user/useAuth";

export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) {
    throw new Error("Self-following is not allowed.");
  }

  if (useAuthStore.getState().isDemoMode) {
    return;
  }

  // 1. Fetch follower's name for the notification
  let followerName = "Un usuario";
  try {
    const { data } = await supabase.from("profiles").select("name").eq("id", followerId).single();
    if (data?.name) {
      followerName = data.name;
    }
  } catch (e) {
    console.warn("Could not query follower name for notification:", e);
  }

  // 2. Trigger FOLLOW notification
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

  // 3. Insert follower relation in Supabase
  const { error } = await supabase.from("followers").insert({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error && error.code !== "23505") {
    // Ignore unique constraint violation (on conflict do nothing)
    console.error("Error inserting follower relation:", error);
    throw error;
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    return;
  }

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    console.error("Error unfollowUser from Supabase:", error);
    throw error;
  }
}

export async function getFollowStats(
  userId: string,
): Promise<{ followersCount: number; followingCount: number }> {
  if (useAuthStore.getState().isDemoMode) {
    return { followersCount: 8, followingCount: 15 };
  }

  // Count followers (where following_id = userId)
  const { count: followersCount, error: followersError } = await supabase
    .from("followers")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  if (followersError) {
    console.error("Error getting followers count:", followersError);
    throw followersError;
  }

  // Count following (where follower_id = userId)
  const { count: followingCount, error: followingError } = await supabase
    .from("followers")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (followingError) {
    console.error("Error getting following count:", followingError);
    throw followingError;
  }

  return {
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
  };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (useAuthStore.getState().isDemoMode) {
    return followingId === "user-1";
  }

  const { data, error } = await supabase
    .from("followers")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .limit(1);

  if (error) {
    console.error("Error checking isFollowing:", error);
    throw error;
  }

  return data && data.length > 0;
}

import { supabase } from "./supabase";
import { Post } from "@/entities/types";
import { calculateDistance } from "./geoService";
import { createNotification } from "./notificationService";

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

export async function getFeed(userId: string): Promise<Post[]> {
  // 1. Fetch user's own profile for distance calculation
  const { data: currentUser } = await supabase
    .from("profiles")
    .select("last_location_lat, last_location_lng")
    .eq("id", userId)
    .single();

  // 2. Fetch the list of followed users
  const { data: following } = await supabase
    .from("followers")
    .select("following_id")
    .eq("follower_id", userId);

  const followingIds = new Set((following || []).map((f) => f.following_id));

  // 3. Fetch all posts with their author profiles
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*, profile:profiles(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching feed from Supabase:", error);
    throw error;
  }

  // 4. Filter posts based on logic (own, following, or sponsored within 5km)
  const filtered = ((posts as unknown as SupabasePost[]) || []).filter((post) => {
    const author = post.profile;
    if (!author) return false;

    // Own post
    if (post.user_id === userId) return true;

    // Following user post
    if (followingIds.has(post.user_id)) return true;

    // Sponsored post within 5km
    if (author.is_sponsored) {
      if (!currentUser?.last_location_lat || !currentUser?.last_location_lng) return false;
      if (!author.last_location_lat || !author.last_location_lng) return false;

      const dist = calculateDistance(
        parseFloat(String(currentUser.last_location_lat)),
        parseFloat(String(currentUser.last_location_lng)),
        parseFloat(String(author.last_location_lat)),
        parseFloat(String(author.last_location_lng)),
      );
      return dist <= 5;
    }

    return false;
  });

  return (filtered as SupabasePost[]).map((post) => ({
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
}

export async function createPost(
  userId: string,
  content: string,
  type: Post["type"],
  mediaUrl?: string,
  sport?: Post["sport"],
): Promise<Post> {
  const newPostId = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 1. Insert post in Supabase
  const { data: post, error } = await supabase
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
    .single();

  if (error || !post) {
    console.error("Error creating post in Supabase:", error);
    throw error || new Error("Failed to create post");
  }

  // 2. Trigger notification for business followers
  try {
    const author = (post as unknown as SupabasePost).profile;
    if (author && author.user_role === "BUSINESS") {
      const businessName = author.company_name || author.name;

      // Fetch first catalog item for deep link
      const { data: catalogItems } = await supabase
        .from("business_catalog")
        .select("id")
        .eq("business_id", userId)
        .limit(1);

      const itemIdToLink = catalogItems?.[0]?.id;
      const notifLink = itemIdToLink ? `/app/wallet?buyItem=${itemIdToLink}` : "/app/wallet";
      const notifTitle = `Nueva oferta de ${businessName}`;
      const notifContent = content.length > 80 ? content.substring(0, 77) + "..." : content;

      // Fetch followers
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
    }
  } catch (err) {
    console.warn("Could not trigger B2B post notifications:", err);
  }

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

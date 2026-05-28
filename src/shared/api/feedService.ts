import { query } from "@/shared/lib/database";
import { Post, CatalogItem } from "@/entities/types";
import { useFeedStore } from "@/features/feed/model/useFeedStore";
import { useSocialStore } from "@/features/social/model/useSocialStore";
import { MOCK_USERS } from "@/lib/mock";
import { calculateDistance } from "./geoService";

const USE_MOCKS =
  (typeof process !== "undefined" && process.env?.VITE_USE_MOCKS !== "false") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_MOCKS !== "false");

/**
 * Gets the custom news feed for a given user.
 * Combines the user's own posts, posts from accounts they follow,
 * and sponsored posts from businesses within a 5km radius.
 */
export async function getFeed(userId: string): Promise<Post[]> {
  if (USE_MOCKS) {
    const allPosts = useFeedStore.getState().posts;
    const currentUser = MOCK_USERS.find((u) => u.id === userId);

    const feed = allPosts.filter((p) => {
      if (p.user_id === userId) return true;

      const following = useSocialStore.getState().isFollowing(userId, p.user_id);
      if (following) return true;

      // Sponsored business injection within 5km radius
      const postAuthor = MOCK_USERS.find((u) => u.id === p.user_id);
      if (postAuthor && postAuthor.is_sponsored) {
        if (!currentUser?.last_location_lat || !currentUser?.last_location_lng) return true;
        if (!postAuthor.last_location_lat || !postAuthor.last_location_lng) return true;

        const dist = calculateDistance(
          currentUser.last_location_lat,
          currentUser.last_location_lng,
          postAuthor.last_location_lat,
          postAuthor.last_location_lng,
        );
        return dist <= 5;
      }

      return false;
    });

    // Sort by created_at desc
    return Promise.resolve(
      feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    );
  }

  const sqlQuery = `
    SELECT 
      p.id, 
      p.user_id, 
      p.content, 
      p.type, 
      p.created_at, 
      p.media_url, 
      p.sport,
      u.name as user_name,
      u.avatar_url as user_avatar,
      u.is_sponsored
    FROM public.posts p
    JOIN public.users u ON p.user_id = u.id
    WHERE p.user_id = $1 
       OR p.user_id IN (SELECT following_id FROM public.followers WHERE follower_id = $1)
       OR (u.is_sponsored = true AND u.last_location_lat IS NOT NULL AND u.last_location_lng IS NOT NULL AND (
           SELECT ST_DWithin(
             ST_SetSRID(ST_Point(u.last_location_lng, u.last_location_lat), 4326)::geography,
             ST_SetSRID(ST_Point(curr.last_location_lng, curr.last_location_lat), 4326)::geography,
             5000
           )
           FROM public.users curr
           WHERE curr.id = $1
       ))
    ORDER BY p.created_at DESC;
  `;

  try {
    const result = await query(sqlQuery, [userId]);
    return (result.rows || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any): Post => ({
        id: row.id,
        user_id: row.user_id,
        content: row.content,

        type: row.type as Post["type"],
        created_at: row.created_at,
        media_url: row.media_url || undefined,
        sport: row.sport || undefined,
        user_name: row.user_name,
        user_avatar: row.user_avatar,
      }),
    );
  } catch (error) {
    console.error("Vercel Postgres getFeed query failed:", error);
    throw error;
  }
}

/**
 * Creates a new post in the feed.
 * In mock mode, enriches the post and saves it to useFeedStore.
 * In production mode, inserts the post into Vercel Postgres and fetches user details.
 */
export async function createPost(
  userId: string,
  content: string,
  type: Post["type"],
  mediaUrl?: string,
  sport?: Post["sport"],
): Promise<Post> {
  const newPost: Post = {
    id: `post-${Date.now()}`,
    user_id: userId,
    content,
    type,
    created_at: new Date().toISOString(),
    media_url: mediaUrl,
    sport,
  };

  // Helper function to trigger notifications for business followers
  const notifyFollowers = async () => {
    try {
      let isBusiness = false;
      let businessName = "Un negocio";
      let itemIdToLink = "";

      if (USE_MOCKS) {
        const author = MOCK_USERS.find((u) => u.id === userId);
        if (author && author.user_role === "BUSINESS") {
          isBusiness = true;
          businessName = author.company_name || author.name;
        }
      } else {
        const userRes = await query(
          "SELECT user_role, company_name, name FROM public.users WHERE id = $1",
          [userId],
        );
        if (userRes.rows?.[0] && userRes.rows[0].user_role === "BUSINESS") {
          isBusiness = true;
          businessName = userRes.rows[0].company_name || userRes.rows[0].name;
        }
      }

      if (isBusiness) {
        if (USE_MOCKS) {
          const { useBusinessStore } = await import("@/features/business/model/useBusinessStore");
          const catalogItems = useBusinessStore
            .getState()
            .catalogItems.filter((item: CatalogItem) => item.business_id === userId);
          if (catalogItems.length > 0) {
            itemIdToLink = catalogItems[0].id;
          } else {
            if (userId === "user-puka-power") itemIdToLink = "puka-power-bottle";
          }
        } else {
          const catRes = await query(
            "SELECT id FROM public.business_catalog WHERE business_id = $1 LIMIT 1",
            [userId],
          );
          if (catRes.rows?.[0]) itemIdToLink = catRes.rows[0].id;
        }

        const notifLink = itemIdToLink ? `/app/wallet?buyItem=${itemIdToLink}` : "/app/wallet";
        const notifTitle = `Nueva oferta de ${businessName}`;
        const notifContent = content.length > 80 ? content.substring(0, 77) + "..." : content;

        let followersList: string[] = [];
        if (USE_MOCKS) {
          followersList = useSocialStore
            .getState()
            .relationships.filter((r) => r.followingId === userId)
            .map((r) => r.followerId);
        } else {
          const follRes = await query(
            "SELECT follower_id FROM public.followers WHERE following_id = $1",
            [userId],
          );
          followersList = follRes.rows.map((r) => r.follower_id);
        }

        const { createNotification } = await import("@/shared/api/notificationService");
        for (const followerId of followersList) {
          await createNotification(
            followerId,
            "AD_IMPRESSION",
            notifTitle,
            notifContent,
            notifLink,
          );
        }
      }
    } catch (err) {
      console.warn("Could not trigger B2B post notifications:", err);
    }
  };

  if (USE_MOCKS) {
    // Resolve user avatar/name from MOCK_USERS
    const user = MOCK_USERS.find((u) => u.id === userId);
    newPost.user_name = user ? user.name : "Edwin Flores";
    newPost.user_avatar = user
      ? user.avatar_url
      : "https://api.dicebear.com/7.x/avataaars/svg?seed=Edwin";

    useFeedStore.getState().addPost(newPost);
    notifyFollowers().catch((e) => console.warn(e));
    return Promise.resolve(newPost);
  }

  const sqlQuery = `
    INSERT INTO public.posts (id, user_id, content, type, media_url, sport)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, content, type, created_at, media_url, sport;
  `;

  try {
    const result = await query(sqlQuery, [
      newPost.id,
      userId,
      content,
      type,
      mediaUrl || null,
      sport || null,
    ]);
    const row = result.rows[0];

    // Enrich with user name/avatar
    const userQuery = `SELECT name, avatar_url FROM public.users WHERE id = $1;`;
    const userResult = await query(userQuery, [userId]);
    const userRow = userResult.rows[0] || {};

    notifyFollowers().catch((e) => console.warn(e));

    return {
      id: row.id,
      user_id: row.user_id,
      content: row.content,

      type: row.type as Post["type"],
      created_at: row.created_at,
      media_url: row.media_url || undefined,
      sport: row.sport || undefined,
      user_name: userRow.name || "Usuario",
      user_avatar: userRow.avatar_url || "",
    };
  } catch (error) {
    console.error("Vercel Postgres createPost query failed:", error);
    throw error;
  }
}

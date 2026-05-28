import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

export interface FollowRelationship {
  followerId: string;
  followingId: string;
}

interface SocialState {
  relationships: FollowRelationship[];
  follow: (followerId: string, followingId: string) => void;
  unfollow: (followerId: string, followingId: string) => void;
  isFollowing: (followerId: string, followingId: string) => boolean;
  getFollowStats: (userId: string) => { followersCount: number; followingCount: number };
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      relationships: [],
      follow: (followerId, followingId) => {
        if (followerId === followingId) {
          throw new Error("Self-following is not allowed.");
        }
        const current = get().relationships;
        const exists = current.some(
          (r) => r.followerId === followerId && r.followingId === followingId,
        );
        if (!exists) {
          set({
            relationships: [...current, { followerId, followingId }],
          });
        }
      },
      unfollow: (followerId, followingId) => {
        const current = get().relationships;
        set({
          relationships: current.filter(
            (r) => !(r.followerId === followerId && r.followingId === followingId),
          ),
        });
      },
      isFollowing: (followerId, followingId) => {
        return get().relationships.some(
          (r) => r.followerId === followerId && r.followingId === followingId,
        );
      },
      getFollowStats: (userId) => {
        const current = get().relationships;
        const followersCount = current.filter((r) => r.followingId === userId).length;
        const followingCount = current.filter((r) => r.followerId === userId).length;
        return { followersCount, followingCount };
      },
    }),
    {
      name: "sportmatch-social",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

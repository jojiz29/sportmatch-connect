import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { MOCK_USERS } from "@/lib/mock";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { getFollowStats } from "@/shared/api/socialService";

interface ProfileState {
  profile: User | null;
  initProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      initProfile: async () => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        // Expose immediately, then enrich with follow stats
        set({ profile: currentUser });

        try {
          const stats = await getFollowStats(currentUser.id);
          set((state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  followers_count: stats.followersCount,
                  following_count: stats.followingCount,
                }
              : null,
          }));
        } catch (error) {
          console.error("Error loading follow stats:", error);
        }
      },
      updateProfile: (data) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const updated = { ...currentUser, ...data };

        // Update in mock database MOCK_USERS list
        const idx = MOCK_USERS.findIndex((u) => u.id === currentUser.id);
        if (idx !== -1) {
          MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...data };
        }

        // Update in auth store
        useAuthStore.setState({ user: updated });

        set((state) => ({
          profile: state.profile ? { ...state.profile, ...data } : updated,
        }));
      },
    }),
    {
      name: "sportmatch-profile",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

// Subscribe to useAuthStore to keep profile in sync
useAuthStore.subscribe(() => {
  useProfileStore.getState().initProfile();
});

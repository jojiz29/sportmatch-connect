import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "@/shared/api/supabase";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { getFollowStats } from "@/shared/api/socialService";

interface ProfileState {
  profile: User | null;
  initProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
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
      updateProfile: async (data) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return;

        const updated = { ...currentUser, ...data };

        // Update in auth store
        useAuthStore.setState({ user: updated });

        set((state) => ({
          profile: state.profile ? { ...state.profile, ...data } : updated,
        }));

        try {
          const { error } = await supabase.from("profiles").update(data).eq("id", currentUser.id);
          if (error) {
            console.error("Error updating profile in Supabase:", error);
          }
        } catch (err) {
          console.error("Failed to update profile in database:", err);
        }
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

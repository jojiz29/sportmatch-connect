import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { MOCK_USERS } from "@/lib/mock";

interface ProfileState {
  profile: User | null;
  initProfile: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      initProfile: () => {
        set({ profile: useAuthStore.getState().user });
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

        set({ profile: updated });
      },
    }),
    {
      name: "sportmatch-profile",
    },
  ),
);

// Subscribe to useAuthStore to keep profile in sync
useAuthStore.subscribe(() => {
  useProfileStore.getState().initProfile();
});

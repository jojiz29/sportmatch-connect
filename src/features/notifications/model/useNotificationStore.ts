import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppNotification } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { useAuthStore } from "@/entities/user/useAuth";

interface NotificationState {
  notifications: AppNotification[];
  initNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, "is_read" | "created_at">) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      initNotifications: () => {
        // Hydrated from localStorage automatically, but we can do extra setup if needed
      },

      addNotification: (notif) => {
        const newNotif: AppNotification = {
          ...notif,
          is_read: false,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));

        return newNotif;
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.user_id === user.id ? { ...n, is_read: true } : n
          ),
        }));
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: "sportmatch-notifications",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppNotification } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { useAuthStore } from "@/entities/user/useAuth";

interface NotificationState {
  notifications: AppNotification[];
  initNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, "is_read" | "created_at">) => AppNotification;
  addNotificationDirectly: (notif: AppNotification) => void;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      initNotifications: () => {
        // Hydrated from localStorage automatically, but we can do extra setup if needed
      },

      addNotificationDirectly: (notif) => {
        set((state) => {
          if (state.notifications.some((n) => n.id === notif.id)) return state;
          return { notifications: [notif, ...state.notifications] };
        });
      },

      fetchNotifications: async (userId) => {
        try {
          const { getNotifications } = await import("@/shared/api/notificationService");
          const fetched = await getNotifications(userId);
          set({ notifications: fetched });
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
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

      markAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n,
          ),
        }));
        try {
          const { markNotificationRead } = await import("@/shared/api/notificationService");
          await markNotificationRead(id);
        } catch (err) {
          console.error("Failed to mark notification read in service:", err);
        }
      },

      markAllAsRead: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.user_id === user.id ? { ...n, is_read: true } : n,
          ),
        }));
        try {
          const { markAllNotificationsRead } = await import("@/shared/api/notificationService");
          await markAllNotificationsRead(user.id);
        } catch (err) {
          console.error("Failed to mark all notifications read in service:", err);
        }
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
    },
  ),
);

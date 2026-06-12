// === BLOQUE: DEPENDENCIAS ===
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppNotification } from "@/entities/types";
import { safeLocalStorage } from "@/shared/lib/safeStorage";
import { useAuthStore } from "@/entities/user/useAuth";

// === BLOQUE: INTERFAZ DEL ESTADO ===
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

// === BLOQUE: STORE DE NOTIFICACIONES ===
// Administra las notificaciones push/in-app: creación, lectura, marcado y eliminación.
// Persistido en localStorage bajo "sportmatch-notifications".
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      initNotifications: () => {
        // Los datos se hidratan automáticamente desde localStorage
      },

      // Agrega una notificación directamente (evita duplicados por ID)
      addNotificationDirectly: (notif) => {
        set((state) => {
          if (state.notifications.some((n) => n.id === notif.id)) return state;
          return { notifications: [notif, ...state.notifications] };
        });
      },

      // Obtiene las notificaciones desde el servicio remoto
      fetchNotifications: async (userId) => {
        try {
          const { getNotifications } = await import("@/shared/api/notificationService");
          const fetched = await getNotifications(userId);
          set({ notifications: fetched });
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      },

      // Crea una nueva notificación con valores por defecto (no leída, timestamp actual)
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

      // Marca una notificación como leída (optimista + persistencia remota)
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

      // Marca todas las notificaciones del usuario actual como leídas
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

      // Elimina una notificación del estado local
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

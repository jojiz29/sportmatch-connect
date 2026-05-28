import { query } from "@/shared/lib/database";
import { AppNotification } from "@/entities/types";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";

const USE_MOCKS =
  (typeof process !== "undefined" && process.env?.VITE_USE_MOCKS !== "false") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_MOCKS !== "false");

/**
 * Gets all notifications for a specific user.
 */
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (USE_MOCKS) {
    const all = useNotificationStore.getState().notifications;
    // Filter for current user and sort by created_at desc
    const userNotifs = all.filter((n) => n.user_id === userId);
    return Promise.resolve(
      userNotifs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );
  }

  const sqlQuery = `
    SELECT id, user_id, type, title, content, link, is_read, created_at
    FROM public.notifications
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  try {
    const result = await query(sqlQuery, [userId]);
    return (result.rows || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any): AppNotification => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type as AppNotification["type"],
        title: row.title,
        content: row.content,
        link: row.link || undefined,
        is_read: row.is_read,
        created_at: row.created_at,
      }),
    );
  } catch (error) {
    console.error("Vercel Postgres getNotifications query failed:", error);
    throw error;
  }
}

/**
 * Creates and logs a new notification.
 */
export async function createNotification(
  userId: string,
  type: AppNotification["type"],
  title: string,
  content: string,
  link?: string,
): Promise<AppNotification> {
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (USE_MOCKS) {
    const created = useNotificationStore.getState().addNotification({
      id: notifId,
      user_id: userId,
      type,
      title,
      content,
      link,
    });
    return Promise.resolve(created);
  }

  const sqlQuery = `
    INSERT INTO public.notifications (id, user_id, type, title, content, link)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, type, title, content, link, is_read, created_at;
  `;

  try {
    const result = await query(sqlQuery, [notifId, userId, type, title, content, link || null]);
    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,

      type: row.type as AppNotification["type"],
      title: row.title,
      content: row.content,
      link: row.link || undefined,
      is_read: row.is_read,
      created_at: row.created_at,
    };
  } catch (error) {
    console.error("Vercel Postgres createNotification query failed:", error);
    throw error;
  }
}

/**
 * Marks a notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  if (USE_MOCKS) {
    useNotificationStore.getState().markAsRead(id);
    return Promise.resolve();
  }

  const sqlQuery = `
    UPDATE public.notifications
    SET is_read = true
    WHERE id = $1;
  `;

  try {
    await query(sqlQuery, [id]);
  } catch (error) {
    console.error("Vercel Postgres markNotificationRead query failed:", error);
    throw error;
  }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (USE_MOCKS) {
    useNotificationStore.getState().markAllAsRead();
    return Promise.resolve();
  }

  const sqlQuery = `
    UPDATE public.notifications
    SET is_read = true
    WHERE user_id = $1;
  `;

  try {
    await query(sqlQuery, [userId]);
  } catch (error) {
    console.error("Vercel Postgres markAllNotificationsRead query failed:", error);
    throw error;
  }
}

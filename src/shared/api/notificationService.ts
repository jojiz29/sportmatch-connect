import { supabase } from "./supabase";
import { AppNotification } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";

function getDemoNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("sportmatch_demo_notifications");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn("Failed to read demo notifications:", e);
    return [];
  }
}

function saveDemoNotifications(notifications: AppNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sportmatch_demo_notifications", JSON.stringify(notifications));
  } catch (e) {
    console.warn("Failed to save demo notifications:", e);
  }
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (useAuthStore.getState().isDemoMode) {
    const all = getDemoNotifications();
    return all
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (import.meta.env.DEV) console.error("Error fetching notifications from Supabase:", error);
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as AppNotification["type"],
    title: row.title as string,
    content: row.content as string,
    link: (row.link as string) || undefined,
    is_read: row.is_read as boolean,
    created_at: row.created_at as string,
  })) as AppNotification[];
}

export async function createNotification(
  userId: string,
  type: AppNotification["type"],
  title: string,
  content: string,
  link?: string,
): Promise<AppNotification> {
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let newNotif: AppNotification;

  if (useAuthStore.getState().isDemoMode) {
    newNotif = {
      id: notifId,
      user_id: userId,
      type,
      title,
      content,
      link: link || undefined,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    const all = getDemoNotifications();
    all.push(newNotif);
    saveDemoNotifications(all);
  } else {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        id: notifId,
        user_id: userId,
        type,
        title,
        content,
        link: link || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error("Error creating notification in Supabase:", error);
      throw error;
    }

    newNotif = {
      id: data.id,
      user_id: data.user_id,
      type: data.type as AppNotification["type"],
      title: data.title,
      content: data.content,
      link: data.link || undefined,
      is_read: data.is_read,
      created_at: data.created_at,
    };
  }

  // Sync to local Zustand store if it matches the current user
  const currentUser = useAuthStore.getState().user;
  if (currentUser && currentUser.id === userId) {
    useNotificationStore.getState().addNotificationDirectly(newNotif);
  }

  return newNotif;
}

export async function markNotificationRead(id: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    const all = getDemoNotifications();
    const updated = all.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    saveDemoNotifications(updated);
    return;
  }

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);

  if (error) {
    if (import.meta.env.DEV) console.error("Error marking notification read in Supabase:", error);
    throw error;
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    const all = getDemoNotifications();
    const updated = all.map((n) => (n.user_id === userId ? { ...n, is_read: true } : n));
    saveDemoNotifications(updated);
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId);

  if (error) {
    if (import.meta.env.DEV)
      console.error("Error marking all notifications read in Supabase:", error);
    throw error;
  }
}

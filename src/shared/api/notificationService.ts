import { supabase } from "./supabase";
import { AppNotification } from "@/entities/types";

export async function getNotifications(userId: string): Promise<AppNotification[]> {
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

  return {
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

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);

  if (error) {
    if (import.meta.env.DEV) console.error("Error marking notification read in Supabase:", error);
    throw error;
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
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

/**
 * ===================================================================
 * ARCHIVO: src/shared/api/notificationService.ts
 * PROPÓSITO: Servicio de notificaciones de la aplicación.
 *            CRUD completo con soporte para Demo Mode (localStorage)
 *            y modo real (Supabase).
 * FLUJO: create() -> guarda en DB/localStorage -> sincroniza con
 *        el store Zustand en tiempo real para actualizar la UI.
 * ===================================================================
 */

import { supabase } from "./supabase";
import { AppNotification } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";
import { cryptoSecureRandomString } from "@/shared/lib/crypto";

// ==============================================================
// HELPERS DE DEMO MODE (persistencia en localStorage)
// ==============================================================

/** Lee todas las notificaciones demo desde localStorage */
function getDemoNotifications(): AppNotification[] {
  if (globalThis.window === undefined) return [];
  try {
    const saved = localStorage.getItem("sportmatch_demo_notifications");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn("Failed to read demo notifications:", e);
    return [];
  }
}

/** Guarda notificaciones demo en localStorage */
function saveDemoNotifications(notifications: AppNotification[]): void {
  if (globalThis.window === undefined) return;
  try {
    localStorage.setItem("sportmatch_demo_notifications", JSON.stringify(notifications));
  } catch (e) {
    console.warn("Failed to save demo notifications:", e);
  }
}

// ==============================================================
// FUNCIONES PRINCIPALES
// ==============================================================

/**
 * getNotifications(): Obtiene las notificaciones de un usuario
 * Ordenadas por fecha descendente (más reciente primero).
 */
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

/**
 * createNotification(): Crea una nueva notificación
 * ------------------------------------------------------------------
 * Después de guardar en DB/localStorage, sincroniza automáticamente
 * con el store Zustand para que la UI reaccione sin necesidad de
 * recargar notificaciones.
 *
 * @param userId  - ID del usuario destinatario
 * @param type    - Tipo de notificación (FOLLOW, MATCH_INVITE, CHAT, etc.)
 * @param title   - Título corto
 * @param content - Contenido descriptivo
 * @param link    - (Opcional) Enlace al que redirige al hacer click
 */
export async function createNotification(
  userId: string,
  type: AppNotification["type"],
  title: string,
  content: string,
  link?: string,
): Promise<AppNotification> {
  const notifId = `notif-${Date.now()}-${cryptoSecureRandomString(9)}`;
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

  // Sincroniza con el store Zustand si la notificación es para el usuario actual
  const currentUser = useAuthStore.getState().user;
  if (currentUser?.id === userId) {
    useNotificationStore.getState().addNotificationDirectly(newNotif);
  }

  return newNotif;
}

/**
 * markNotificationRead(): Marca una notificación como leída
 */
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

/**
 * markAllNotificationsRead(): Marca TODAS las notificaciones como leídas
 */
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

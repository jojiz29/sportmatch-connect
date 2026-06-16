// ============================================================
// settingsApi.ts — Cliente HTTP para /api/v1/users/me/*
// ============================================================

import { supabase } from "@/shared/api/supabase";
import type { UserPreferences, BlockedUser, UserSession } from "../settings.types";

// URL base de la API NestJS + prefijo /api/v1
// (duplicamos la lógica para evitar acoplamiento con backendApi.ts)
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/v1";

/** Helper para hacer fetch autenticado al backend NestJS */
async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("No hay sesión activa");
  }
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// === PREFERENCIAS ===

export async function getPreferences(): Promise<UserPreferences> {
  return authFetch<UserPreferences>("/users/me/preferences");
}

export async function updatePreferences(
  updates: Partial<UserPreferences>,
): Promise<UserPreferences> {
  return authFetch<UserPreferences>("/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function resetPreferences(): Promise<UserPreferences> {
  return authFetch<UserPreferences>("/users/me/preferences/reset", {
    method: "POST",
  });
}

// === USUARIOS BLOQUEADOS ===

export async function listBlocks(): Promise<BlockedUser[]> {
  return authFetch<BlockedUser[]>("/users/me/blocks");
}

export async function blockUser(userId: string, reason?: string): Promise<BlockedUser> {
  return authFetch<BlockedUser>("/users/me/blocks", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, reason }),
  });
}

export async function unblockUser(userId: string): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/users/me/blocks/${userId}`, {
    method: "DELETE",
  });
}

// === SESIONES ===

export async function listSessions(): Promise<UserSession[]> {
  return authFetch<UserSession[]>("/users/me/sessions");
}

export async function registerSession(session: {
  device_label?: string;
  user_agent?: string;
  ip_address?: string;
  is_current?: boolean;
}): Promise<UserSession> {
  return authFetch<UserSession>("/users/me/sessions", {
    method: "POST",
    body: JSON.stringify(session),
  });
}

export async function deleteSession(id: string): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/users/me/sessions/${id}`, {
    method: "DELETE",
  });
}

export async function deleteAllOtherSessions(): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>("/users/me/sessions", {
    method: "DELETE",
  });
}

// === EXPORTAR DATOS ===

export async function exportUserData(): Promise<unknown> {
  return authFetch("/users/me/export-data", {
    method: "POST",
  });
}

// ============================================================
// settingsApi.ts — Cliente HTTP para /api/v1/users/me/* con
// errores tipados, timeout via AbortController y retry opcional
// ============================================================

import { supabase } from "@/shared/api/supabase";
import type { UserPreferences, BlockedUser, UserSession } from "../settings.types";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/v1";

export type SettingsApiErrorKind =
  | "no_session"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "server"
  | "network"
  | "timeout"
  | "aborted"
  | "unknown";

export class SettingsApiError extends Error {
  readonly kind: SettingsApiErrorKind;
  readonly status: number | null;
  readonly details: Record<string, unknown> | null;

  constructor(
    message: string,
    kind: SettingsApiErrorKind,
    status: number | null = null,
    details: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = "SettingsApiError";
    this.kind = kind;
    this.status = status;
    this.details = details;
  }

  /** Mensaje user-friendly traducido a partir del código */
  static userMessage(err: unknown, t: (k: string) => string): string {
    if (err instanceof SettingsApiError) {
      switch (err.kind) {
        case "no_session":
          return t("settings.errors.no_session");
        case "unauthorized":
          return t("settings.errors.unauthorized");
        case "forbidden":
          return t("settings.errors.forbidden");
        case "not_found":
          return t("settings.errors.not_found");
        case "validation":
          return t("settings.errors.validation");
        case "rate_limited":
          return t("settings.errors.rate_limited");
        case "server":
          return t("settings.errors.server");
        case "network":
          return t("settings.errors.network");
        case "timeout":
          return t("settings.errors.timeout");
        case "aborted":
          return t("settings.errors.aborted");
        default:
          return t("settings.errors.unknown");
      }
    }
    return err instanceof Error ? err.message : String(err);
  }
}

interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function authFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new SettingsApiError("No session", "no_session", 401);
  }

  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15000;
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);

  // Si pasan un signal externo, lo encadenamos
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort(opts.signal.reason);
    else opts.signal.addEventListener("abort", () => controller.abort(opts.signal!.reason));
  }

  try {
    const url = `${API_URL}${path}`;
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      let payload: { message?: string; details?: Record<string, unknown> } = {};
      try {
        payload = await res.json();
      } catch {
        /* ignore */
      }

      let kind: SettingsApiErrorKind = "unknown";
      if (res.status === 401) kind = "unauthorized";
      else if (res.status === 403) kind = "forbidden";
      else if (res.status === 404) kind = "not_found";
      else if (res.status === 422 || res.status === 400) kind = "validation";
      else if (res.status === 429) kind = "rate_limited";
      else if (res.status >= 500) kind = "server";

      throw new SettingsApiError(
        payload.message || `HTTP ${res.status}`,
        kind,
        res.status,
        payload.details || null,
      );
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof SettingsApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new SettingsApiError("Aborted", "aborted", null);
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new SettingsApiError("Timeout", "timeout", null);
    }
    if (err instanceof TypeError) {
      throw new SettingsApiError("Network", "network", null);
    }
    throw new SettingsApiError(err instanceof Error ? err.message : "Unknown", "unknown", null);
  } finally {
    clearTimeout(timeout);
  }
}

// === PREFERENCIAS ===

export async function getPreferences(signal?: AbortSignal): Promise<UserPreferences> {
  return authFetch<UserPreferences>("/users/me/preferences", { signal });
}

export async function updatePreferences(
  updates: Partial<UserPreferences>,
  signal?: AbortSignal,
): Promise<UserPreferences> {
  return authFetch<UserPreferences>("/users/me/preferences", {
    method: "PATCH",
    body: updates,
    signal,
  });
}

export async function resetPreferences(signal?: AbortSignal): Promise<UserPreferences> {
  return authFetch<UserPreferences>("/users/me/preferences/reset", {
    method: "POST",
    signal,
  });
}

// === USUARIOS BLOQUEADOS ===

export async function listBlocks(signal?: AbortSignal): Promise<BlockedUser[]> {
  return authFetch<BlockedUser[]>("/users/me/blocks", { signal });
}

export async function blockUser(
  userId: string,
  reason?: string,
  signal?: AbortSignal,
): Promise<BlockedUser> {
  return authFetch<BlockedUser>("/users/me/blocks", {
    method: "POST",
    body: { user_id: userId, reason },
    signal,
  });
}

export async function unblockUser(
  userId: string,
  signal?: AbortSignal,
): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/users/me/blocks/${userId}`, {
    method: "DELETE",
    signal,
  });
}

// === SESIONES ===

export async function listSessions(signal?: AbortSignal): Promise<UserSession[]> {
  return authFetch<UserSession[]>("/users/me/sessions", { signal });
}

export async function registerSession(
  session: {
    device_label?: string;
    user_agent?: string;
    ip_address?: string;
    is_current?: boolean;
  },
  signal?: AbortSignal,
): Promise<UserSession> {
  return authFetch<UserSession>("/users/me/sessions", {
    method: "POST",
    body: session,
    signal,
  });
}

export async function deleteSession(
  id: string,
  signal?: AbortSignal,
): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/users/me/sessions/${id}`, {
    method: "DELETE",
    signal,
  });
}

export async function deleteAllOtherSessions(signal?: AbortSignal): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>("/users/me/sessions", {
    method: "DELETE",
    signal,
  });
}

// === EXPORTAR DATOS ===

export async function exportUserData(signal?: AbortSignal): Promise<unknown> {
  return authFetch("/users/me/export-data", { method: "POST", signal });
}

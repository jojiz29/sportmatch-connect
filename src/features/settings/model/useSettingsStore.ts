// ============================================================
// useSettingsStore.ts — Estado de Configuración del usuario
// Optimistic update con rollback, toasts automáticos y
// soporte para cancelación via AbortSignal
// ============================================================

import { create } from "zustand";
import type { UserPreferences, BlockedUser, UserSession, SettingsSection } from "../settings.types";
import * as settingsApi from "../api/settingsApi";
import { SettingsApiError } from "../api/settingsApi";
import { toast } from "sonner";

interface SettingsState {
  preferences: UserPreferences | null;
  blocks: BlockedUser[];
  sessions: UserSession[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  activeSection: SettingsSection;
  /** Sección actual con cambios sin guardar (futuro) */
  dirtySections: Set<SettingsSection>;

  /** Acciones */
  loadPreferences: () => Promise<void>;
  updatePreferences: (section: SettingsSection, updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  setActiveSection: (section: SettingsSection) => void;

  /** Bloqueos */
  loadBlocks: () => Promise<void>;
  blockUser: (userId: string, reason?: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;

  /** Sesiones */
  loadSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllOtherSessions: () => Promise<void>;

  /** Export */
  exportData: () => Promise<unknown>;

  /** Eliminar cuenta (GDPR - SCRUM-410) */
  deleteAccount: (
    password: string,
    confirmText: string,
    reason?: string,
  ) => Promise<{ deletion_id: string; deleted_at: string; message: string }>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  user_id: "",
  // Privacidad
  profile_visibility: "public",
  show_fitcoins_balance: true,
  show_trust_score: true,
  show_email: false,
  show_phone: false,
  show_last_seen: true,
  show_match_history: true,
  allow_messages_from: "everyone",
  // Notificaciones
  notif_push_enabled: true,
  notif_email_enabled: true,
  notif_inapp_enabled: true,
  notif_sound_enabled: true,
  notif_squad_invites: true,
  notif_match_requests: true,
  notif_chat_messages: true,
  notif_followers: true,
  notif_rewards: true,
  notif_marketing: false,
  notif_weekly_digest: true,
  // Apariencia
  theme: "system",
  ui_density: "comfortable",
  reduce_motion: false,
  high_contrast: false,
  // Squads / Matches
  matchmaking_radius_km: 25,
  auto_accept_squad_invites: false,
  preferred_match_sport: null,
  show_me_in_squad_search: true,
  // Idioma / Región
  language: "es",
  timezone: "America/Lima",
  units_distance: "km",
  // Seguridad
  two_factor_enabled: false,
  login_alerts_enabled: true,
  // Meta
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const errorMessage = (err: unknown): string => SettingsApiError.userMessage(err, (k) => k);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  preferences: null,
  blocks: [],
  sessions: [],
  loading: false,
  saving: false,
  error: null,
  activeSection: "account",
  dirtySections: new Set(),

  setActiveSection: (section) => set({ activeSection: section }),

  loadPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const prefs = await settingsApi.getPreferences();
      set({
        preferences: prefs,
        loading: false,
        dirtySections: new Set(),
      });
    } catch (err) {
      if (err instanceof SettingsApiError && err.kind === "aborted") {
        set({ loading: false });
        return;
      }
      const msg = errorMessage(err);
      console.error("[settings] loadPreferences error:", err);
      // Si no hay prefs aún, usar defaults; pero mostrar toast
      set({
        error: msg,
        loading: false,
        preferences: get().preferences ?? DEFAULT_PREFERENCES,
      });
      toast.error(msg);
    }
  },

  updatePreferences: async (section, updates) => {
    const current = get().preferences;
    if (!current) return;
    set({ saving: true, error: null });

    // Snapshot para rollback
    const snapshot = current;
    // Optimistic update
    set({ preferences: { ...current, ...updates } });

    try {
      const updated = await settingsApi.updatePreferences(updates);
      set((s) => {
        const newDirty = new Set(s.dirtySections);
        newDirty.delete(section);
        return {
          preferences: updated,
          saving: false,
          dirtySections: newDirty,
        };
      });
    } catch (err) {
      if (err instanceof SettingsApiError && err.kind === "aborted") {
        set({ saving: false });
        return;
      }
      // Rollback al estado previo
      set({ preferences: snapshot, saving: false });
      const msg = errorMessage(err);
      set({ error: msg });
      toast.error(msg);
    }
  },

  resetPreferences: async () => {
    set({ saving: true, error: null });
    try {
      const defaults = await settingsApi.resetPreferences();
      set({ preferences: defaults, saving: false, dirtySections: new Set() });
      toast.success("Preferencias restablecidas");
    } catch (err) {
      if (err instanceof SettingsApiError && err.kind === "aborted") {
        set({ saving: false });
        return;
      }
      const msg = errorMessage(err);
      set({ saving: false, error: msg });
      toast.error(msg);
    }
  },

  // === BLOQUEOS ===

  loadBlocks: async () => {
    try {
      const blocks = await settingsApi.listBlocks();
      set({ blocks });
    } catch (err) {
      if (err instanceof SettingsApiError && err.kind === "aborted") return;
      console.error("[settings] loadBlocks error:", err);
    }
  },

  blockUser: async (userId, reason) => {
    try {
      const block = await settingsApi.blockUser(userId, reason);
      set((s) => ({ blocks: [block, ...s.blocks] }));
      toast.success("Usuario bloqueado");
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(msg);
    }
  },

  unblockUser: async (userId) => {
    try {
      await settingsApi.unblockUser(userId);
      set((s) => ({ blocks: s.blocks.filter((b) => b.blocked_id !== userId) }));
      toast.success("Usuario desbloqueado");
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(msg);
    }
  },

  // === SESIONES ===

  loadSessions: async () => {
    try {
      const sessions = await settingsApi.listSessions();
      set({ sessions });
    } catch (err) {
      if (err instanceof SettingsApiError && err.kind === "aborted") return;
      console.error("[settings] loadSessions error:", err);
    }
  },

  deleteSession: async (id) => {
    try {
      await settingsApi.deleteSession(id);
      set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
      toast.success("Sesión cerrada");
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(msg);
    }
  },

  deleteAllOtherSessions: async () => {
    try {
      await settingsApi.deleteAllOtherSessions();
      set((s) => ({
        sessions: s.sessions.filter((sess) => sess.is_current),
      }));
      toast.success("Otras sesiones cerradas");
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(msg);
    }
  },

  // === EXPORT ===

  exportData: async () => {
    try {
      const data = await settingsApi.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sportmatch-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Descarga iniciada");
      return data;
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(msg);
      throw err;
    }
  },

  // === ELIMINAR CUENTA (GDPR - SCRUM-410) ===

  deleteAccount: async (password: string, confirmText: string, reason?: string) => {
    try {
      const result = await settingsApi.deleteAccount({
        password,
        confirmText,
        reason,
      });
      return result;
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(msg);
      throw err;
    }
  },
}));

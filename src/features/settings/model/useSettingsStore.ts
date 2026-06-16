// ============================================================
// useSettingsStore.ts — Estado de Configuración del usuario
// Persiste localmente (modo offline) y sincroniza con backend
// ============================================================

import { create } from "zustand";
import type { UserPreferences, BlockedUser, UserSession, SettingsSection } from "../settings.types";
import * as settingsApi from "../api/settingsApi";
import { toast } from "sonner";

interface SettingsState {
  preferences: UserPreferences | null;
  blocks: BlockedUser[];
  sessions: UserSession[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  activeSection: SettingsSection;
  dirtySections: Set<SettingsSection>;

  // Acciones
  loadPreferences: () => Promise<void>;
  updatePreferences: (section: SettingsSection, updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  setActiveSection: (section: SettingsSection) => void;

  // Bloqueos
  loadBlocks: () => Promise<void>;
  blockUser: (userId: string, reason?: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;

  // Sesiones
  loadSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllOtherSessions: () => Promise<void>;

  // Export
  exportData: () => Promise<unknown>;
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
      const msg = err instanceof Error ? err.message : "Error al cargar preferencias";
      console.error("[settings] loadPreferences error:", err);
      set({ error: msg, loading: false, preferences: DEFAULT_PREFERENCES });
    }
  },

  updatePreferences: async (section, updates) => {
    const current = get().preferences;
    if (!current) return;
    set({ saving: true, error: null });
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
      const msg = err instanceof Error ? err.message : "Error al guardar";
      // Revertir optimistic update
      set({ preferences: current, saving: false, error: msg });
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
      const msg = err instanceof Error ? err.message : "Error al restablecer";
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
      console.error("[settings] loadBlocks error:", err);
    }
  },

  blockUser: async (userId, reason) => {
    try {
      const block = await settingsApi.blockUser(userId, reason);
      set((s) => ({ blocks: [block, ...s.blocks] }));
      toast.success("Usuario bloqueado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al bloquear";
      toast.error(msg);
    }
  },

  unblockUser: async (userId) => {
    try {
      await settingsApi.unblockUser(userId);
      set((s) => ({ blocks: s.blocks.filter((b) => b.blocked_id !== userId) }));
      toast.success("Usuario desbloqueado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al desbloquear";
      toast.error(msg);
    }
  },

  // === SESIONES ===

  loadSessions: async () => {
    try {
      const sessions = await settingsApi.listSessions();
      set({ sessions });
    } catch (err) {
      console.error("[settings] loadSessions error:", err);
    }
  },

  deleteSession: async (id) => {
    try {
      await settingsApi.deleteSession(id);
      set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
      toast.success("Sesión cerrada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cerrar sesión";
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
      const msg = err instanceof Error ? err.message : "Error al cerrar sesiones";
      toast.error(msg);
    }
  },

  // === EXPORT ===

  exportData: async () => {
    try {
      const data = await settingsApi.exportUserData();
      // Descargar como JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sportmatch-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Descarga iniciada");
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al exportar";
      toast.error(msg);
      throw err;
    }
  },
}));

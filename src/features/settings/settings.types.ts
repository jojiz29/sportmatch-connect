// ============================================================
// settings.types.ts — Tipos de UserPreferences
// ============================================================

export type ProfileVisibility = "public" | "squads_only" | "private";
export type MessagesFrom = "everyone" | "squads_only" | "nobody";
export type ThemeName = "system" | "light" | "dark" | "world_cup" | "neon";
export type UIDensity = "compact" | "comfortable" | "spacious";
export type Language = "es" | "en" | "pt";
export type UnitsDistance = "km" | "mi";

export interface UserPreferences {
  user_id: string;

  // Privacidad
  profile_visibility: ProfileVisibility;
  show_fitcoins_balance: boolean;
  show_trust_score: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_last_seen: boolean;
  show_match_history: boolean;
  allow_messages_from: MessagesFrom;

  // Notificaciones (canales)
  notif_push_enabled: boolean;
  notif_email_enabled: boolean;
  notif_inapp_enabled: boolean;
  notif_sound_enabled: boolean;

  // Notificaciones (tipos)
  notif_squad_invites: boolean;
  notif_match_requests: boolean;
  notif_chat_messages: boolean;
  notif_followers: boolean;
  notif_rewards: boolean;
  notif_marketing: boolean;
  notif_weekly_digest: boolean;

  // Apariencia
  theme: ThemeName;
  ui_density: UIDensity;
  reduce_motion: boolean;
  high_contrast: boolean;

  // Squads / Matches
  matchmaking_radius_km: number;
  auto_accept_squad_invites: boolean;
  preferred_match_sport: string | null;
  show_me_in_squad_search: boolean;

  // Idioma / Región
  language: Language;
  timezone: string;
  units_distance: UnitsDistance;

  // Seguridad
  two_factor_enabled: boolean;
  login_alerts_enabled: boolean;

  // Meta
  created_at: string;
  updated_at: string;
}

export interface BlockedUser {
  blocked_id: string;
  reason: string | null;
  created_at: string;
  blocked_profile: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_label: string | null;
  user_agent: string | null;
  ip_address: string | null;
  last_active_at: string;
  is_current: boolean;
  created_at: string;
}

export type SettingsSection =
  | "account"
  | "privacy"
  | "notifications"
  | "appearance"
  | "squads"
  | "security"
  | "blocked"
  | "data";

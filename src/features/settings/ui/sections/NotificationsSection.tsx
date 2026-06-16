// ============================================================
// NotificationsSection.tsx — Notificaciones (canales + tipos)
// ============================================================

import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../model/useSettingsStore";
import { SectionCard, SettingRow, ToggleSwitch } from "./SectionCard";
import {
  Bell,
  Mail,
  Smartphone,
  Volume2,
  Trophy,
  MessageCircle,
  UserPlus,
  Coins,
  Megaphone,
  Calendar,
} from "lucide-react";
import { useEffect } from "react";

export function NotificationsSection() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, loadPreferences } = useSettingsStore();

  useEffect(() => {
    if (!preferences) loadPreferences();
  }, [preferences, loadPreferences]);

  if (!preferences) return null;

  const update = (key: keyof typeof preferences, value: unknown) => {
    updatePreferences("notifications", { [key]: value } as Record<string, unknown>);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("settings.notifications.channels_title", "Canales")}
        description={t(
          "settings.notifications.channels_subtitle",
          "Cómo recibes las notificaciones",
        )}
      >
        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t("settings.notifications.channel_push", "Notificaciones push (móvil)")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_push_enabled}
            onChange={(v) => update("notif_push_enabled", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("settings.notifications.channel_email", "Correo electrónico")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_email_enabled}
            onChange={(v) => update("notif_email_enabled", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t("settings.notifications.channel_inapp", "En la app")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_inapp_enabled}
            onChange={(v) => update("notif_inapp_enabled", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {t("settings.notifications.channel_sound", "Sonido al recibir")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_sound_enabled}
            onChange={(v) => update("notif_sound_enabled", v)}
          />
        </SettingRow>
      </SectionCard>

      <SectionCard
        title={t("settings.notifications.types_title", "Tipos de notificación")}
        description={t("settings.notifications.types_subtitle", "Qué eventos te notifican")}
      >
        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              {t("settings.notifications.type_squad_invites", "Invitaciones a squads")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_squad_invites}
            onChange={(v) => update("notif_squad_invites", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              {t("settings.notifications.type_match_requests", "Solicitudes de partido")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_match_requests}
            onChange={(v) => update("notif_match_requests", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              {t("settings.notifications.type_chat_messages", "Mensajes del chat")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_chat_messages}
            onChange={(v) => update("notif_chat_messages", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              {t("settings.notifications.type_followers", "Nuevos seguidores")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_followers}
            onChange={(v) => update("notif_followers", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              {t("settings.notifications.type_rewards", "FitCoins y recompensas")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_rewards}
            onChange={(v) => update("notif_rewards", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              {t("settings.notifications.type_marketing", "Promociones y marketing")}
            </span>
          }
        >
          <ToggleSwitch
            checked={preferences.notif_marketing}
            onChange={(v) => update("notif_marketing", v)}
          />
        </SettingRow>

        <SettingRow
          label={
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {t("settings.notifications.type_weekly_digest", "Resumen semanal")}
            </span>
          }
          description={t(
            "settings.notifications.type_weekly_digest_help",
            "Un email cada lunes con tu actividad",
          )}
        >
          <ToggleSwitch
            checked={preferences.notif_weekly_digest}
            onChange={(v) => update("notif_weekly_digest", v)}
          />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

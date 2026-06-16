// ============================================================
// PrivacySection.tsx — Privacidad y visibilidad del perfil
// Toggle switches con Switch de shadcn, Selects accesibles
// ============================================================

import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../model/useSettingsStore";
import { SectionCard, SettingRow, ToggleSwitch, SelectField } from "./SectionCard";
import { useEffect } from "react";

export function PrivacySection() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, loadPreferences } = useSettingsStore();

  useEffect(() => {
    if (!preferences) loadPreferences();
  }, [preferences, loadPreferences]);

  if (!preferences) return null;

  const update = (key: keyof typeof preferences, value: unknown) => {
    updatePreferences("privacy", { [key]: value } as Record<string, unknown>);
  };

  return (
    <SectionCard
      title={t("settings.privacy.title", "Privacidad y visibilidad")}
      description={t("settings.privacy.subtitle", "Controla quién ve qué en tu perfil")}
    >
      <SettingRow
        label={t("settings.privacy.profile_visibility", "Quién puede ver tu perfil")}
        description={t("settings.privacy.profile_visibility_help", "Tu perfil y estadísticas")}
      >
        <SelectField
          value={preferences.profile_visibility}
          onChange={(v) => update("profile_visibility", v)}
          options={[
            { value: "public", label: t("settings.privacy.profile_visibility_public", "Todos") },
            {
              value: "squads_only",
              label: t("settings.privacy.profile_visibility_squads_only", "Solo mis squads"),
            },
            {
              value: "private",
              label: t("settings.privacy.profile_visibility_private", "Solo yo"),
            },
          ]}
          label={t("settings.privacy.profile_visibility", "Quién puede ver tu perfil")}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.privacy.show_fitcoins", "Mostrar mi saldo de FitCoins")}
        description={t("settings.privacy.show_fitcoins_help", "Aparece junto a tu nombre")}
      >
        <ToggleSwitch
          checked={preferences.show_fitcoins_balance}
          onChange={(v) => update("show_fitcoins_balance", v)}
          label={t("settings.privacy.show_fitcoins", "Mostrar mi saldo de FitCoins")}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.privacy.show_trust", "Mostrar mi Trust Score")}
        description={t("settings.privacy.show_trust_help", "Tu reputación en la comunidad")}
      >
        <ToggleSwitch
          checked={preferences.show_trust_score}
          onChange={(v) => update("show_trust_score", v)}
          label={t("settings.privacy.show_trust", "Mostrar mi Trust Score")}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.privacy.show_email", "Mostrar mi email")}
        description={t("settings.privacy.show_email_help", "Visible para otros usuarios")}
      >
        <ToggleSwitch
          checked={preferences.show_email}
          onChange={(v) => update("show_email", v)}
          label={t("settings.privacy.show_email", "Mostrar mi email")}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.privacy.show_phone", "Mostrar mi teléfono")}
        description={t("settings.privacy.show_phone_help", "Visible para otros usuarios")}
      >
        <ToggleSwitch
          checked={preferences.show_phone}
          onChange={(v) => update("show_phone", v)}
          label={t("settings.privacy.show_phone", "Mostrar mi teléfono")}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.privacy.show_last_seen", "Mostrar última vez en línea")}
        description={t("settings.privacy.show_last_seen_help", "Tu estado activo reciente")}
      >
        <ToggleSwitch
          checked={preferences.show_last_seen}
          onChange={(v) => update("show_last_seen", v)}
          label={t("settings.privacy.show_last_seen", "Mostrar última vez en línea")}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.privacy.show_match_history", "Mostrar historial de partidos")}
        description={t(
          "settings.privacy.show_match_history_help",
          "Otros pueden ver tus partidos jugados",
        )}
      >
        <ToggleSwitch
          checked={preferences.show_match_history}
          onChange={(v) => update("show_match_history", v)}
          label={t("settings.privacy.show_match_history", "Mostrar historial de partidos")}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.privacy.allow_messages_from", "Quién puede enviarme mensajes")}
        description={t(
          "settings.privacy.allow_messages_from_help",
          "Controla quién puede chatear contigo",
        )}
      >
        <SelectField
          value={preferences.allow_messages_from}
          onChange={(v) => update("allow_messages_from", v)}
          options={[
            {
              value: "everyone",
              label: t("settings.privacy.allow_messages_from_everyone", "Todos"),
            },
            {
              value: "squads_only",
              label: t("settings.privacy.allow_messages_from_squads_only", "Solo mis squads"),
            },
            { value: "nobody", label: t("settings.privacy.allow_messages_from_nobody", "Nadie") },
          ]}
          label={t("settings.privacy.allow_messages_from", "Quién puede enviarme mensajes")}
        />
      </SettingRow>
    </SectionCard>
  );
}

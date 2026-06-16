// ============================================================
// SquadsSection.tsx — Squads y Partidos
// ============================================================

import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../model/useSettingsStore";
import { SectionCard, SettingRow, ToggleSwitch, SelectField } from "./SectionCard";
import { useEffect, useState } from "react";
import { useSharedSports } from "@/shared/hooks/useSharedSports";

export function SquadsSection() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, loadPreferences } = useSettingsStore();
  const { sports, loading: sportsLoading } = useSharedSports();
  const [radiusInput, setRadiusInput] = useState<string>("");

  useEffect(() => {
    if (!preferences) loadPreferences();
  }, [preferences, loadPreferences]);

  useEffect(() => {
    if (preferences) setRadiusInput(String(preferences.matchmaking_radius_km));
  }, [preferences]);

  if (!preferences) return null;

  const update = (key: keyof typeof preferences, value: unknown) => {
    updatePreferences("squads", { [key]: value } as Record<string, unknown>);
  };

  const sportOptions = [
    { value: "", label: t("settings.squads_section.no_preference", "Sin preferencia") },
    ...(sports?.map((s) => ({ value: s.id, label: s.name })) || []),
  ];

  return (
    <SectionCard
      title={t("settings.squads_section.title", "Squads y Partidos")}
      description={t(
        "settings.squads_section.subtitle",
        "Personaliza cómo encontrar partidos y squads",
      )}
    >
      <SettingRow
        label={t(
          "settings.squads_section.matchmaking_radius",
          "Radio de búsqueda de partidos (km)",
        )}
        description={t(
          "settings.squads_section.matchmaking_radius_help",
          "Qué tan lejos aceptas jugar",
        )}
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={100}
            value={radiusInput}
            onChange={(e) => setRadiusInput(e.target.value)}
            onBlur={() => {
              const v = Math.max(1, Math.min(100, Number(radiusInput) || 25));
              setRadiusInput(String(v));
              update("matchmaking_radius_km", v);
            }}
            className="w-20 px-3 py-2 rounded-lg bg-background border border-border/60 text-sm font-medium focus:outline-none focus:border-primary/60"
          />
          <span className="text-sm text-muted-foreground">{preferences.units_distance}</span>
        </div>
      </SettingRow>

      <SettingRow
        label={t("settings.squads_section.preferred_sport", "Deporte preferido")}
        description={t(
          "settings.squads_section.preferred_sport_help",
          "Para matchmaking prioritario",
        )}
      >
        <SelectField
          value={preferences.preferred_match_sport || ""}
          onChange={(v) => update("preferred_match_sport", v || null)}
          options={sportOptions}
          disabled={sportsLoading}
        />
      </SettingRow>

      <SettingRow
        label={t(
          "settings.squads_section.auto_accept_invites",
          "Aceptar invitaciones a squads automáticamente",
        )}
        description={t("settings.squads_section.auto_accept_invites_help", "Te unes sin confirmar")}
      >
        <ToggleSwitch
          checked={preferences.auto_accept_squad_invites}
          onChange={(v) => update("auto_accept_squad_invites", v)}
        />
      </SettingRow>

      <SettingRow
        label={t("settings.squads_section.show_in_search", "Aparecer en búsqueda de squads")}
        description={t(
          "settings.squads_section.show_in_search_help",
          "Otros pueden encontrarte para invitarte",
        )}
      >
        <ToggleSwitch
          checked={preferences.show_me_in_squad_search}
          onChange={(v) => update("show_me_in_squad_search", v)}
        />
      </SettingRow>
    </SectionCard>
  );
}

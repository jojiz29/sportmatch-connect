// ============================================================
// SquadsSection.tsx — Squads y Partidos
// Radio slider con feedback visual, select de deporte preferido
// ============================================================

import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../model/useSettingsStore";
import { SectionCard, SettingRow, ToggleSwitch, SelectField } from "./SectionCard";
import { useEffect, useState } from "react";
import { useSharedSports } from "@/shared/hooks/useSharedSports";
import { Slider } from "@/shared/ui/slider";
import { MapPin } from "lucide-react";

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

  const radiusKm = preferences.matchmaking_radius_km;

  return (
    <SectionCard
      title={t("settings.squads_section.title", "Squads y Partidos")}
      description={t(
        "settings.squads_section.subtitle",
        "Personaliza cómo encontrar partidos y squads",
      )}
    >
      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {t("settings.squads_section.matchmaking_radius", "Radio de búsqueda de partidos (km)")}
          </span>
        }
        description={t(
          "settings.squads_section.matchmaking_radius_help",
          "Qué tan lejos aceptas jugar",
        )}
        stacked
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Slider
              value={[radiusKm]}
              min={1}
              max={100}
              step={1}
              onValueChange={(v) => {
                const value = v[0];
                setRadiusInput(String(value));
                update("matchmaking_radius_km", value);
              }}
              aria-label={t(
                "settings.squads_section.matchmaking_radius",
                "Radio de búsqueda de partidos (km)",
              )}
              className="flex-1"
            />
            <div className="flex items-center gap-1.5 min-w-[72px] justify-end">
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
                aria-label={t(
                  "settings.squads_section.matchmaking_radius_value",
                  "Valor exacto del radio",
                )}
                className="w-16 px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm font-mono text-center"
              />
              <span className="text-sm text-muted-foreground">{preferences.units_distance}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.squads_section.radius_value_label",
              "Buscaremos partidos hasta {{km}} km a la redonda",
              { km: radiusKm },
            )}
          </p>
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
          label={t("settings.squads_section.preferred_sport", "Deporte preferido")}
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
          label={t(
            "settings.squads_section.auto_accept_invites",
            "Aceptar invitaciones a squads automáticamente",
          )}
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
          label={t("settings.squads_section.show_in_search", "Aparecer en búsqueda de squads")}
        />
      </SettingRow>
    </SectionCard>
  );
}

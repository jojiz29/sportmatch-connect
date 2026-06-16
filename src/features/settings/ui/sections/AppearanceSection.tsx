// ============================================================
// AppearanceSection.tsx — Apariencia (tema, densidad, accesibilidad)
// ============================================================

import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../model/useSettingsStore";
import { SectionCard, SettingRow, ToggleSwitch, SelectField } from "./SectionCard";
import { Sun, Moon, Monitor, Sparkles, Zap, Eye, Minimize2 } from "lucide-react";
import { useThemeStore } from "@/features/theme/store";
import { useEffect } from "react";

export function AppearanceSection() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, loadPreferences } = useSettingsStore();
  const { setTheme } = useThemeStore();

  useEffect(() => {
    if (!preferences) loadPreferences();
  }, [preferences, loadPreferences]);

  if (!preferences) return null;

  const update = (key: keyof typeof preferences, value: unknown) => {
    updatePreferences("appearance", { [key]: value } as Record<string, unknown>);
    // Si cambia el tema, aplicarlo inmediatamente
    if (key === "theme") {
      setTheme(value as never);
    }
  };

  const themes = [
    { value: "system", label: t("settings.appearance.theme_system", "Sistema"), icon: Monitor },
    { value: "light", label: t("settings.appearance.theme_light", "Claro"), icon: Sun },
    { value: "dark", label: t("settings.appearance.theme_dark", "Oscuro"), icon: Moon },
    {
      value: "world_cup",
      label: t("settings.appearance.theme_world_cup", "Copa del Mundo"),
      icon: Sparkles,
    },
    { value: "neon", label: t("settings.appearance.theme_neon", "Neón Urbano"), icon: Zap },
  ];

  return (
    <SectionCard
      title={t("settings.appearance.title", "Apariencia")}
      description={t("settings.appearance.subtitle", "Personaliza cómo se ve SportMatch")}
    >
      <div>
        <div className="text-sm font-semibold text-foreground mb-3">
          {t("settings.appearance.theme", "Tema")}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {themes.map((t_opt) => {
            const Icon = t_opt.icon;
            const isActive = preferences.theme === t_opt.value;
            return (
              <button
                key={t_opt.value}
                onClick={() => update("theme", t_opt.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/40 bg-background/40 hover:border-primary/40"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="text-xs font-semibold">{t_opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <Minimize2 className="h-4 w-4" />
            {t("settings.appearance.density", "Densidad de la interfaz")}
          </span>
        }
        description={t("settings.appearance.density_help", "Espaciado entre elementos")}
      >
        <SelectField
          value={preferences.ui_density}
          onChange={(v) => update("ui_density", v)}
          options={[
            { value: "compact", label: t("settings.appearance.density_compact", "Compacta") },
            { value: "comfortable", label: t("settings.appearance.density_comfortable", "Cómoda") },
            { value: "spacious", label: t("settings.appearance.density_spacious", "Espaciosa") },
          ]}
        />
      </SettingRow>

      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t("settings.appearance.reduce_motion", "Reducir animaciones")}
          </span>
        }
        description={t(
          "settings.appearance.reduce_motion_help",
          "Disminuye el movimiento en la UI",
        )}
      >
        <ToggleSwitch
          checked={preferences.reduce_motion}
          onChange={(v) => update("reduce_motion", v)}
        />
      </SettingRow>

      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t("settings.appearance.high_contrast", "Alto contraste")}
          </span>
        }
        description={t("settings.appearance.high_contrast_help", "Mejora la legibilidad del texto")}
      >
        <ToggleSwitch
          checked={preferences.high_contrast}
          onChange={(v) => update("high_contrast", v)}
        />
      </SettingRow>
    </SectionCard>
  );
}

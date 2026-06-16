// ============================================================
// AppearanceSection.tsx — Apariencia (tema, densidad, accesibilidad)
// Grid 2x3 de temas con preview visual (light/dark/copa/neón),
// densidad, reduce_motion y high_contrast
// ============================================================

import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../model/useSettingsStore";
import { SectionCard, SettingRow, ToggleSwitch, SelectField } from "./SectionCard";
import { Sun, Moon, Monitor, Sparkles, Zap, Eye, Minimize2, Check } from "lucide-react";
import { useThemeStore } from "@/features/theme/store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ThemeOption = {
  value: string;
  label: string;
  icon: typeof Sun;
  /** Colores del preview (gradient stops) */
  preview: { from: string; to: string; ring: string };
};

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
    if (key === "theme") setTheme(value as never);
  };

  const themes: ThemeOption[] = [
    {
      value: "system",
      label: t("settings.appearance.theme_system", "Sistema"),
      icon: Monitor,
      preview: { from: "from-slate-400", to: "to-slate-700", ring: "ring-slate-400" },
    },
    {
      value: "light",
      label: t("settings.appearance.theme_light", "Claro"),
      icon: Sun,
      preview: { from: "from-amber-200", to: "to-sky-200", ring: "ring-amber-300" },
    },
    {
      value: "dark",
      label: t("settings.appearance.theme_dark", "Oscuro"),
      icon: Moon,
      preview: { from: "from-indigo-900", to: "to-purple-900", ring: "ring-indigo-700" },
    },
    {
      value: "world_cup",
      label: t("settings.appearance.theme_world_cup", "Copa del Mundo"),
      icon: Sparkles,
      preview: { from: "from-yellow-500", to: "to-red-600", ring: "ring-yellow-500" },
    },
    {
      value: "neon",
      label: t("settings.appearance.theme_neon", "Neón Urbano"),
      icon: Zap,
      preview: { from: "from-fuchsia-500", to: "to-cyan-400", ring: "ring-fuchsia-500" },
    },
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {themes.map((t_opt) => {
            const Icon = t_opt.icon;
            const isActive = preferences.theme === t_opt.value;
            return (
              <button
                key={t_opt.value}
                type="button"
                onClick={() => update("theme", t_opt.value)}
                aria-pressed={isActive}
                aria-label={t_opt.label}
                className={cn(
                  "group relative flex flex-col items-center gap-2 min-h-[88px] p-3 rounded-xl border-2 transition-all",
                  isActive
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/40 bg-background/40 hover:border-primary/40 active:scale-[0.98]",
                )}
              >
                <div
                  className={cn(
                    "h-10 w-full rounded-md bg-gradient-to-br relative overflow-hidden",
                    t_opt.preview.from,
                    t_opt.preview.to,
                  )}
                  aria-hidden="true"
                >
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="text-xs font-semibold">{t_opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <Minimize2 className="h-4 w-4 text-muted-foreground" />
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
          label={t("settings.appearance.density", "Densidad de la interfaz")}
        />
      </SettingRow>

      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
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
          label={t("settings.appearance.reduce_motion", "Reducir animaciones")}
        />
      </SettingRow>

      <SettingRow
        label={
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            {t("settings.appearance.high_contrast", "Alto contraste")}
          </span>
        }
        description={t("settings.appearance.high_contrast_help", "Mejora la legibilidad del texto")}
      >
        <ToggleSwitch
          checked={preferences.high_contrast}
          onChange={(v) => update("high_contrast", v)}
          label={t("settings.appearance.high_contrast", "Alto contraste")}
        />
      </SettingRow>
    </SectionCard>
  );
}

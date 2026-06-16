// ============================================================
// SectionCard.tsx — Card base reutilizable para las secciones
// ============================================================

import { ReactNode } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../model/useSettingsStore";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Si true, muestra botón "Guardar" que confirma todos los cambios */
  hasSaveButton?: boolean;
  /** Callback al hacer click en Guardar (si no se provee, autoguarda) */
  onSave?: () => Promise<void>;
  /** Sección lógica para identificar en el dirty state */
  section?: string;
  /** Si true, muestra botón "Restablecer defaults" */
  hasResetButton?: boolean;
}

export function SectionCard({
  title,
  description,
  children,
  hasSaveButton = false,
  onSave,
  hasResetButton = false,
}: SectionCardProps) {
  const { t } = useTranslation();
  const { saving, resetPreferences } = useSettingsStore();

  return (
    <div className="rounded-2xl bg-card/60 backdrop-blur border border-border/40 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="space-y-4">{children}</div>

      {(hasSaveButton || hasResetButton) && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
          {hasResetButton && (
            <button
              onClick={() => resetPreferences()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              {t("settings.common.reset_defaults", "Restablecer")}
            </button>
          )}
          {hasSaveButton && (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-bold shadow-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              <Save className="h-4 w-4" />
              {saving
                ? t("settings.common.saving", "Guardando...")
                : t("settings.common.save", "Guardar")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Componente reutilizable para filas de setting (label + control) */
interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Switch (toggle) controlado */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/** Select controlado con estilo consistente */
interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function SelectField({ value, onChange, options, disabled }: SelectFieldProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-3 py-2 rounded-lg bg-background border border-border/60 text-sm font-medium focus:outline-none focus:border-primary/60 disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

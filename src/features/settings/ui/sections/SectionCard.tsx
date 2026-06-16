// ============================================================
// SectionCard.tsx — Card base reutilizable para las secciones
// Wrapper sobre componentes shadcn/ui (Switch, Select) con
// API simplificada, soporte para loading y validación inline
// ============================================================

import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { Save, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { useSettingsStore } from "../../model/useSettingsStore";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Si true, muestra botón "Guardar" que confirma todos los cambios */
  hasSaveButton?: boolean;
  /** Callback al hacer click en Guardar (si no se provee, autoguarda) */
  onSave?: () => Promise<void>;
  /** Si true, muestra botón "Restablecer defaults" */
  hasResetButton?: boolean;
  /** Estado de carga (skeleton) */
  loading?: boolean;
  /** Variante: 'default' | 'danger' (e.g. eliminar cuenta) */
  variant?: "default" | "danger";
}

export function SectionCard({
  title,
  description,
  children,
  hasSaveButton = false,
  onSave,
  hasResetButton = false,
  loading = false,
  variant = "default",
}: SectionCardProps) {
  const { t } = useTranslation();
  const { saving, resetPreferences } = useSettingsStore();
  const titleId = useId();

  const cardClass = `rounded-2xl backdrop-blur border p-4 sm:p-6 space-y-4 sm:space-y-6 ${
    variant === "danger" ? "bg-destructive/5 border-destructive/30" : "bg-card/60 border-border/40"
  }`;

  return (
    <section aria-labelledby={titleId} className={cardClass} data-variant={variant}>
      <div>
        <h2
          id={titleId}
          className={`text-lg sm:text-xl font-bold ${variant === "danger" ? "text-destructive" : "text-foreground"}`}
        >
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-1 divide-y divide-border/30">{children}</div>
      )}

      {(hasSaveButton || hasResetButton) && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 sm:py-4 mt-2 border-t border-border/40 bg-card/95 backdrop-blur flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 rounded-b-2xl">
          {hasResetButton && (
            <button
              type="button"
              onClick={() => resetPreferences()}
              disabled={saving}
              className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              {t("settings.common.reset_defaults", "Restablecer")}
            </button>
          )}
          {hasSaveButton && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-bold shadow-glow hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving
                ? t("settings.common.saving", "Guardando...")
                : t("settings.common.save", "Guardar")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** Componente reutilizable para filas de setting (label + control) */
interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Si true, label se vuelve vertical y control ocupa todo el ancho (mobile) */
  stacked?: boolean;
  /** Mensaje de error a mostrar bajo el control */
  error?: string | null;
}

export function SettingRow({ label, description, children, stacked, error }: SettingRowProps) {
  const errorId = useId();
  return (
    <div
      className={`flex ${stacked ? "flex-col" : "flex-col sm:flex-row sm:items-center"} justify-between gap-2 sm:gap-4 py-3 first:pt-0 last:pb-0`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <div
        className={`shrink-0 ${stacked ? "w-full" : ""}`}
        aria-describedby={error ? errorId : undefined}
      >
        {children}
      </div>
      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-destructive sm:col-span-2"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

/** Switch controlado (wrapper sobre shadcn Switch) */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** aria-label para accesibilidad */
  label?: string;
  /** ID para aria-describedby */
  describedBy?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
  describedBy,
}: ToggleSwitchProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      aria-describedby={describedBy}
      className="scale-110"
    />
  );
}

/** Select controlado con estilo consistente (wrapper sobre shadcn Select) */
interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  /** aria-label */
  label?: string;
  /** placeholder cuando el valor está vacío */
  placeholder?: string;
  /** ancho mínimo */
  minWidth?: string;
}

export function SelectField({
  value,
  onChange,
  options,
  disabled,
  label,
  placeholder,
  minWidth = "min-w-[140px]",
}: SelectFieldProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`h-10 sm:h-9 ${minWidth} text-sm`} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

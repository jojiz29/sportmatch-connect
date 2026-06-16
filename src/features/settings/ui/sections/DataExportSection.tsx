// ============================================================
// DataExportSection.tsx — Mis datos (exportar, descargar)
// ============================================================

import { useTranslation } from "react-i18next";
import { Download, FileJson, AlertTriangle, Database } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { useSettingsStore } from "../../model/useSettingsStore";
import { useState } from "react";

export function DataExportSection() {
  const { t } = useTranslation();
  const { exportData } = useSettingsStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportData();
    } catch {
      // Toast ya mostrado por el store
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("settings.data.title", "Mis datos")}
        description={t("settings.data.subtitle", "Descarga, gestiona o elimina tu información")}
      >
        <div className="flex items-start gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
          <FileJson className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold">{t("settings.data.export_data", "Descargar mis datos")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                "settings.data.export_data_help",
                "Obtén una copia de todos tus datos (perfil, posts, matches, transacciones, etc.) en formato JSON. Tarda unos segundos.",
              )}
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-bold shadow-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {exporting ? (
                <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting
                ? t("settings.data.exporting", "Generando...")
                : t("settings.data.export_request", "Solicitar descarga")}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-background/40 border border-border/40">
          <Database className="h-8 w-8 text-muted-foreground shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold">
              {t("settings.data.what_included", "¿Qué incluye la exportación?")}
            </h3>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>
                {t("settings.data.includes_profile", "Tu perfil (nombre, bio, ciudad, avatar)")}
              </li>
              <li>
                {t("settings.data.includes_preferences", "Tus preferencias de configuración")}
              </li>
              <li>{t("settings.data.includes_posts", "Todos tus posts y comentarios")}</li>
              <li>
                {t("settings.data.includes_matches", "Historial de partidos creados y jugados")}
              </li>
              <li>{t("settings.data.includes_squads", "Squads que has creado")}</li>
              <li>
                {t("settings.data.includes_transactions", "Todas tus transacciones de FitCoins")}
              </li>
              <li>
                {t(
                  "settings.data.includes_notifications",
                  "Tus notificaciones (no leídas y leídas)",
                )}
              </li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          {t(
            "settings.data.privacy_note",
            "Tus datos son tuyos. SportMatch nunca los vende ni comparte con terceros. Esta exportación cumple con GDPR y políticas de privacidad de LATAM.",
          )}
        </p>
      </div>
    </div>
  );
}

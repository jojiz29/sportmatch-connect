// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
// Hook de estado para controlar la pestaña activa del panel de moderación.
import { useState } from "react";
// Framer Motion para animaciones de las tarjetas de reporte.
import { motion, AnimatePresence } from "framer-motion";
// Iconos de Lucide: escudos para acciones de moderación.
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Ban, AlertTriangle, User } from "lucide-react";
// Store de partidos públicos para acceder a los reportes y funciones de moderación.
import { usePublicMatchStore, type UserReport } from "@/features/matchmaking/usePublicMatchStore";
// Store de autenticación para verificar si el usuario es administrador.
import { useAuthStore } from "@/entities/user/useAuth";

// === BLOQUE: TIPOS Y CONSTANTES ===
// Tipo de filtro para las pestañas del panel de moderación.
type FilterKey = "TODAS" | "PENDING" | "SANCTIONED" | "IGNORED";

// Configuración de las pestañas de filtro con iconos descriptivos.
const STATUS_TABS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: "TODAS", label: "Todas", icon: <Shield className="h-3.5 w-3.5" /> },
  { key: "PENDING", label: "Pendiente", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { key: "SANCTIONED", label: "Sancionados", icon: <Ban className="h-3.5 w-3.5" /> },
  { key: "IGNORED", label: "Ignorados", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
];

// Calcula el tiempo transcurrido desde una fecha ISO hasta ahora, en formato breve.
function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

// Configuración visual para cada estado de reporte (borde izquierdo, badge).
const STATUS_CONFIG = {
  PENDING: {
    label: "⏳ Pendiente",
    borderColor: "border-l-warning",
    badgeClass: "bg-warning/10 text-warning border-warning/30",
  },
  SANCTIONED: {
    label: "🔒 Sancionado",
    borderColor: "border-l-destructive",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
  IGNORED: {
    label: "👁 Ignorado",
    borderColor: "border-l-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

// === BLOQUE: TARJETA DE REPORTE INDIVIDUAL ===
function ReportCard({ report }: { report: UserReport }) {
  const ignoreReport = usePublicMatchStore((s) => s.ignoreReport);
  const sanctionUser = usePublicMatchStore((s) => s.sanctionUser);
  const cfg = STATUS_CONFIG[report.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-2xl p-4 border-l-4 ${cfg.borderColor}`}
      id={`report-card-${report.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Información del reporte: reportero, reportado, motivo */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{report.reporterName}</span>
              {" reportó a "}
              <span className="font-semibold text-foreground">{report.reportedUserName}</span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cfg.badgeClass}`}>
                {cfg.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-foreground border border-border font-medium">
                {report.reason}
              </span>
            </div>
            {report.evidence && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                "{report.evidence}"
              </p>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground shrink-0">
          {timeAgo(report.createdAt)}
        </span>
      </div>

      {/* Acciones de moderación — solo visibles para reportes pendientes */}
      {report.status === "PENDING" && (
        <div className="flex gap-2 mt-3 border-t border-border/40 pt-3">
          <button
            onClick={() => ignoreReport(report.id)}
            className="flex-1 py-1.5 rounded-xl glass border border-border text-xs font-semibold hover:bg-accent transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            id={`ignore-report-${report.id}`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            Ignorar
          </button>
          <button
            onClick={() => sanctionUser(report.id)}
            className="flex-1 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
            id={`sanction-report-${report.id}`}
          >
            <ShieldX className="h-3.5 w-3.5" />
            Sancionar
          </button>
        </div>
      )}
    </motion.div>
  );
}

// === BLOQUE: COMPONENTE PRINCIPAL DEL PANEL DE MODERACIÓN ===
// Panel visible solo para administradores, permite gestionar reportes de usuarios.
export function AdminModerationPanel() {
  const user = useAuthStore((s) => s.user);
  const isAdmin =
    user?.email === "ejuniorfloress@gmail.com" || user?.name === "Edwin Flores" || user?.is_admin;

  const [activeTab, setActiveTab] = useState<FilterKey>("TODAS");
  const reports = usePublicMatchStore((s) => s.reports);

  // Si no es administrador, no renderiza nada.
  if (!isAdmin) return null;

  const pending = reports.filter((r) => r.status === "PENDING");
  const sanctioned = reports.filter((r) => r.status === "SANCTIONED");
  const ignored = reports.filter((r) => r.status === "IGNORED");

  const countByTab: Record<FilterKey, number> = {
    TODAS: reports.length,
    PENDING: pending.length,
    SANCTIONED: sanctioned.length,
    IGNORED: ignored.length,
  };

  const filtered = activeTab === "TODAS" ? reports : reports.filter((r) => r.status === activeTab);

  return (
    <div className="glass border border-destructive/30 rounded-3xl p-6 relative overflow-hidden" id="admin-moderation-panel">
      {/* Borde pulsante decorativo */}
      <div className="absolute inset-0 rounded-3xl border-2 border-destructive/20 pointer-events-none animate-pulse" />

      {/* Brillo de fondo */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-destructive opacity-10 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Cabecera del panel */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/30 grid place-items-center shadow-[0_0_12px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Panel de Moderación</h3>
            <p className="text-xs text-muted-foreground">Solo visible para administradores</p>
          </div>
        </div>

        {/* Estadísticas resumidas */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: "Total", value: reports.length, color: "text-foreground" },
            { label: "Pendientes", value: pending.length, color: "text-warning" },
            { label: "Sancionados", value: sanctioned.length, color: "text-destructive" },
            { label: "Ignorados", value: ignored.length, color: "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass border border-border rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Pestañas de filtro */}
        <div className="flex border-b border-border/50 mb-4 gap-1">
          {STATUS_TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer border-b-2 ${
                activeTab === key
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              id={`mod-tab-${key}`}
            >
              {icon}
              {label}
              {countByTab[key] > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === key ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                }`}>
                  {countByTab[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista de reportes */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay reportes en esta categoría.</p>
              </motion.div>
            ) : (
              filtered.map((report) => <ReportCard key={report.id} report={report} />)
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

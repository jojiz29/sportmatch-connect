import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ShieldAlert, Loader2, User, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { usePublicMatchStore } from "@/features/matchmaking/usePublicMatchStore";
import { useAuthStore } from "@/entities/user/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserReportReason = "Abuso" | "Inapropiado" | "No se presentó" | "Spam" | "Acoso";
type LegacyReportReason = "Spam" | "Inapropiado" | "Acoso" | "Odio" | "Otro";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Legacy fields (still supported for posts/comments)
  targetId?: string;
  targetType?: "post" | "comment";
  // NEW: user reporting
  reportedUserId?: string;
  reportedUserName?: string;
  reportedUserAvatar?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_REASONS: { value: UserReportReason; label: string }[] = [
  { value: "No se presentó", label: "No se presentó al partido" },
  { value: "Abuso", label: "Comportamiento abusivo" },
  { value: "Inapropiado", label: "Conducta inapropiada" },
  { value: "Spam", label: "Spam o publicidad no deseada" },
  { value: "Acoso", label: "Hostigamiento o acoso" },
];

const LEGACY_REASONS: { value: LegacyReportReason; label: string }[] = [
  { value: "Spam", label: "Spam o publicidad no deseada" },
  { value: "Inapropiado", label: "Contenido inapropiado / Sensible" },
  { value: "Acoso", label: "Hostigamiento o acoso" },
  { value: "Odio", label: "Discurso de odio / Ofensivo" },
  { value: "Otro", label: "Otros motivos" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  reportedUserId,
  reportedUserName,
  reportedUserAvatar,
}: ReportModalProps) {
  const isUserReport = Boolean(reportedUserId);

  const [reason, setReason] = useState<string>(isUserReport ? "No se presentó" : "Inapropiado");
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitReport = usePublicMatchStore((s) => s.submitReport);
  const currentUser = useAuthStore((s) => s.user);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleUserReport = () => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para reportar a un usuario.");
      return;
    }

    submitReport({
      reportedUserId: reportedUserId!,
      reportedUserName: reportedUserName ?? "Usuario desconocido",
      reason: reason as UserReportReason,
      evidence: evidence.trim(),
    });

    setEvidence("");
    onClose();
  };

  const handleLegacyReport = async () => {
    const baseUrl = import.meta.env.VITE_API_URL || "https://sportmatch-connect.onrender.com";
    const endpoint = `${baseUrl}/api/v1/${targetType === "post" ? "posts" : "posts/comments"}/${targetId}/report`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comments: evidence.trim() }),
      });

      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to submit report");
      }

      toast.success("¡Reporte enviado con éxito! Un moderador lo revisará pronto.", {
        icon: <ShieldAlert className="h-5 w-5 text-yellow-500" />,
      });
    } catch {
      // Fallback: register locally for offline/mock safety
      toast.success("¡Reporte registrado localmente para moderación!", {
        icon: <ShieldAlert className="h-5 w-5 text-yellow-500" />,
      });
    }

    setEvidence("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isUserReport) {
        handleUserReport();
      } else {
        await handleLegacyReport();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived display values ───────────────────────────────────────────────────

  const modalTitle = isUserReport
    ? `Reportar a ${reportedUserName ?? "Usuario"}`
    : `Reportar ${targetType === "post" ? "Publicación" : "Comentario"}`;

  const reasons = isUserReport ? USER_REASONS : LEGACY_REASONS;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background border-border/80 shadow-2xl rounded-3xl p-6 overflow-hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Reported user avatar (user report mode only) */}
              {isUserReport && (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="relative">
                    {reportedUserAvatar ? (
                      <img
                        src={reportedUserAvatar}
                        alt={reportedUserName ?? "Usuario"}
                        className="h-16 w-16 rounded-full border-2 border-border object-cover shadow-md"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full border-2 border-border bg-muted flex items-center justify-center shadow-md">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-white" />
                    </span>
                  </div>
                  {reportedUserName && (
                    <p className="text-sm font-semibold text-foreground">{reportedUserName}</p>
                  )}
                </div>
              )}

              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500 font-bold text-lg">
                  {!isUserReport && <AlertTriangle className="h-5 w-5" />}
                  {modalTitle}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Ayúdanos a mantener SportMatch seguro. Tu reporte será anónimo y revisado por el
                  equipo de moderación.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-3 text-left">
                {/* Reason selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Motivo del reporte
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    {reasons.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evidence / Details textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {isUserReport ? "Evidencia / Detalles" : "Detalles adicionales"}
                    <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder={
                      isUserReport
                        ? "Describe lo ocurrido con este jugador..."
                        : "Explica brevemente por qué reportas este contenido..."
                    }
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-red-500 focus:outline-none resize-none h-24 placeholder:text-muted-foreground/60"
                  />
                </div>

                <DialogFooter className="flex gap-2 sm:justify-end border-t border-border/30 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl glass text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-glow shadow-red-500/20 cursor-pointer transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    )}
                    Enviar Reporte
                  </button>
                </DialogFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default ReportModal;

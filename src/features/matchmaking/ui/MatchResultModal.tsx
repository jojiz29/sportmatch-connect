import { useState } from "react";
import { X, Trophy, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/entities/user/useAuth";
import { backendApi } from "@/shared/api/backendApi";
import { toast } from "sonner";

interface MatchResultModalProps {
  opponentId: string;
  sport: string;
  onClose: () => void;
}

export function MatchResultModal({ opponentId, sport, onClose }: MatchResultModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [winnerId, setWinnerId] = useState<string>(currentUser?.id || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!winnerId) {
      toast.error("Selecciona el ganador del partido");
      return;
    }
    setSubmitting(true);
    try {
      await backendApi.matchmaking.reportResult("queue-match", winnerId, scoreHome, scoreAway);
      toast.success("Resultado registrado", {
        description: "Tu rating Elo se actualizará automáticamente.",
      });
      onClose();
    } catch {
      toast.error("Error al registrar el resultado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-gradient-card border border-border rounded-3xl shadow-card p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-accent transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center mb-6">
            <Trophy className="h-10 w-10 mx-auto text-warning mb-2" />
            <h2 className="text-lg font-bold">Registrar Resultado</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {sport} — El ganador recibirá puntos Elo
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Local
                </label>
                <input
                  type="number"
                  min={0}
                  value={scoreHome}
                  onChange={(e) => setScoreHome(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Visitante
                </label>
                <input
                  type="number"
                  min={0}
                  value={scoreAway}
                  onChange={(e) => setScoreAway(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                Ganador
              </label>
              <select
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                <option value={currentUser?.id || ""}>Yo ({currentUser?.name || "Local"})</option>
                <option value={opponentId}>Rival ({opponentId.slice(0, 8)}...)</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !winnerId}
              className="w-full py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:scale-[1.02] transition-transform disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
                </>
              ) : (
                "Registrar resultado"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

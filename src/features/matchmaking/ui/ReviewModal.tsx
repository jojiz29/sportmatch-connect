import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Send, Loader2 } from "lucide-react";
import { usePublicMatchStore } from "@/features/matchmaking/usePublicMatchStore";
import { toast } from "sonner";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar: string;
}

const RATING_LABELS: Record<number, string> = {
  0: "Selecciona una puntuación",
  1: "Pésimo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente ⭐",
};

const RATING_COLORS: Record<number, string> = {
  0: "text-muted-foreground",
  1: "text-destructive",
  2: "text-warning",
  3: "text-electric",
  4: "text-neon",
  5: "text-neon",
};

export function ReviewModal({
  open,
  onClose,
  targetUserId,
  targetUserName,
  targetUserAvatar,
}: ReviewModalProps) {
  const [hovered, setHovered] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitReview = usePublicMatchStore((s) => s.submitReview);
  const getAverageRating = usePublicMatchStore((s) => s.getAverageRating);

  const displayRating = hovered || rating;
  const averageAfter = getAverageRating(targetUserId);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor selecciona una puntuación.");
      return;
    }
    setSubmitting(true);
    try {
      submitReview({ targetUserId, rating, comment });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHovered(0);
    setComment("");
    setSubmitted(false);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          id="review-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-card overflow-hidden"
            id="review-modal"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                <h2 className="font-bold text-foreground text-base">Valorar jugador</h2>
              </div>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-xl hover:bg-accent grid place-items-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-5">
              {/* Success state */}
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-4 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    className="text-5xl"
                  >
                    ⭐
                  </motion.div>
                  <div>
                    <p className="font-bold text-foreground">¡Valoración enviada!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Puntuaste a{" "}
                      <span className="font-semibold text-foreground">{targetUserName}</span> con{" "}
                      <span className="text-warning font-bold">{rating} estrellas</span>
                    </p>
                    {averageAfter > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Promedio actualizado:{" "}
                        <span className="text-neon font-semibold">{averageAfter} ★</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 rounded-xl bg-gradient-neon text-neon-foreground text-sm font-semibold hover:shadow-neon transition-shadow cursor-pointer"
                    id="review-success-btn"
                  >
                    Listo
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Target player */}
                  <div className="flex items-center gap-3 mb-5">
                    <img
                      src={targetUserAvatar}
                      alt={targetUserName}
                      className="h-12 w-12 rounded-full border-2 border-border bg-muted object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{targetUserName}</p>
                      <p className="text-xs text-muted-foreground">
                        {averageAfter > 0
                          ? `Promedio actual: ${averageAfter} ★`
                          : "Sin valoraciones aún"}
                      </p>
                    </div>
                  </div>

                  {/* Star input */}
                  <div className="flex flex-col items-center gap-2 mb-5">
                    <div className="flex gap-1" role="group" aria-label="Puntuación">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.25 }}
                          whileTap={{ scale: 0.9 }}
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(star)}
                          className="cursor-pointer focus:outline-none"
                          id={`star-btn-${star}`}
                          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`h-9 w-9 transition-colors ${
                              star <= displayRating
                                ? "text-warning fill-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    <motion.p
                      key={displayRating}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm font-semibold ${RATING_COLORS[displayRating]}`}
                    >
                      {RATING_LABELS[displayRating]}
                    </motion.p>
                  </div>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Comentario{" "}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="¿Cómo fue jugar con este jugador?"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      id="review-comment-input"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-2.5 rounded-xl glass border border-border text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || rating === 0}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-neon text-neon-foreground text-sm font-semibold hover:shadow-neon transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      id="review-submit-btn"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Enviar valoración
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

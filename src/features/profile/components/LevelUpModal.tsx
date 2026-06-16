import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLevelUpStore } from "@/features/profile/hooks/useLevelUpStore";
import { levelToLabel, levelToColor } from "@/features/profile/hooks/useXpLevel";
import { ShareButton } from "@/shared/ui/ShareButton";
import { cn } from "@/lib/utils";

const CONFETTI_COLORS = [
  "bg-neon",
  "bg-primary",
  "bg-warning",
  "bg-destructive",
  "bg-blue-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-cyan-500",
];

function ConfettiParticle({ index }: { index: number }) {
  const x = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 1.5 + Math.random() * 1.5;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + Math.random() * 8;

  return (
    <motion.div
      className={cn("absolute rounded-sm", color)}
      style={{
        width: size,
        height: size * (0.4 + Math.random() * 1),
        left: `${x}%`,
        top: -10,
      }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{
        y: 400,
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
        opacity: 0,
      }}
      transition={{ duration, delay, ease: "easeIn" }}
      aria-hidden="true"
    />
  );
}

export function LevelUpModal() {
  const { t } = useTranslation();
  const { showModal, previousLevel, newLevel, dismissModal } = useLevelUpStore();

  const handleDismiss = useCallback(() => {
    dismissModal();
  }, [dismissModal]);

  useEffect(() => {
    if (!showModal) return;
    const timer = setTimeout(handleDismiss, 8000);
    return () => clearTimeout(timer);
  }, [showModal, handleDismiss]);

  const label = levelToLabel(newLevel);
  const color = levelToColor(newLevel);

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-up-title"
            className="relative bg-gradient-card border border-border/60 rounded-3xl p-8 max-w-sm w-full shadow-2xl overflow-hidden"
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <ConfettiParticle key={i} index={i} />
              ))}
            </div>

            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors z-10"
              aria-label={t("levelUp.close", "Cerrar")}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center relative z-10">
              <motion.div
                className={cn(
                  "h-20 w-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br shadow-glow",
                  color,
                )}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>

              <motion.p
                className="text-xs font-bold text-neon mt-4 tracking-widest uppercase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {t("levelUp.title", "¡Subiste de nivel!")}
              </motion.p>

              <motion.h2
                id="level-up-title"
                className="text-4xl font-black mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-muted-foreground">{previousLevel}</span>
                <span className="mx-2 text-foreground/40">→</span>
                <span className={cn("text-transparent bg-clip-text bg-gradient-to-r", color)}>
                  {newLevel}
                </span>
              </motion.h2>

              <motion.p
                className={cn(
                  "text-lg font-bold mt-1",
                  color.replace("from-", "text-").replace(/ .*/, "") || "text-primary",
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {t(`profile.xp.label_${label.toLowerCase()}`, label)}
              </motion.p>

              <motion.p
                className="text-sm text-muted-foreground mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {t("levelUp.message", {
                  label: t(`profile.xp.label_${label.toLowerCase()}`, label),
                  defaultValue: `¡Felicidades! Has subido a nivel ${label}. Sigue así.`,
                })}
              </motion.p>

              <motion.div
                className="flex items-center justify-center gap-3 mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <ShareButton
                  achievement={{ type: "level_up", level: newLevel, label }}
                  variant="button"
                />
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-muted hover:bg-accent transition-all min-h-[44px]"
                >
                  {t("levelUp.close", "Cerrar")}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// XpBar.tsx — Barra de progreso de XP reutilizable
// SCRUM-229: Indicador de nivel de experiencia (XP) y progreso
// Variantes:
//   - "compact": solo barra horizontal (header)
//   - "default": barra + label + level (perfil)
//   - "detailed": barra + label + level + xp actual/next + restantes
// ============================================================

import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import {
  useXpLevel,
  formatXp,
  type XpLevelLabel,
} from "@/features/profile/hooks/useXpLevel";
import { cn } from "@/lib/utils";

type XpBarVariant = "compact" | "default" | "detailed";

/** Tipo que acepta tanto XpInfo completa como customInfo (subset) */
type XpBarInfo = {
  current: number;
  level: number;
  toNext: number;
  label: XpLevelLabel;
  color: string;
  textColor: string;
  progress: number;
  remaining: number;
};

interface XpBarProps {
  variant?: XpBarVariant;
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  animateOnLevelUp?: boolean;
  customInfo?: XpBarInfo;
}

export function XpBar({
  variant = "default",
  className,
  showIcon = true,
  showLabel = true,
  animateOnLevelUp = true,
  customInfo,
}: XpBarProps) {
  const { t } = useTranslation();
  const liveInfo = useXpLevel();

  // Unificamos XpInfo y customInfo en un solo shape
  const info: XpBarInfo | null = customInfo
    ? customInfo
    : liveInfo
      ? {
          current: liveInfo.current,
          level: liveInfo.level,
          toNext: liveInfo.toNext,
          label: liveInfo.label,
          color: liveInfo.color,
          textColor: liveInfo.textColor,
          progress: liveInfo.progress,
          remaining: liveInfo.remaining,
        }
      : null;

  if (!info) return null;

  if (variant === "compact") {
    return (
      <CompactBar
        info={info}
        showIcon={showIcon}
        className={className}
        labelText={t("profile.xp.level_short", "Nivel")}
      />
    );
  }

  if (variant === "detailed") {
    return (
      <DetailedBar
        info={info}
        showIcon={showIcon}
        showLabel={showLabel}
        className={className}
        animateOnLevelUp={animateOnLevelUp}
        t={t}
      />
    );
  }

  return (
    <DefaultBar
      info={info}
      showIcon={showIcon}
      showLabel={showLabel}
      className={className}
      animateOnLevelUp={animateOnLevelUp}
      t={t}
    />
  );
}

// === Variantes ===

function CompactBar({
  info,
  showIcon,
  className,
  labelText,
}: {
  info: XpBarInfo;
  showIcon: boolean;
  className?: string;
  labelText: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      {showIcon && (
        <div
          className={cn(
            "h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br",
            info.color,
          )}
          aria-hidden="true"
        >
          <Trophy className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn("font-bold", info.textColor)}>
            {labelText} {info.level}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground tabular-nums">
            {formatXp(info.current)}/{formatXp(info.toNext)}
          </span>
        </div>
        <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn("h-full bg-gradient-to-r", info.color)}
            initial={false}
            animate={{ width: `${info.progress * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            role="progressbar"
            aria-valuenow={Math.round(info.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level ${info.level} progress`}
          />
        </div>
      </div>
    </div>
  );
}

function DefaultBar({
  info,
  showIcon,
  showLabel,
  className,
  animateOnLevelUp,
  t,
}: {
  info: XpBarInfo;
  showIcon: boolean;
  showLabel: boolean;
  className?: string;
  animateOnLevelUp: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div
      className={cn("p-4 rounded-xl bg-card/60 backdrop-blur border border-border/40", className)}
    >
      <div className="flex items-center gap-3">
        {showIcon && (
          <motion.div
            key={`level-${info.level}`}
            initial={animateOnLevelUp ? { scale: 0.8, rotate: -10 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={cn(
              "h-12 w-12 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br shadow-glow",
              info.color,
            )}
            aria-hidden="true"
          >
            <Trophy className="h-6 w-6 text-white" />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-foreground tabular-nums">
              {t("profile.xp.level", "Nivel")} {info.level}
            </span>
            {showLabel && (
              <span className={cn("text-sm font-semibold", info.textColor)}>
                {t(`profile.xp.label_${info.label.toLowerCase()}`, info.label)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
            {formatXp(info.current)} / {formatXp(info.toNext)} {t("profile.xp.xp", "XP")}
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full bg-gradient-to-r", info.color)}
          initial={false}
          animate={{ width: `${info.progress * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          role="progressbar"
          aria-valuenow={Math.round(info.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${info.level} progress`}
        />
      </div>
    </div>
  );
}

function DetailedBar({
  info,
  showIcon,
  showLabel,
  className,
  animateOnLevelUp,
  t,
}: {
  info: XpBarInfo;
  showIcon: boolean;
  showLabel: boolean;
  className?: string;
  animateOnLevelUp: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div
      className={cn("p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/40", className)}
    >
      <div className="flex items-center gap-4">
        {showIcon && (
          <motion.div
            key={`level-${info.level}`}
            initial={animateOnLevelUp ? { scale: 0.6, rotate: -20 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className={cn(
              "h-16 w-16 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br shadow-glow",
              info.color,
            )}
            aria-hidden="true"
          >
            <Trophy className="h-8 w-8 text-white" />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-bold text-foreground tabular-nums">{info.level}</span>
            <span className="text-sm text-muted-foreground">
              {t("profile.xp.level_of", "de")}
              {info.level + 1}
            </span>
            {showLabel && (
              <span
                className={cn(
                  "text-sm font-semibold px-2 py-0.5 rounded-full",
                  info.textColor,
                  "bg-current/10",
                )}
              >
                {t(`profile.xp.label_${info.label.toLowerCase()}`, info.label)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground tabular-nums mt-1">
            {formatXp(info.current)} {t("profile.xp.xp", "XP")}
          </p>
        </div>
      </div>
      <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden shadow-inner">
        <motion.div
          className={cn("h-full bg-gradient-to-r relative", info.color)}
          initial={false}
          animate={{ width: `${info.progress * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          role="progressbar"
          aria-valuenow={Math.round(info.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${info.level} progress`}
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 3,
            }}
            aria-hidden="true"
          />
        </motion.div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {t("profile.xp.from", "Desde")}{" "}
          {formatXp(info.current - (info.toNext - info.current - info.remaining))} XP
        </span>
        <span className="tabular-nums font-semibold text-foreground">
          {info.remaining > 0
            ? t("profile.xp.remaining", {
                n: formatXp(info.remaining),
                level: info.level + 1,
              })
            : t("profile.xp.max_level", "Nivel maximo")}
        </span>
      </div>
    </div>
  );
}

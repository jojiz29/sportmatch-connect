import { useEffect, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { backendApi } from "@/shared/api/backendApi";
import type { PlayerRating } from "@/entities/types";
import { cn } from "@/lib/utils";

interface EloBadgeProps {
  sport: string;
  className?: string;
}

export function EloBadge({ sport, className }: EloBadgeProps) {
  const [rating, setRating] = useState<PlayerRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevElo, setPrevElo] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    backendApi.matchmaking
      .getElo(sport)
      .then((res) => {
        if (!active) return;
        const data = (res as { data?: PlayerRating }).data;
        if (data) {
          setPrevElo((prev) => prev ?? null);
          setRating(data);
        }
      })
      .catch(() => {
        if (active) setRating(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sport]);

  if (loading) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  if (!rating) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }

  const eloDelta = prevElo !== null ? rating.elo_rating - prevElo : 0;
  const direction = eloDelta > 0 ? "up" : eloDelta < 0 ? "down" : "neutral";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Trophy className="h-3.5 w-3.5 text-warning shrink-0" />
      <AnimatePresence mode="wait">
        <motion.span
          key={rating.elo_rating}
          initial={{ y: direction === "up" ? 10 : direction === "down" ? -10 : 0, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-sm font-bold tabular-nums"
        >
          {Math.round(rating.elo_rating)}
        </motion.span>
      </AnimatePresence>
      {prevElo !== null && eloDelta !== 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "text-[10px] font-semibold",
            eloDelta > 0 ? "text-neon" : "text-destructive",
          )}
        >
          {eloDelta > 0 ? (
            <TrendingUp className="h-3 w-3 inline" />
          ) : (
            <TrendingDown className="h-3 w-3 inline" />
          )}
          {eloDelta > 0 ? "+" : ""}
          {Math.round(eloDelta)}
        </motion.span>
      )}
      <span className="text-[10px] text-muted-foreground">{rating.matches_played}P</span>
    </span>
  );
}

export function EloBadgeList({ sports, className }: { sports: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {sports.map((sport) => (
        <div
          key={sport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-card border border-border"
        >
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {sport}
          </span>
          <EloBadge sport={sport} />
        </div>
      ))}
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { cn } from "@/lib/utils";

interface DBWeeklyChallenge {
  id: string;
  challenge_type: string;
  goal: number;
  progress: number;
  reward_xp: number;
  reward_fitcoins: number;
  description: string;
  claimed: boolean;
  completed_at: string | null;
}

export function WeeklyChallengesCard({ className }: { className?: string }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [challenges, setChallenges] = useState<DBWeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadChallenges();
  }, [user]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_weekly_challenges");
      if (error) throw error;
      setChallenges((data || []) as DBWeeklyChallenge[]);
    } catch (err) {
      console.error("Error loading weekly challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (challengeId: string) => {
    setClaimingId(challengeId);
    try {
      const { data, error } = await supabase.rpc("claim_weekly_challenge", {
        p_challenge_id: challengeId,
      });
      if (error) throw error;
      if (data?.xp_gained) {
        useAuthStore.setState({
          user: user ? { ...user, xp: (user.xp || 0) + data.xp_gained } : null,
        });
      }
      await loadChallenges();
    } catch (err) {
      console.error("Error claiming challenge:", err);
    } finally {
      setClaimingId(null);
    }
  };

  const typeLabel = (type: string) => {
    const key = `weeklyChallenges.types.${type}`;
    return t(key, { defaultValue: type });
  };

  if (!user) return null;

  return (
    <div className={cn("bg-gradient-card border border-border/40 rounded-2xl p-5", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">
            {t("weeklyChallenges.title", "Desafíos de la Semana")}
          </h3>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : challenges.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("weeklyChallenges.empty", "No hay desafíos esta semana. ¡Vuelve el lunes!")}
        </p>
      ) : (
        <div className="space-y-4">
          {challenges.map((c) => {
            const progress = c.goal > 0 ? Math.min(c.progress / c.goal, 1) : 0;
            const isComplete = c.progress >= c.goal;
            const isClaiming = claimingId === c.id;

            return (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {c.description || typeLabel(c.challenge_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("weeklyChallenges.progress", { current: c.progress, goal: c.goal })}
                      {" · "}
                      {t("weeklyChallenges.reward", {
                        xp: c.reward_xp,
                        fc: c.reward_fitcoins,
                        defaultValue: `${c.reward_xp} XP · ${c.reward_fitcoins} FitCoins`,
                      })}
                    </p>
                  </div>
                  {c.claimed ? (
                    <span className="text-xs text-neon font-semibold flex items-center gap-1 shrink-0 ml-2">
                      <Check className="h-3.5 w-3.5" />
                      {t("weeklyChallenges.claimed", "Reclamado")}
                    </span>
                  ) : isComplete ? (
                    <button
                      onClick={() => handleClaim(c.id)}
                      disabled={isClaiming}
                      className="shrink-0 ml-2 px-3 py-1.5 rounded-lg bg-neon text-neon-foreground text-xs font-bold hover:bg-neon/90 transition-all disabled:opacity-50 min-h-[36px]"
                    >
                      {isClaiming ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        t("weeklyChallenges.claim", "Reclamar")
                      )}
                    </button>
                  ) : null}
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r",
                      isComplete ? "from-neon to-emerald-400" : "from-primary to-violet-400",
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Check, MapPin, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { cn } from "@/lib/utils";
import { backendApi } from "@/shared/api/backendApi";
import type { Court } from "@/entities/types";
import {
  EngagementChallenge,
  getEngagementChallenges,
  saveEngagementChallenge,
} from "@/features/engagement-ai";

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

type VenueValidationStatus = "pending" | "approved" | "rejected";

interface VenueValidationState {
  status: VenueValidationStatus;
  venueName?: string;
  engagementChallengeId: string;
}

function mapWeeklyVenueValidations(items: EngagementChallenge[]) {
  return items.reduce<Record<string, VenueValidationState>>((acc, item) => {
    const weeklyChallengeId = item.metadata?.weeklyChallengeId;
    if (typeof weeklyChallengeId !== "string") return acc;

    const status =
      item.metadata?.validationStatus === "approved" ||
      item.metadata?.validationStatus === "rejected" ||
      item.metadata?.validationStatus === "pending"
        ? item.metadata.validationStatus
        : item.status === "completed"
          ? "approved"
          : item.status === "dismissed"
            ? "rejected"
            : "pending";

    if (!acc[weeklyChallengeId]) {
      acc[weeklyChallengeId] = {
        status,
        venueName:
          typeof item.metadata?.selectedVenueName === "string"
            ? item.metadata.selectedVenueName
            : undefined,
        engagementChallengeId: item.id,
      };
    }

    return acc;
  }, {});
}

export function WeeklyChallengesCard({
  className,
  maxItems,
}: {
  className?: string;
  // Permite reutilizar la tarjeta en pantallas compactas sin mostrar todos los retos.
  maxItems?: number;
}) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [challenges, setChallenges] = useState<DBWeeklyChallenge[]>([]);
  const [venues, setVenues] = useState<Court[]>([]);
  const [selectedVenueByChallenge, setSelectedVenueByChallenge] = useState<Record<string, string>>(
    {},
  );
  const [validationByChallenge, setValidationByChallenge] = useState<
    Record<string, VenueValidationState>
  >({});
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [savingVenueId, setSavingVenueId] = useState<string | null>(null);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error }, courtsResponse, engagementChallenges] = await Promise.all([
        supabase.rpc("get_weekly_challenges"),
        backendApi.courts.getAll().catch(() => null),
        getEngagementChallenges().catch(() => [] as EngagementChallenge[]),
      ]);
      if (error) throw error;
      setChallenges((data || []) as DBWeeklyChallenge[]);
      setVenues(Array.isArray(courtsResponse?.data) ? courtsResponse.data : []);
      setValidationByChallenge(mapWeeklyVenueValidations(engagementChallenges));
    } catch (err) {
      console.error("Error loading weekly challenges:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadChallenges();
  }, [loadChallenges, user]);

  const handleSelectVenueForChallenge = async (challenge: DBWeeklyChallenge) => {
    const selectedVenueId = selectedVenueByChallenge[challenge.id];
    const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);
    if (!selectedVenue) return;

    setSavingVenueId(challenge.id);
    try {
      // Creamos una solicitud de validación empresarial sin alterar el reto semanal base.
      // La empresa verá este registro en "Mis sedes" y decidirá si el usuario cumplió.
      const saved = await saveEngagementChallenge({
        title: challenge.description || typeLabel(challenge.challenge_type),
        description:
          challenge.description ||
          `Reto semanal ${typeLabel(challenge.challenge_type)} validable en sede.`,
        rewardHint: `${challenge.reward_xp} XP · ${challenge.reward_fitcoins} FitCoins`,
        metadata: {
          source: "home_weekly_challenge",
          weeklyChallengeId: challenge.id,
          challengeType: challenge.challenge_type,
          selectedVenueId: selectedVenue.id,
          selectedVenueName: selectedVenue.name,
          validationStatus: "pending",
          rewardFitcoins: challenge.reward_fitcoins,
          trophyName: `Trofeo semanal: ${challenge.description || typeLabel(challenge.challenge_type)}`,
        },
      });

      setValidationByChallenge((current) => ({
        ...current,
        [challenge.id]: {
          status: "pending",
          venueName: selectedVenue.name,
          engagementChallengeId: saved.id,
        },
      }));
    } catch (err) {
      console.error("Error saving venue validation:", err);
    } finally {
      setSavingVenueId(null);
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
          {challenges.slice(0, maxItems).map((c) => {
            const progress = c.goal > 0 ? Math.min(c.progress / c.goal, 1) : 0;
            const isComplete = c.progress >= c.goal;
            const isClaiming = claimingId === c.id;
            const validation = validationByChallenge[c.id];
            const isVenueSaving = savingVenueId === c.id;
            const canChooseVenue = !validation || validation.status === "rejected";

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
                {validation ? (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs",
                      validation.status === "approved"
                        ? "border-neon/30 bg-neon/10 text-neon"
                        : validation.status === "rejected"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-warning/30 bg-warning/10 text-warning",
                    )}
                  >
                    {validation.status === "approved" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : validation.status === "rejected" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    <span className="font-semibold">
                      {validation.status === "approved"
                        ? "Validado por la empresa"
                        : validation.status === "rejected"
                          ? "No cumplió, puedes intentar otra sede"
                          : "Pendiente de validación empresarial"}
                    </span>
                    {validation.venueName && (
                      <span className="truncate text-muted-foreground">
                        · {validation.venueName}
                      </span>
                    )}
                  </div>
                ) : null}
                {canChooseVenue && venues.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select
                      value={selectedVenueByChallenge[c.id] ?? ""}
                      onChange={(event) =>
                        setSelectedVenueByChallenge((current) => ({
                          ...current,
                          [c.id]: event.target.value,
                        }))
                      }
                      className="w-full max-w-full min-h-[36px] rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    >
                      <option value="">Elegir sede para validación</option>
                      {venues.slice(0, 30).map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} {venue.district ? `- ${venue.district}` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSelectVenueForChallenge(c)}
                      disabled={!selectedVenueByChallenge[c.id] || isVenueSaving}
                      className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                    >
                      {isVenueSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5" />
                      )}
                      Asignar
                    </button>
                  </div>
                )}
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

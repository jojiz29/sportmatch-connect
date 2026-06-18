// === BLOQUE: IMPORTS — Dependencias del dashboard principal ===
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { Match, User, Court, SportCatalog, Level } from "@/entities/types";
import {
  Trophy,
  Flame,
  MapPin,
  Users,
  ArrowRight,
  Calendar,
  Star,
  Sparkles,
  Plus,
  Clock,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/entities/user/useAuth";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { withTimeout } from "@/shared/api/timeoutHelper";
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";
import { calculateDistance } from "@/shared/api/geoService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useChatStore } from "@/features/chat/useChatStore";
import { useTranslation } from "react-i18next";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { VerifiedBadge } from "@/shared/ui/VerifiedBadge";
import {
  getEngagementChallenges,
  getTodayAiRecommendations,
  saveEngagementChallenge,
  type AiRecommendationResponse,
  type EngagementChallenge,
} from "@/features/engagement-ai";
import { usePublicMatchStore, type PublicMatch } from "@/features/matchmaking/usePublicMatchStore";

type DailyPlanStatus = "idle" | "loading" | "ready" | "error";
type WeeklyChallengeDraft = { title: string; description: string; reward: string };

// === BLOQUE: Ruta /app/ — createFileRoute con loader ===
// Carga datos iniciales desde backendApi (con timeout de 8s por llamada):
//   - matches, users, courts, sports.
// Si alguna falla (timeout/error), retorna array vacío para esa categoría.
export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Inicio — SportMatch" }] }),
  loader: async () => {
    if (useAuthStore.getState().isDemoMode) {
      const [matches, users, courts, sports] = await Promise.all([
        apiClient.matches.getAll().catch(() => []),
        apiClient.users.getMatches(useAuthStore.getState().user?.id).catch(() => []),
        apiClient.courts.getAll().catch(() => []),
        apiClient.sports.getAll().catch(() => []),
      ]);
      return { matches, users, courts, sports };
    }

    const timeout = (ms: number) =>
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
      );

    const fetchWithTimeout = async <T,>(fn: () => Promise<T>, ms = 8000): Promise<T | null> => {
      try {
        return await Promise.race([fn(), timeout(ms)]);
      } catch {
        return null;
      }
    };

    // Las cuatro consultas no dependen entre si; correrlas en paralelo evita sumar timeouts.
    const [backendMatches, backendCourts, backendUsers, backendSports] = await Promise.all([
      fetchWithTimeout(() => backendApi.matches.getAll()),
      fetchWithTimeout(() => backendApi.courts.getAll()),
      fetchWithTimeout(() => backendApi.users.getAll()),
      fetchWithTimeout(() => backendApi.sports.getAll()),
    ]);

    const matches =
      backendMatches && typeof backendMatches === "object" && "data" in backendMatches
        ? (backendMatches as { data: Match[] }).data
        : [];
    const users =
      backendUsers && typeof backendUsers === "object" && "data" in backendUsers
        ? (backendUsers as { data: User[] }).data
        : [];
    const courts =
      backendCourts && typeof backendCourts === "object" && "data" in backendCourts
        ? (backendCourts as { data: Court[] }).data
        : [];
    const sports =
      backendSports && typeof backendSports === "object" && "data" in backendSports
        ? (backendSports as { data: SportCatalog[] }).data
        : [];

    return { matches, users, courts, sports };
  },
  component: Dashboard,
});

// === BLOQUE: getSportEmoji — Mapea nombre de deporte a emoji ===
function getSportEmoji(name: string) {
  switch (name.toLowerCase()) {
    case "paddle":
    case "padel":
    case "pádel":
      return "🏓";
    case "football":
    case "futbol":
    case "fútbol":
      return "⚽";
    case "tennis":
    case "tenis":
      return "🎾";
    case "running":
      return "🏃";
    case "basketball":
    case "basquet":
    case "básquet":
      return "🏀";
    case "volleyball":
    case "voley":
    case "vóley":
      return "🏐";
    default:
      return "🏆";
  }
}

const challengeVenueIconCache = new Map<string, L.DivIcon>();

function createChallengeVenueIcon(sport: string, isSelected: boolean) {
  const key = `${sport}_${isSelected}`;
  if (challengeVenueIconCache.has(key)) return challengeVenueIconCache.get(key)!;
  const emoji = getSportEmoji(sport);
  const bg = isSelected
    ? "linear-gradient(135deg, #f59e0b, #d97706)"
    : "linear-gradient(135deg, #8b5cf6, #3b82f6)";
  const shadow = isSelected
    ? "0 0 20px rgba(251, 191, 36, 0.9)"
    : "0 0 15px rgba(139, 92, 246, 0.7)";
  const badge = isSelected
    ? `<div style="position:absolute;top:-6px;right:-6px;background:#fbbf24;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:8px;border:1px solid #fff">✓</div>`
    : "";
  const icon = L.divIcon({
    html: `<div style="position:relative;display:flex;width:42px;height:42px;align-items:center;justify-content:center;background:${bg};border:2.5px solid #ffffff;border-radius:50%;box-shadow:${shadow};font-size:18px;">${emoji}${badge}</div>`,
    className: "challenge-venue-marker",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -20],
  });
  challengeVenueIconCache.set(key, icon);
  return icon;
}

function getDailyPlanCacheKey(userId: string) {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `sportmatch_daily_plan_${userId}_${dateKey}`;
}

function getWeeklyChallengeKey(userId: string) {
  const now = new Date();
  const bogotaDate = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now),
  );
  const day = bogotaDate.getUTCDay() || 7;
  bogotaDate.setUTCDate(bogotaDate.getUTCDate() - day + 1);
  return `${userId}_${bogotaDate.toISOString().slice(0, 10)}`;
}

function getWeeklyRefreshCounts(userId: string): number[] {
  if (typeof window === "undefined") return [0, 0];
  const raw = window.localStorage.getItem(
    `sportmatch_weekly_challenge_refresh_${getWeeklyChallengeKey(userId)}`,
  );
  if (!raw) return [0, 0];
  try {
    const parsed = JSON.parse(raw) as number | number[];
    if (Array.isArray(parsed)) return [Number(parsed[0] ?? 0), Number(parsed[1] ?? 0)];
    return [Number(parsed || 0), 0];
  } catch {
    return [Number(raw || 0), 0];
  }
}

function setWeeklyRefreshCounts(userId: string, counts: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `sportmatch_weekly_challenge_refresh_${getWeeklyChallengeKey(userId)}`,
    JSON.stringify([counts[0] ?? 0, counts[1] ?? 0]),
  );
}

function getWeeklyOverrideChallenges(userId: string): WeeklyChallengeDraft[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(
    `sportmatch_weekly_challenge_override_${getWeeklyChallengeKey(userId)}`,
  );
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WeeklyChallengeDraft | WeeklyChallengeDraft[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function setWeeklyOverrideChallenges(userId: string, challenges: WeeklyChallengeDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `sportmatch_weekly_challenge_override_${getWeeklyChallengeKey(userId)}`,
    JSON.stringify(challenges),
  );
}

function getPersistedWeeklyChallengeState(
  challenges: EngagementChallenge[],
  weekKey: string,
): { drafts: WeeklyChallengeDraft[]; refreshCounts: number[] } {
  const drafts: WeeklyChallengeDraft[] = [];
  const refreshCounts = [0, 0];
  for (const challenge of challenges) {
    const metadata = challenge.metadata ?? {};
    if (metadata.weekKey !== weekKey || metadata.source !== "home_weekly_challenge") continue;
    const index = Number(metadata.challengeIndex);
    if (index !== 0 && index !== 1) continue;
    if (!drafts[index]) {
      drafts[index] = {
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward_hint ?? "Recompensa sugerida al completar el reto.",
      };
    }
    refreshCounts[index] = Math.max(refreshCounts[index], Number(metadata.refreshCount ?? 1));
  }
  return { drafts, refreshCounts };
}

function getWeeklySelectedVenues(userId: string): string[] {
  if (typeof window === "undefined") return ["", ""];
  const key = `sportmatch_weekly_challenge_venue_${getWeeklyChallengeKey(userId)}`;
  const raw = window.localStorage.getItem(key);
  if (!raw) return ["", ""];
  try {
    const parsed = JSON.parse(raw) as string | string[];
    if (Array.isArray(parsed)) return [parsed[0] ?? "", parsed[1] ?? ""];
  } catch {
    // Compatibilidad con versiones anteriores que guardaban un solo id como texto plano.
  }
  return [raw, ""];
}

function setWeeklySelectedVenues(userId: string, venueIds: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `sportmatch_weekly_challenge_venue_${getWeeklyChallengeKey(userId)}`,
    JSON.stringify([venueIds[0] ?? "", venueIds[1] ?? ""]),
  );
}

function buildWeeklyChallengeRefreshPair(
  plan: AiRecommendationResponse | null,
  count: number,
): WeeklyChallengeDraft[] {
  const venue = plan?.recommendations.find((item) => item.type === "venue")?.title;
  const sport =
    plan?.recommendations.find((item) => item.type === "sport")?.title ??
    plan?.dailyChallenge.title ??
    "tu deporte principal";
  const variants = [
    [
      {
        title: "Mision precision y ritmo",
        description: `En ${sport}, completa 3 bloques: 8 minutos de calentamiento, 15 minutos de tecnica repetida y 12 minutos de ritmo continuo. Anota que parte te costo mas para comparar tu progreso.`,
        reward: "+50 FitCoins sugeridos si completas el reto y eliges una sede validable.",
      },
      {
        title: "Mision sede testigo",
        description: venue
          ? `Elige ${venue} u otra sede del mapa, realiza una sesion corta y pide validacion de la empresa responsable.`
          : "Elige una sede del mapa, realiza una sesion corta y pide validacion de la empresa responsable.",
        reward: "+45 FitCoins sugeridos cuando la empresa valide la actividad.",
      },
    ],
    [
      {
        title: "Mision duelo amistoso",
        description:
          "Coordina una actividad fisica con una persona compatible: define deporte, hora y objetivo del encuentro antes de asistir.",
        reward: "+60 FitCoins sugeridos si conviertes el reto en actividad real.",
      },
      {
        title: "Mision check-in deportivo",
        description:
          "Selecciona una sede, asiste a la actividad y deja que la empresa confirme que estuviste presente y cumpliste el reto.",
        reward: "+40 FitCoins sugeridos por validacion aprobada.",
      },
    ],
    [
      {
        title: "Mision mejora medible",
        description: `Haz una sesion de ${sport} y mide una mejora concreta: mas repeticiones, mejor tiempo, mas precision o mayor resistencia.`,
        reward: "+55 FitCoins sugeridos por progreso deportivo.",
      },
      {
        title: "Mision empresa validadora",
        description:
          "Selecciona una sede fisica, realiza la actividad ahi y deja registrada la empresa que revisara si cumpliste.",
        reward: "+45 FitCoins sugeridos tras aprobacion de la sede.",
      },
    ],
  ];
  return variants[count % variants.length];
}

function buildSingleWeeklyChallengeRefresh(
  plan: AiRecommendationResponse | null,
  challengeIndex: number,
  count: number,
): WeeklyChallengeDraft {
  const pair = buildWeeklyChallengeRefreshPair(plan, count + challengeIndex);
  return pair[challengeIndex] ?? pair[0];
}

function publicMatchToDashboardMatch(publicMatch: PublicMatch): Match {
  return {
    id: publicMatch.id,
    title: publicMatch.title,
    sport: publicMatch.sport,
    date: publicMatch.date,
    time: publicMatch.time,
    max_players: publicMatch.maxPlayers,
    required_level: publicMatch.level,
    creator_id: publicMatch.creatorId,
    status: publicMatch.status === "Full" ? "Full" : publicMatch.status,
    court_id: publicMatch.id,
    court: {
      id: publicMatch.id,
      name: publicMatch.courtName,
      address: publicMatch.address,
      district: publicMatch.address,
      sport: publicMatch.sport,
      lat: publicMatch.lat,
      lng: publicMatch.lng,
      price_per_hour: 0,
      rating: 4.5,
      reviews_count: 0,
      is_available: true,
    } as Court,
    current_players: publicMatch.participants.map((participant) => ({
      id: participant.userId,
      name: participant.name,
      avatar_url: participant.avatarUrl,
    })) as User[],
  } as Match;
}

function scoreRecommendedMatch(match: Match, user: User | null): number {
  if (!user) return 0;
  const sameSport = user.preferred_sports?.includes(match.sport as never) ? 50 : 0;
  const sameLevel =
    String(user.level).toLowerCase() === String(match.required_level).toLowerCase() ? 30 : 0;
  const openBonus = match.status !== "Full" && match.status !== "Finished" ? 20 : 0;
  return sameSport + sameLevel + openBonus;
}

function scoreNearbyPlayer(
  player: User,
  user: User | null,
  baseLocation: { lat: number; lng: number } | null,
) {
  const distance =
    baseLocation && player.last_location_lat && player.last_location_lng
      ? calculateDistance(
          baseLocation.lat,
          baseLocation.lng,
          player.last_location_lat,
          player.last_location_lng,
        )
      : player.distance_km;
  const distanceScore =
    typeof distance === "number" ? Math.max(0, 60 - Math.min(distance, 60)) : 15;
  const sportScore = player.preferred_sports?.some((sport) =>
    user?.preferred_sports?.includes(sport),
  )
    ? 25
    : 0;
  const trustScore = Math.min(player.trust_score ?? 0, 100) / 10;
  return { distance, score: distanceScore + sportScore + trustScore };
}

function scoreNearbyCourt(
  court: Court,
  user: User | null,
  baseLocation: { lat: number; lng: number } | null,
) {
  const distance = baseLocation
    ? calculateDistance(baseLocation.lat, baseLocation.lng, court.lat, court.lng)
    : undefined;
  const distanceScore =
    typeof distance === "number" ? Math.max(0, 70 - Math.min(distance, 70)) : 20;
  const sportScore = user?.preferred_sports?.includes(court.sport as never) ? 25 : 0;
  const ratingScore = Math.round((court.rating ?? 4) * 2);
  return { distance, score: distanceScore + sportScore + ratingScore };
}

function isLegacyDailyPlan(plan: AiRecommendationResponse): boolean {
  const title = plan.dailyChallenge.title.toLowerCase();
  const description = plan.dailyChallenge.description.toLowerCase();
  const combined = `${title} ${description}`;
  const nonPhysicalKeywords = [
    "iracing",
    "i racing",
    "simracing",
    "sim racing",
    "f1 sim",
    "f1sim",
    "formula 1 sim",
    "simulador",
    "simulator",
    "simulation",
    "gran turismo",
    "assetto",
    "e-sport",
    "esport",
    "gaming",
    "videojuego",
  ];
  return (
    title.includes("reto de activacion") ||
    title.includes("reto de activación") ||
    description.includes("crea una publicacion") ||
    description.includes("crea una publicación") ||
    description.includes("conecta con un jugador recomendado") ||
    nonPhysicalKeywords.some((keyword) => combined.includes(keyword))
  );
}

function isPhysicalVenueSport(sport: string | null | undefined): boolean {
  const normalized = (sport ?? "").toLowerCase();
  const virtualKeywords = [
    "iracing",
    "simracing",
    "sim racing",
    "f1 sim",
    "simulador",
    "simulator",
    "e-sport",
    "esport",
    "gaming",
    "videojuego",
  ];
  return !virtualKeywords.some((keyword) => normalized.includes(keyword));
}

// === BLOQUE: Cache local del plan diario ===
// Evita consultar el backend cada vez que se entra al Home durante el mismo dia.
// El backend sigue siendo la fuente real; localStorage solo evita parpadeos y llamadas repetidas.
function readCachedDailyPlan(userId: string): AiRecommendationResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getDailyPlanCacheKey(userId));
    if (!raw) return null;
    const plan = JSON.parse(raw) as AiRecommendationResponse;
    const expiresAt = plan.metadata?.expiresAt ? new Date(plan.metadata.expiresAt).getTime() : 0;
    if (expiresAt && expiresAt <= Date.now()) return null;
    if (isLegacyDailyPlan(plan)) return null;
    return plan;
  } catch {
    return null;
  }
}

function writeCachedDailyPlan(userId: string, plan: AiRecommendationResponse) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getDailyPlanCacheKey(userId), JSON.stringify(plan));
  } catch {
    // Si el navegador bloquea storage, la app sigue funcionando con el snapshot del backend.
  }
}

// === BLOQUE: Dashboard — Componente principal del panel de inicio ===
// Secciones:
//   - Hero con saludo, nivel, Trust Score y partidos jugados.
//   - Sport chips (filtro por deporte).
//   - Próximo partido o prompt para encontrar/crear uno.
//   - Lista de partidos recomendados con MatchCard.
//   - Sidebar: billetera, racha semanal, jugadores cerca, canchas cercanas.
//   - Dialog de creación de partido y PostMatchReviewForm.
function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedSport, setSelectedSport] = useState<string>("Todos");
  const user = useAuthStore((state) => state.user);
  const { balance: walletBalance, initWallet } = useWalletStore();
  const publicMatches = usePublicMatchStore((state) => state.publicMatches);
  const cachedInitialPlan = user ? readCachedDailyPlan(user.id) : null;
  const [dailyPlan, setDailyPlan] = useState<AiRecommendationResponse | null>(cachedInitialPlan);
  const [dailyPlanStatus, setDailyPlanStatus] = useState<DailyPlanStatus>(
    cachedInitialPlan ? "ready" : "idle",
  );
  const [dailyPlanRefreshKey, setDailyPlanRefreshKey] = useState(0);
  const [challengeRefreshCounts, setChallengeRefreshCounts] = useState<number[]>(
    user ? getWeeklyRefreshCounts(user.id) : [0, 0],
  );
  const [overrideChallenges, setOverrideChallenges] = useState<WeeklyChallengeDraft[]>(
    user ? getWeeklyOverrideChallenges(user.id) : [],
  );
  const [selectedWeeklyVenueIds, setSelectedWeeklyVenueIds] = useState<string[]>(
    user ? getWeeklySelectedVenues(user.id) : ["", ""],
  );

  useEffect(() => {
    initWallet();
  }, [initWallet]);

  useEffect(() => {
    if (!user) return;
    setChallengeRefreshCounts(getWeeklyRefreshCounts(user.id));
    setOverrideChallenges(getWeeklyOverrideChallenges(user.id));
    setSelectedWeeklyVenueIds(getWeeklySelectedVenues(user.id));
  }, [user]);

  useEffect(() => {
    if (!user || useAuthStore.getState().isDemoMode) return;
    let active = true;
    getEngagementChallenges()
      .then((challenges) => {
        if (!active) return;
        const { drafts, refreshCounts } = getPersistedWeeklyChallengeState(
          challenges,
          getWeeklyChallengeKey(user.id),
        );
        if (drafts.length > 0) {
          setOverrideChallenges(drafts);
          setWeeklyOverrideChallenges(user.id, drafts);
        }
        if (refreshCounts.some((count) => count > 0)) {
          setChallengeRefreshCounts(refreshCounts);
          setWeeklyRefreshCounts(user.id, refreshCounts);
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn("No se pudieron restaurar retos persistidos:", error);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleRefreshWeeklyChallenge = async (challengeIndex: number) => {
    if (!user || challengeRefreshCounts[challengeIndex] >= 1) return;
    const nextCounts = [...challengeRefreshCounts];
    nextCounts[challengeIndex] = (nextCounts[challengeIndex] ?? 0) + 1;
    const nextChallenge = buildSingleWeeklyChallengeRefresh(
      dailyPlan,
      challengeIndex,
      nextCounts[challengeIndex],
    );
    const nextChallenges = [...overrideChallenges];
    nextChallenges[challengeIndex] = nextChallenge;
    setWeeklyRefreshCounts(user.id, nextCounts);
    setWeeklyOverrideChallenges(user.id, nextChallenges);
    setChallengeRefreshCounts(nextCounts);
    setOverrideChallenges(nextChallenges);

    saveEngagementChallenge({
      title: nextChallenge.title,
      description: nextChallenge.description,
      rewardHint: nextChallenge.reward,
      metadata: {
        source: "home_weekly_challenge",
        weekKey: getWeeklyChallengeKey(user.id),
        challengeIndex,
        refreshCount: nextCounts[challengeIndex],
      },
    }).catch((error) => {
      if (import.meta.env.DEV) console.warn("No se pudo persistir reto actualizado:", error);
    });

    toast.success(`Reto ${challengeIndex + 1} actualizado`, {
      description: "Se genero una nueva mision usando tu perfil deportivo.",
    });
  };

  const handleSelectWeeklyVenue = (challengeIndex: number, venueId: string) => {
    if (!user) return;
    const nextVenueIds = [...selectedWeeklyVenueIds];
    nextVenueIds[challengeIndex] = venueId;
    setWeeklySelectedVenues(user.id, nextVenueIds);
    setSelectedWeeklyVenueIds(nextVenueIds);
    const venue = closestCourts.find((court) => court.id === venueId);
    toast.success("Sede seleccionada para el reto", {
      description: venue
        ? `${venue.name} validara tu actividad cuando la completes.`
        : "La empresa responsable validara tu actividad.",
    });
  };

  // === BLOQUE: Retos semanales ===
  // Consume el snapshot del motor de recomendaciones y lo presenta como 2 retos semanales.
  // Si no existe snapshot, el backend puede generarlo; si falla, la UI muestra reintento claro.
  useEffect(() => {
    if (!user) return;
    if (useAuthStore.getState().isDemoMode) {
      setDailyPlanStatus("error");
      return;
    }

    const cachedPlan = readCachedDailyPlan(user.id);
    if (cachedPlan) {
      setDailyPlan(cachedPlan);
      setDailyPlanStatus("ready");
      return;
    }

    let active = true;
    setDailyPlanStatus("loading");
    getTodayAiRecommendations()
      .then((plan) => {
        if (!active) return;
        setDailyPlan(plan);
        writeCachedDailyPlan(user.id, plan);
        setDailyPlanStatus("ready");
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn("No se pudo cargar el plan deportivo diario:", error);
        if (active) setDailyPlanStatus("error");
      });
    return () => {
      active = false;
    };
  }, [dailyPlanRefreshKey, user]);

  // === BLOQUE: Racha deportiva y días de asistencia ===
  const [streak, setStreak] = useState<{ current_streak: number; max_streak: number } | null>(null);
  const [attendanceDays, setAttendanceDays] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    if (useAuthStore.getState().isDemoMode) {
      // En modo demo, usa localStorage para persistir racha y asistencia.
      const storedStreak = localStorage.getItem(`sportmatch_demo_streak_${user.id}`);
      if (storedStreak) {
        setStreak(JSON.parse(storedStreak));
      } else {
        const defaultStreak = { current_streak: 3, max_streak: 5 };
        setStreak(defaultStreak);
        localStorage.setItem(`sportmatch_demo_streak_${user.id}`, JSON.stringify(defaultStreak));
      }

      const storedAttendance = localStorage.getItem(`sportmatch_demo_attendance_${user.id}`);
      if (storedAttendance) {
        setAttendanceDays(JSON.parse(storedAttendance));
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        const dayMinus3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const dayMinus7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const mockAttendance = [todayStr, dayMinus3, dayMinus7];
        setAttendanceDays(mockAttendance);
        localStorage.setItem(
          `sportmatch_demo_attendance_${user.id}`,
          JSON.stringify(mockAttendance),
        );
      }
    } else {
      // En modo real, consulta user_stats y match_participants desde Supabase.
      const fetchStats = async () => {
        try {
          const { data: stats } = await supabase
            .from("user_stats")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (stats) {
            setStreak({ current_streak: stats.current_streak, max_streak: stats.max_streak });
          } else {
            setStreak({ current_streak: 0, max_streak: 0 });
          }

          const { data: participants } = await supabase
            .from("match_participants")
            .select("joined_at, matches(date)")
            .eq("user_id", user.id)
            .eq("status", "ATTENDED");

          if (participants) {
            const days = (
              participants as unknown as {
                joined_at: string;
                matches: { date: string } | null;
              }[]
            )
              .map((p) => p.matches?.date || p.joined_at?.split("T")[0])
              .filter(Boolean);
            setAttendanceDays(days);
          }
        } catch (err) {
          console.error("Error fetching user stats/attendance:", err);
        }
      };

      fetchStats();
    }
  }, [user]);

  // === BLOQUE: contributionGrid — Cuadrícula SVG de asistencia (35 días) ===
  const contributionGrid = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - daysToMonday - 28);

    const cells = [];
    for (let d = 0; d < 35; d++) {
      const current = new Date(startDay);
      current.setDate(startDay.getDate() + d);
      const dateStr = current.toISOString().split("T")[0];
      const dayVal = current.getDay();
      const row = dayVal === 0 ? 6 : dayVal - 1;
      const col = Math.floor(d / 7);
      cells.push({ date: dateStr, row, col });
    }
    return cells;
  }, []);

  // === BLOQUE: Geolocalización del usuario ===
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reviewMatch, setReviewMatch] = useState<Match | null>(null);
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          if (import.meta.env.DEV)
            console.warn("Geolocation API unavailable or permission denied.", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    }
  }, []);

  // Ubicación base: coordenadas en tiempo real o última ubicación conocida del perfil.
  const baseLocation = useMemo(() => {
    if (userCoords) return userCoords;
    if (user && user.last_location_lat && user.last_location_lng) {
      return { lat: user.last_location_lat, lng: user.last_location_lng };
    }
    return null;
  }, [userCoords, user]);

  // === BLOQUE: Datos del loader ===
  const { matches, users, courts, sports } = Route.useLoaderData() as {
    matches: Match[];
    users: User[];
    courts: Court[];
    sports: SportCatalog[];
  };

  const [liveMatches, setLiveMatches] = useState<Match[]>(matches);

  useEffect(() => {
    setLiveMatches(matches);
  }, [matches]);

  // === BLOQUE: nextMatch — Próximo partido del usuario ===
  const nextMatch = useMemo(() => {
    if (!user) return null;
    const userMatches = liveMatches.filter((m) => {
      const isCreator = m.creator_id === user.id;
      const isParticipant = m.current_players?.some((p) => p.id === user.id);
      if (!isCreator && !isParticipant) return false;

      try {
        const matchStart = new Date(`${m.date}T${m.time}`);
        return matchStart.getTime() > Date.now();
      } catch {
        return false;
      }
    });

    if (userMatches.length === 0) return null;

    return userMatches.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time}`).getTime();
      const timeB = new Date(`${b.date}T${b.time}`).getTime();
      return timeA - timeB;
    })[0];
  }, [liveMatches, user]);

  // === BLOQUE: Realtime subscription a la tabla matches ===
  useEffect(() => {
    if (useAuthStore.getState().isDemoMode) return;

    const channel = supabase
      .channel("public:matches")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMatch = payload.new as Match;
            try {
              const { data: courtData } = await supabase
                .from("courts")
                .select("*")
                .eq("id", newMatch.court_id)
                .single();

              const matchWithCourt = {
                ...newMatch,
                court: courtData || undefined,
                current_players: [],
              };

              setLiveMatches((prev) => {
                if (prev.some((m) => m.id === newMatch.id)) return prev;
                return [matchWithCourt, ...prev];
              });
            } catch (err) {
              console.error("Error fetching court details for realtime match insert:", err);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMatch = payload.new as Match;
            setLiveMatches((prev) =>
              prev.map((m) => (m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m)),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedMatch = payload.old as { id: string };
            setLiveMatches((prev) => prev.filter((m) => m.id !== deletedMatch.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // === BLOQUE: Rating Loop — Solicita review post-partido ===
  // Detecta partidos pasados en los que el usuario asistió (ATTENDED)
  // y verifica geolocalización (dentro de 100m de la cancha) antes de
  // mostrar el formulario de calificación.
  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    const reviewedIds = JSON.parse(
      localStorage.getItem(`sportmatch_reviewed_matches_${currentUser.id}`) || "[]",
    );

    async function checkRatingLoop() {
      const candidates = matches.filter((m) => {
        const isPart =
          m.creator_id === currentUser.id ||
          m.current_players?.some((p) => p.id === currentUser.id);
        if (!isPart) return false;

        const matchStart = new Date(`${m.date}T${m.time}`);
        const isPast = matchStart.getTime() < Date.now();

        const isCompleted =
          (m.status as string) === "COMPLETED" || m.status === "Finished" || isPast;
        if (!isCompleted) return false;

        return !reviewedIds.includes(m.id);
      });

      if (candidates.length === 0) return;

      for (const match of candidates) {
        let isAttended = false;

        if (useAuthStore.getState().isDemoMode) {
          isAttended = localStorage.getItem(`sportmatch_demo_checkin_${match.id}`) === "true";
        } else {
          try {
            const { data: participant } = await supabase
              .from("match_participants")
              .select("status")
              .eq("match_id", match.id)
              .eq("user_id", currentUser.id)
              .single();
            isAttended = participant?.status === "ATTENDED";
          } catch (e) {
            console.warn("Failed to query match status:", e);
          }
        }

        if (!isAttended) continue;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLat = position.coords.latitude;
              const userLng = position.coords.longitude;
              const courtLat = match.court?.lat || -12.1221;
              const courtLng = match.court?.lng || -77.0298;

              const distance = calculateDistance(userLat, userLng, courtLat, courtLng);
              const threshold = 0.1;

              if (distance <= threshold) {
                setReviewMatch(match);
              } else {
                console.warn(
                  `Usuario demasiado lejos (${(distance * 1000).toFixed(0)}m) para calificar partido ${match.id}`,
                );
              }
            },
            (err) => {
              console.warn("Error de geolocalización en rating loop:", err);
            },
            { enableHighAccuracy: true, timeout: 5000 },
          );
        }
        break;
      }
    }

    checkRatingLoop();
  }, [matches, user]);

  const publicMatchesForDashboard = useMemo(
    () => publicMatches.map(publicMatchToDashboardMatch),
    [publicMatches],
  );

  // === BLOQUE: Partidos recomendados ===
  // Une partidos reales con partidos publicos del tablero y los ordena por compatibilidad simple.
  // Asi Home no queda vacio cuando el backend no trae matches, pero respeta lo que existe en /app/match.
  const recommendedMatches = useMemo(() => {
    const byId = new Map<string, Match>();
    [...liveMatches, ...publicMatchesForDashboard].forEach((match) => {
      byId.set(match.id, match);
    });
    return [...byId.values()]
      .map((match) => ({ match, score: scoreRecommendedMatch(match, user) }))
      .filter(
        ({ match, score }) => score > 0 && match.status !== "Full" && match.status !== "Finished",
      )
      .sort((a, b) => b.score - a.score)
      .map(({ match }) => match);
  }, [liveMatches, publicMatchesForDashboard, user]);

  const filteredMatches =
    selectedSport !== "Todos"
      ? recommendedMatches.filter((m) => m.sport === selectedSport)
      : recommendedMatches.slice(0, 4);
  const visibleRecommendedMatches = filteredMatches.slice(0, 4);
  const isResolvingRecommendedMatches =
    recommendedMatches.length === 0 &&
    liveMatches.length === 0 &&
    publicMatchesForDashboard.length === 0;

  // Canchas más cercanas según ubicación base.
  const nearbyPlayers = useMemo(() => {
    return users
      .filter((candidate) => candidate.id !== user?.id && candidate.user_role !== "BUSINESS")
      .map((candidate) => ({
        ...candidate,
        proximity: scoreNearbyPlayer(candidate, user, baseLocation),
      }))
      .sort((a, b) => b.proximity.score - a.proximity.score)
      .slice(0, 4);
  }, [users, user, baseLocation]);

  const closestCourts = useMemo(() => {
    return [...courts]
      .map((c) => ({
        ...c,
        proximity: scoreNearbyCourt(c, user, baseLocation),
        distance: baseLocation
          ? calculateDistance(baseLocation.lat, baseLocation.lng, c.lat, c.lng)
          : undefined,
      }))
      .sort((a, b) => b.proximity.score - a.proximity.score)
      .slice(0, 5);
  }, [courts, user, baseLocation]);

  const SPORTS = [
    { name: "Todos", emoji: "◎" },
    ...(sports.length > 0
      ? sports.map((s) => ({ name: s.name, emoji: getSportEmoji(s.name) }))
      : [
          { name: "Pádel", emoji: "🏓" },
          { name: "Fútbol", emoji: "⚽" },
          { name: "Tenis", emoji: "🎾" },
          { name: "Running", emoji: "🏃" },
        ]),
  ];

  // === BLOQUE: Estados para el modal de creación de partido ===
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [matchTitle, setMatchTitle] = useState("");
  const [matchSport, setMatchSport] = useState("");
  const [matchCourtId, setMatchCourtId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchMaxPlayers, setMatchMaxPlayers] = useState<number>(4);
  const [matchLevel, setMatchLevel] = useState<Level>("Intermedio");
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);

  // Carga las canchas filtradas por deporte cuando se abre el modal.
  useEffect(() => {
    if (!isCreateModalOpen) return;

    let active = true;
    setLoadingCourts(true);

    backendApi.courts
      .getAll(matchSport || undefined)
      .then((res) => {
        if (active) {
          if (res && Array.isArray(res.data)) {
            setFilteredCourts(res.data);
          } else {
            apiClient.courts
              .getAll(matchSport || undefined)
              .then((resVal) => {
                if (active) {
                  setFilteredCourts(resVal);
                }
              })
              .catch((err) => {
                console.error("Error loading filtered courts:", err);
              });
          }
        }
      })
      .catch(() => {
        apiClient.courts
          .getAll(matchSport || undefined)
          .then((resVal) => {
            if (active) {
              setFilteredCourts(resVal);
            }
          })
          .catch((err) => {
            console.error("Error loading filtered courts:", err);
          });
      })
      .finally(() => {
        if (active) setLoadingCourts(false);
      });

    return () => {
      active = false;
    };
  }, [matchSport, isCreateModalOpen]);

  // === BLOQUE: handleCreateMatch — Crea un nuevo partido ===
  // Intenta backendApi primero, fallback a apiClient (mock).
  // Luego inserta al creador en match_participants.
  // Finalmente invalida el router para refrescar los datos.
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para crear un partido.");
      return;
    }
    if (!matchTitle || !matchSport || !matchDate || !matchTime || !matchMaxPlayers || !matchLevel) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      setIsCreatingMatch(true);
      let newMatch: Match;

      const token = user.id;
      const backendResult = await backendApi.matches
        .create(token, {
          title: matchTitle,
          sport: matchSport,
          court_id: matchCourtId || undefined,
          date: matchDate,
          time: matchTime,
          max_players: Number(matchMaxPlayers),
          required_level: matchLevel,
        })
        .catch(() => null);

      if (backendResult?.data) {
        newMatch = backendResult.data as Match;
      } else {
        newMatch = await apiClient.matches.create({
          title: matchTitle,
          sport: matchSport,
          court_id: matchCourtId || null,
          date: matchDate,
          time: matchTime,
          max_players: Number(matchMaxPlayers),
          required_level: matchLevel,
          creator_id: user.id,
        });
      }

      if (!useAuthStore.getState().isDemoMode) {
        const { error: partError } = await withTimeout(
          supabase.from("match_participants").insert({
            match_id: newMatch.id,
            user_id: user.id,
            status: "ACCEPTED",
          }),
        );

        if (partError) {
          if (import.meta.env.DEV) console.error("Error joining creator to match:", partError);
        }
      }

      toast.success("¡Partido creado con éxito!");
      setIsCreateModalOpen(false);

      setMatchTitle("");
      setMatchSport("");
      setMatchCourtId("");
      setMatchDate("");
      setMatchTime("");
      setMatchMaxPlayers(4);
      setMatchLevel("Intermedio");

      await router.invalidate();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Error al crear el partido: " + msg);
    } finally {
      setIsCreatingMatch(false);
    }
  };

  if (!user) return null;

  // === BLOQUE: Renderizado — UI del dashboard ===
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* === HERO: Saludo y estadísticas del usuario === */}
      <div className="rounded-3xl bg-gradient-card border border-border/60 p-6 md:p-8 shadow-card relative overflow-hidden mb-8 group">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-gradient-primary opacity-15 blur-3xl group-hover:opacity-25 transition-opacity duration-700" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-neon/5 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative">
          <div>
            <div className="text-sm text-muted-foreground/70 font-medium mb-1">Hola,</div>
            <h1 className="font-heading text-4xl md:text-5xl tracking-wide text-foreground">
              {user.name.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Tenés <span className="text-neon font-semibold">{matches.length}</span> partidos
              compatibles cerca tuyo hoy.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/app/match"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Sparkles className="h-4 w-4" /> Encontrar partido
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[260px]">
            <Stat
              icon={<Trophy className="h-4 w-4 text-neon" />}
              label="Nivel"
              value={user.level}
            />
            <Stat
              icon={<Flame className="h-4 w-4 text-warning" />}
              label="Trust"
              value={`${user.trust_score}%`}
            />
            <Stat
              icon={<Users className="h-4 w-4 text-electric" />}
              label="Partidos"
              value={user.matches_played}
            />
          </div>
        </div>
      </div>

      {/* === Sport chips (filtro por deporte) === */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4">
        {SPORTS.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelectedSport(s.name)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all ${
              selectedSport === s.name
                ? "bg-gradient-neon text-neon-foreground shadow-neon font-semibold"
                : "bg-muted border border-border/40 text-foreground hover:bg-accent"
            }`}
          >
            <span>{s.emoji}</span> {s.name}
          </button>
        ))}
      </div>

      <DailySportsPlan
        plan={dailyPlan}
        status={dailyPlanStatus}
        onRetry={() => setDailyPlanRefreshKey((current) => current + 1)}
        overrideChallenges={overrideChallenges}
        refreshesRemaining={challengeRefreshCounts.map((count) => Math.max(0, 1 - count))}
        onRefreshChallenge={handleRefreshWeeklyChallenge}
        venues={closestCourts.filter((court) => isPhysicalVenueSport(court.sport))}
        selectedVenueIds={selectedWeeklyVenueIds}
        onSelectVenue={handleSelectWeeklyVenue}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* === Columna principal (2/3) === */}
        <div className="lg:col-span-2 space-y-6">
          {/* Próximo partido */}
          {nextMatch ? (
            <div className="animate-slide-up">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neon animate-pulse-ring" />
                {t("dashboard.next_match", "Próximo Partido")}
              </h3>
              <div className="bg-gradient-card border border-primary/20 rounded-2xl p-5 shadow-neon relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-lift">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-neon/5 blur-2xl pointer-events-none" />
                <div className="flex gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-neon shrink-0 grid place-items-center shadow-neon">
                    <Calendar className="h-5 w-5 text-neon-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] bg-neon/20 text-neon font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {nextMatch.sport}
                    </span>
                    <h4 className="font-heading text-xl tracking-wide text-foreground mt-1">
                      {nextMatch.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {nextMatch.date} a las {nextMatch.time} hrs
                    </p>
                    {nextMatch.court && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {nextMatch.court.name} · {nextMatch.court.district}
                      </p>
                    )}
                  </div>
                </div>
                {nextMatch.court_id ? (
                  <Link
                    to="/app/courts/$courtId"
                    params={{ courtId: nextMatch.court_id }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 w-full sm:w-auto text-center"
                  >
                    Ver Detalles
                  </Link>
                ) : (
                  <Link
                    to="/app/map"
                    className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 w-full sm:w-auto text-center"
                  >
                    Ver Mapa
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gradient-card border border-border/60 rounded-2xl flex items-center justify-between gap-4 card-lift">
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  {t("dashboard.no_next_match", "No tienes partidos programados")}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organiza una pichanga o únete a una hoy.
                </p>
              </div>
              <Link
                to="/app/match"
                className="px-4 py-2 rounded-xl bg-accent text-foreground hover:bg-accent/80 font-bold text-xs transition-colors shrink-0"
              >
                {t("dashboard.find_one", "Encontrar")}
              </Link>
            </div>
          )}

          {/* === Partidos recomendados === */}
          <div className="space-y-4">
            <div className="flex items-end justify-between mb-1">
              <div>
                <h2 className="font-heading text-2xl tracking-wide text-foreground">
                  Partidos recomendados
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSport === "Todos"
                    ? "Basado en partidos públicos, tu deporte y tu nivel"
                    : `Mostrando solo partidos de ${selectedSport}`}
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-xs shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Crear Partido
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {isResolvingRecommendedMatches ? (
                <div className="col-span-2 p-10 text-center glass rounded-2xl border border-border/40">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">
                    Cargando partidos recomendados...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estamos revisando partidos públicos y compatibilidad.
                  </p>
                </div>
              ) : visibleRecommendedMatches.length > 0 ? (
                visibleRecommendedMatches.map((m) => <MatchCard key={m.id} match={m} />)
              ) : (
                <div className="col-span-2 p-10 text-center text-muted-foreground/60 glass rounded-2xl border border-border/40">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium">
                    No hay partidos recomendados para este deporte.
                  </p>
                  <p className="text-xs text-muted-foreground/40 mt-1">
                    Prueba con otro deporte o crea uno nuevo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === Sidebar (1/3) === */}
        <div className="space-y-6">
          {/* Billetera Digital */}
          <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card relative overflow-hidden card-lift group">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-primary opacity-10 blur-xl group-hover:opacity-20 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary shrink-0 grid place-items-center shadow-glow">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground font-medium">Billetera Digital</div>
                <div className="text-2xl font-bold font-heading text-foreground mt-0.5 tracking-wide flex items-baseline gap-1">
                  <span>{walletBalance}</span>
                  <span className="text-xs text-neon font-semibold font-sans">FC</span>
                </div>
              </div>
              <Link
                to="/app/wallet"
                search={{ buyItem: undefined }}
                className="px-4 py-2.5 rounded-xl bg-gradient-neon text-neon-foreground font-bold text-xs shadow-neon hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Ver mi Billetera
              </Link>
            </div>
          </div>

          {/* Racha semanal y gráfico de contribución SVG */}
          <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neon/10">
                  <Flame className="h-4 w-4 text-neon" />
                </div>
                <h3 className="font-heading text-lg tracking-wide text-foreground">
                  {t("onboarding.streak_title", "Racha Deportiva")}
                </h3>
              </div>
              {streak && (
                <div className="text-[9px] text-muted-foreground flex items-center gap-1.5 font-mono">
                  <span>
                    <strong className="text-neon">{streak.current_streak}</strong>
                    {streak.current_streak === 1
                      ? t("onboarding.streak_unit_sing", "sem")
                      : t("onboarding.streak_unit_plur", "sems")}
                  </span>
                  <span className="text-border">·</span>
                  <span>
                    <span className="text-muted-foreground">max</span>{" "}
                    <strong className="text-foreground">{streak.max_streak}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <svg width="220" height="110" viewBox="0 0 220 110" className="text-foreground/80">
                  <text x="5" y="18" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_mon", "Lun")}
                  </text>
                  <text x="5" y="46" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_wed", "Mié")}
                  </text>
                  <text x="5" y="74" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_fri", "Vie")}
                  </text>
                  <text x="5" y="102" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_sun", "Dom")}
                  </text>

                  {contributionGrid.map((cell, idx) => {
                    const isAttended = attendanceDays.includes(cell.date);
                    const x = 35 + cell.col * 36;
                    const y = 10 + cell.row * 14;

                    return (
                      <rect
                        key={idx}
                        x={x}
                        y={y}
                        width="10"
                        height="10"
                        rx="2"
                        fill={isAttended ? "var(--neon)" : "var(--muted)"}
                        stroke={isAttended ? "var(--neon)" : "var(--border)"}
                        strokeWidth="0.5"
                        className={`transition-all duration-300 hover:stroke-foreground hover:stroke-[1.5px] ${isAttended ? "shadow-neon" : ""}`}
                      >
                        <title>{cell.date}</title>
                      </rect>
                    );
                  })}
                </svg>
              </div>
              <p className="text-[9px] text-muted-foreground/70 text-center leading-relaxed">
                Los días con asistencia se iluminan en{" "}
                <span className="text-neon font-bold">Verde Neón</span>.
              </p>
            </div>
          </div>

          {/* Jugadores cerca */}
          <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg tracking-wide text-foreground">
                Jugadores cerca
              </h3>
              <Link
                to="/app/match"
                className="text-[10px] text-neon hover:text-neon/80 flex items-center gap-1 font-semibold transition-colors"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {nearbyPlayers.map((p) => {
                const isMe = p.id === user?.id;
                const distanceLabel =
                  typeof p.proximity.distance === "number"
                    ? `${p.proximity.distance.toFixed(1)} km`
                    : p.proximity.score >= 45
                      ? "Prioridad alta"
                      : p.proximity.score >= 25
                        ? "Prioridad media"
                        : "Prioridad general";
                return (
                  <Link
                    key={p.id}
                    to={isMe ? "/app/profile" : "/app/profile/$userId"}
                    params={isMe ? undefined : { userId: p.id }}
                    className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer text-left w-full group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full bg-muted object-cover border border-border/30 group-hover:border-neon/30 transition-colors"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-neon border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-foreground/90 group-hover:text-foreground transition-colors flex items-center gap-1">
                        {p.name}
                        {p.dni_verificado && <VerifiedBadge />}
                        {isMe && (
                          <span className="text-[9px] text-muted-foreground ml-1">(tú)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground/70 truncate">
                        {p.preferred_sports?.[0] || "Sin deporte"} · {distanceLabel}
                      </div>
                    </div>
                    <span className="text-[11px] text-neon flex items-center gap-1 shrink-0 font-semibold">
                      <Star className="h-3 w-3 fill-neon" /> {p.trust_score}
                    </span>
                  </Link>
                );
              })}
              {nearbyPlayers.length === 0 && (
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-xs text-muted-foreground">
                  Aun no hay jugadores disponibles para recomendar.
                </div>
              )}
            </div>
          </div>

          {/* Canchas cercanas */}
          <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
            <h3 className="font-heading text-lg tracking-wide text-foreground mb-4">
              Canchas cercanas
            </h3>
            <div className="space-y-3">
              {closestCourts.map((c) => (
                <CourtCard
                  key={`${c.id}-${c.name}-${c.district}`}
                  court={c}
                  onClick={() => setSelectedCourtForBooking(c)}
                  baseLocation={baseLocation}
                  variant="list"
                />
              ))}
              {closestCourts.length === 0 && (
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-xs text-muted-foreground">
                  Aun no hay canchas o sedes registradas para recomendar.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === Modal de creación de partido === */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-background border border-border/60 rounded-3xl p-6 shadow-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide text-foreground">
              Crear nuevo partido
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/70">
              Completa los detalles para invitar a otros jugadores.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMatch} className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                Título del partido
              </label>
              <input
                type="text"
                required
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                placeholder="Ej. Dobles de Pádel"
                className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Deporte
                </label>
                <select
                  required
                  value={matchSport}
                  onChange={(e) => {
                    setMatchSport(e.target.value);
                    setMatchCourtId("");
                  }}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
                >
                  <option value="">Selecciona...</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Nivel requerido
                </label>
                <select
                  required
                  value={matchLevel}
                  onChange={(e) => setMatchLevel(e.target.value as Level)}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                Cancha (Opcional)
              </label>
              <select
                value={matchCourtId}
                onChange={(e) => setMatchCourtId(e.target.value)}
                disabled={!matchSport}
                className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all disabled:opacity-40"
              >
                <option value="">
                  {!matchSport
                    ? "Selecciona primero un deporte..."
                    : "Ninguna (Sin Cancha Reservada)"}
                </option>
                {loadingCourts ? (
                  <option disabled>Cargando canchas...</option>
                ) : (
                  filteredCourts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (${c.price_per_hour}/h)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                Máx. Jugadores
              </label>
              <input
                type="number"
                required
                min="1"
                value={matchMaxPlayers}
                onChange={(e) => setMatchMaxPlayers(Number(e.target.value))}
                className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingMatch}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] text-sm tracking-wide"
            >
              {isCreatingMatch ? "Creando..." : "Crear Partido"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* === Modal de review post-partido === */}
      <Dialog
        open={!!reviewMatch}
        onOpenChange={(open) => {
          if (!open) setReviewMatch(null);
        }}
      >
        <DialogContent className="max-w-md bg-background border border-border/60 rounded-3xl p-6 shadow-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide text-foreground">
              {t("feedback.modal_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/70">
              Ayúdanos a mantener una comunidad saludable calificando tu experiencia.
            </DialogDescription>
          </DialogHeader>
          {reviewMatch && (
            <PostMatchReviewForm
              match={reviewMatch}
              onClose={() => {
                const reviewedIds = JSON.parse(
                  localStorage.getItem(`sportmatch_reviewed_matches_${user?.id}`) || "[]",
                );
                localStorage.setItem(
                  `sportmatch_reviewed_matches_${user?.id}`,
                  JSON.stringify([...reviewedIds, reviewMatch.id]),
                );
                setReviewMatch(null);
                router.invalidate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <BookingModal
        court={selectedCourtForBooking}
        isOpen={selectedCourtForBooking !== null}
        onOpenChange={(open) => !open && setSelectedCourtForBooking(null)}
        baseLocation={baseLocation}
      />
    </div>
  );
}

// === BLOQUE: DailySportsPlan - Resumen deportivo diario en Home ===
// Presenta recomendaciones persistidas como una mejora contextual del dashboard,
// sin exponer detalles tecnicos del proveedor o modelo usado por el backend.
function DailySportsPlan({
  plan,
  status,
  onRetry,
  overrideChallenges,
  refreshesRemaining,
  onRefreshChallenge,
  venues,
  selectedVenueIds,
  onSelectVenue,
}: {
  plan: AiRecommendationResponse | null;
  status: DailyPlanStatus;
  onRetry: () => void;
  overrideChallenges: WeeklyChallengeDraft[];
  refreshesRemaining: number[];
  onRefreshChallenge: (challengeIndex: number) => void;
  venues: Court[];
  selectedVenueIds: string[];
  onSelectVenue: (challengeIndex: number, venueId: string) => void;
}) {
  const isLoading = status === "loading";
  const isError = status === "error";
  const [isVenuePickerOpen, setIsVenuePickerOpen] = useState(false);
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0);
  const activeSelectedVenueId = selectedVenueIds[activeChallengeIndex] ?? "";
  const venueRecommendation = plan?.recommendations.find((item) => item.type === "venue");
  const selectedVenues = selectedVenueIds.map((venueId) =>
    venues.find((venue) => venue.id === venueId),
  );
  const activeSelectedVenue = selectedVenues[activeChallengeIndex];
  const achievement = plan?.achievementIdea.name ?? "Proximo logro deportivo";
  const primaryOverride = overrideChallenges[0];
  const venueOverride = overrideChallenges[1];
  const weeklyChallenges = [
    {
      title: primaryOverride?.title ?? plan?.dailyChallenge.title ?? "Preparando reto principal",
      description:
        primaryOverride?.description ??
        plan?.dailyChallenge.description ??
        "Estamos revisando tu perfil y actividad reciente para proponerte un reto fisico de la semana.",
      reward:
        primaryOverride?.reward ??
        plan?.dailyChallenge.rewardHint ??
        "Se mostrara cuando el reto este listo",
      statusLabel: selectedVenues[0]
        ? primaryOverride
          ? "Actualizado con sede"
          : "Sede seleccionada"
        : primaryOverride
          ? "Actualizado"
          : plan
            ? "Pendiente de sede"
            : isLoading
              ? "Cargando"
              : "No cargado",
      canRefresh: Boolean(plan) && (refreshesRemaining[0] ?? 0) > 0,
    },
    {
      title: venueOverride?.title ?? "Reto validable en sede",
      description:
        venueOverride?.description ??
        (venueRecommendation
          ? `Realiza una actividad fisica en una sede como ${venueRecommendation.title}. La empresa responsable validara el cumplimiento.`
          : "Realiza una actividad fisica en una cancha, establecimiento o gym. La empresa responsable validara si cumpliste la actividad."),
      reward: venueOverride?.reward ?? "+40 FitCoins sugeridos cuando la empresa apruebe el reto.",
      statusLabel: selectedVenues[1]
        ? "Sede seleccionada"
        : isLoading
          ? "Cargando"
          : "Pendiente de sede",
      canRefresh: Boolean(plan) && (refreshesRemaining[1] ?? 0) > 0,
    },
  ];

  return (
    <div className="mb-8 rounded-2xl bg-gradient-card border border-primary/20 p-5 shadow-card">
      <div className="flex flex-col gap-5">
        <div
          className={`rounded-2xl border px-4 py-3 text-xs ${
            isLoading
              ? "border-primary/30 bg-primary/10 text-primary"
              : isError
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-neon/20 bg-neon/10 text-neon"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold">
              <span
                className={`h-2 w-2 rounded-full ${
                  isLoading ? "bg-primary animate-pulse" : isError ? "bg-warning" : "bg-neon"
                }`}
              />
              {isLoading
                ? "Cargando retos semanales..."
                : isError
                  ? "No se pudo sincronizar los retos"
                  : "Retos semanales listos"}
            </div>
            {isError && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-xl border border-warning/40 px-3 py-1.5 text-[11px] font-bold hover:bg-warning/10 transition-colors"
              >
                Reintentar
              </button>
            )}
          </div>
          {isError && (
            <p className="mt-2 text-[11px] text-warning/90">
              Revisa que el backend este levantado y que la sesion real siga activa. Mientras tanto
              se muestra una vista base de retos.
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Retos semanales
            </div>
            <h2 className="font-heading text-2xl tracking-wide text-foreground">
              2 retos para esta semana
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Retos fisicos adaptados a tu perfil. Para ganar puntos, deberas elegir una sede y la
              empresa encargada validara el cumplimiento.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-bold">
            Maximo 2 por semana
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {weeklyChallenges.map((challenge, index) => (
            <div
              key={challenge.title}
              className="rounded-2xl border border-border/60 bg-background/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reto {index + 1}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {challenge.statusLabel}
                </span>
              </div>
              <h3 className="mt-2 font-heading text-xl tracking-wide text-foreground">
                {challenge.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
              <div className="mt-3 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary">
                Recompensa: {challenge.reward}
              </div>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveChallengeIndex(index);
                    setIsVenuePickerOpen(true);
                  }}
                  disabled={venues.length === 0}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-left text-xs text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                  {selectedVenues[index]
                    ? selectedVenues[index]?.name
                    : venues.length > 0
                      ? "Escoger sede para validacion"
                      : "No hay sedes fisicas disponibles"}
                </button>
                <p className="text-[11px] text-muted-foreground">
                  {selectedVenues[index]
                    ? `${selectedVenues[index]?.name} quedara como sede responsable de validacion.`
                    : "La empresa de la sede seleccionada podra aprobar o rechazar el cumplimiento."}
                </p>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {(refreshesRemaining[index] ?? 0) > 0
                    ? `Te queda ${refreshesRemaining[index]} actualizacion esta semana.`
                    : "Actualizacion semanal usada."}
                </span>
                <button
                  type="button"
                  onClick={() => onRefreshChallenge(index)}
                  disabled={!challenge.canRefresh}
                  className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {challenge.canRefresh ? `Actualizar reto ${index + 1}` : "Sin actualizaciones"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isVenuePickerOpen} onOpenChange={setIsVenuePickerOpen}>
          <DialogContent className="max-w-3xl bg-background border border-border/60 rounded-3xl p-5">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl tracking-wide">
                Escoge una sede en el mapa
              </DialogTitle>
              <DialogDescription>
                Selecciona la sede o empresa donde realizaras los retos. La empresa responsable
                podra aprobar o rechazar el cumplimiento desde su panel.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <ChallengeVenueMap
                venues={venues}
                selectedVenueId={activeSelectedVenueId}
                selectedVenue={activeSelectedVenue}
                challengeLabel={`Reto ${activeChallengeIndex + 1}`}
                onSelectVenue={(venueId) => onSelectVenue(activeChallengeIndex, venueId)}
                onConfirm={() => setIsVenuePickerOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">
              Logro sugerido: <span className="text-foreground">{achievement}</span>
            </div>
            {venueRecommendation && (
              <div className="text-xs text-muted-foreground mt-1">
                Sede sugerida: <span className="text-foreground">{venueRecommendation.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeVenueMap({
  venues,
  selectedVenueId,
  selectedVenue,
  challengeLabel,
  onSelectVenue,
  onConfirm,
}: {
  venues: Court[];
  selectedVenueId: string;
  selectedVenue: Court | undefined;
  challengeLabel: string;
  onSelectVenue: (venueId: string) => void;
  onConfirm: () => void;
}) {
  const [isMapReady, setIsMapReady] = useState(false);
  const venuesSignature = useMemo(
    () => venues.map((venue) => `${venue.id}:${venue.lat}:${venue.lng}`).join("|"),
    [venues],
  );
  const center: [number, number] = selectedVenue
    ? [selectedVenue.lat, selectedVenue.lng]
    : venues[0]
      ? [venues[0].lat, venues[0].lng]
      : [-12.0464, -77.0428];

  function MapResizer() {
    const map = useMap();
    useEffect(() => {
      const timeoutIds = [80, 220, 420].map((delay) =>
        globalThis.setTimeout(() => map.invalidateSize(), delay),
      );
      return () => timeoutIds.forEach((timeoutId) => globalThis.clearTimeout(timeoutId));
    }, [map]);
    useEffect(() => {
      map.setView(center, 13, { animate: false });
    }, [center, map]);
    return null;
  }

  useEffect(() => {
    // Reiniciamos el loader solo cuando cambia la lista real de sedes.
    // Seleccionar un marcador no debe mostrar "Cargando sedes" otra vez.
    setIsMapReady(false);
  }, [venuesSignature]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border bg-muted">
        {!isMapReady && (
          <div className="absolute inset-0 z-[500] grid place-items-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground shadow-card">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Cargando sedes...
            </div>
          </div>
        )}
        <MapContainer
          center={center}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={false}
          dragging
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              load: () => setIsMapReady(true),
            }}
          />
          {venues.map((venue) => {
            const isSelected = venue.id === selectedVenueId;
            return (
              <Marker
                key={venue.id}
                position={[venue.lat, venue.lng]}
                icon={createChallengeVenueIcon(venue.sport, isSelected)}
                eventHandlers={{ click: () => onSelectVenue(venue.id) }}
              >
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <div className="font-bold text-foreground">{venue.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{venue.sport}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Empresa responsable de validacion
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <aside className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {challengeLabel}
        </div>
        <h3 className="mt-2 font-heading text-xl tracking-wide">
          {selectedVenue ? selectedVenue.name : "Selecciona una sede"}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedVenue
            ? `${selectedVenue.sport} · ${selectedVenue.district || selectedVenue.address || "Sede deportiva"}`
            : "Haz click en un pin del mapa para asignar la empresa que validara este reto."}
        </p>
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground">
          La empresa de esta sede revisara si el usuario cumplio el reto.
        </div>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedVenue}
          className="mt-4 w-full rounded-xl bg-gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar sede
        </button>
      </aside>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass rounded-xl p-3 text-center hover:bg-white/5 transition-all duration-200">
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="text-xl font-bold mt-1 font-mono text-foreground">{value}</div>
    </div>
  );
}

// === BLOQUE: MatchCard — Tarjeta de partido individual ===
// Muestra información del partido, estado (Finalizado, En Curso, Lleno, Buscando),
// cupos disponibles, barra de progreso, botón de unirse, y check-in geolocalizado.
function MatchCard({ match }: { match: Match }) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { t } = useTranslation();
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const currentParticipants = match.current_players?.length || 0;
  const spotsTaken = joined ? currentParticipants + 1 : currentParticipants;
  const isFull = spotsTaken >= match.max_players;

  const courtFee = match.court
    ? Math.ceil(match.court.price_per_hour / (match.max_players || 4))
    : 0;

  const matchStart = new Date(`${match.date}T${match.time}`);
  const now = Date.now();
  const fifteenMinsBefore = matchStart.getTime() - 15 * 60 * 1000;
  const twoHoursAfter = matchStart.getTime() + 2 * 60 * 60 * 1000;

  const isParticipant =
    match.creator_id === user?.id ||
    match.current_players?.some((p) => p.id === user?.id) ||
    joined;

  const showCheckIn =
    isParticipant &&
    now >= fifteenMinsBefore &&
    now <= twoHoursAfter &&
    match.status !== "IN_PROGRESS" &&
    match.status !== "Finished";

  const [checkedIn, setCheckedIn] = useState(match.status === "IN_PROGRESS");

  // === BLOQUE: handleJoin — Unirse a un partido ===
  const handleJoin = () => {
    if (user && courtFee > user.fitcoins_balance) {
      setIsBalanceModalOpen(true);
      return;
    }
    setIsJoining(true);
    setTimeout(async () => {
      try {
        if (!useAuthStore.getState().isDemoMode) {
          const { error } = await withTimeout(
            supabase.from("match_participants").insert({
              match_id: match.id,
              user_id: user?.id,
              status: "ACCEPTED",
            }),
          );
          if (error) throw error;
        }
        setIsJoining(false);
        setJoined(true);
        toast.success("¡Te uniste al partido!", {
          description: "Revisa tu calendario para más detalles.",
        });
        useChatStore.getState().createMatchGroupChat(match);
        await router.invalidate();
      } catch (err) {
        console.error("Error joining match in Supabase:", err);
        setIsJoining(false);
        const { handleWalletError } = await import("@/services/walletService");
        const handled = handleWalletError(err);
        if (!handled) {
          toast.error("Error al unirse al partido. Por favor intenta de nuevo.");
        }
      }
    }, 600);
  };

  // === BLOQUE: handleCheckIn — Check-in geolocalizado en la cancha ===
  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error(t("game_day.checkin_error"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const courtLat = match.court?.lat || -12.1221;
        const courtLng = match.court?.lng || -77.0298;

        const distance = calculateDistance(userLat, userLng, courtLat, courtLng);
        const threshold = 0.1;

        if (distance <= threshold) {
          try {
            if (!useAuthStore.getState().isDemoMode) {
              await withTimeout(
                supabase.from("matches").update({ status: "IN_PROGRESS" }).eq("id", match.id),
              );

              await withTimeout(
                supabase
                  .from("match_participants")
                  .update({ status: "ATTENDED" })
                  .eq("match_id", match.id)
                  .eq("user_id", user?.id),
              );
            } else {
              match.status = "IN_PROGRESS";
              localStorage.setItem(`sportmatch_demo_checkin_${match.id}`, "true");

              if (user) {
                const todayStr = new Date().toISOString().split("T")[0];
                const storedAttendance = localStorage.getItem(
                  `sportmatch_demo_attendance_${user.id}`,
                );
                const days = storedAttendance ? JSON.parse(storedAttendance) : [];
                if (!days.includes(todayStr)) {
                  days.push(todayStr);
                  localStorage.setItem(
                    `sportmatch_demo_attendance_${user.id}`,
                    JSON.stringify(days),
                  );
                }

                const storedStreak = localStorage.getItem(`sportmatch_demo_streak_${user.id}`);
                const streakObj = storedStreak
                  ? JSON.parse(storedStreak)
                  : { current_streak: 0, max_streak: 0 };
                streakObj.current_streak += 1;
                if (streakObj.current_streak > streakObj.max_streak) {
                  streakObj.max_streak = streakObj.current_streak;
                }
                localStorage.setItem(
                  `sportmatch_demo_streak_${user.id}`,
                  JSON.stringify(streakObj),
                );
              }
            }

            setCheckedIn(true);
            toast.success(t("game_day.checkin_success"));
            await router.invalidate();
            if (useAuthStore.getState().isDemoMode) {
              window.location.reload();
            }
          } catch {
            toast.error("Error al registrar asistencia.");
          }
        } else {
          toast.error(t("game_day.checkin_too_far", { distance: distance.toFixed(2) }));
        }
      },
      () => {
        toast.error(t("game_day.checkin_error"));
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  return (
    <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-violet/15 text-violet-foreground border border-violet/30 font-extrabold uppercase tracking-wider">
            {match.sport}
          </span>
          {/* Badge de estado del partido */}
          {(match.status as string) === "Finished" ||
          (match.status as string) === "COMPLETED" ||
          match.status === "Cancelled" ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-[#B2B8C2] border border-white/10 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B2B8C2]" />
              Finalizado
            </span>
          ) : match.status === "IN_PROGRESS" ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD60A] animate-pulse" />
              En Curso
            </span>
          ) : isFull ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30]" />
              Lleno
            </span>
          ) : (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Buscando
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {new Date(match.date).toLocaleDateString()}
        </span>
      </div>
      <h3 className="font-heading text-xl tracking-wide text-foreground leading-tight">
        {match.title}
      </h3>
      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
        <MapPin className="h-3 w-3 shrink-0" /> {match.court?.name || "Sin cancha asignada"}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Cupos
          </div>
          <div className="text-sm font-bold font-mono text-foreground">
            {spotsTaken}
            <span className="text-muted-foreground/50">/{match.max_players}</span>
          </div>
        </div>

        {showCheckIn && !checkedIn ? (
          <button
            onClick={handleCheckIn}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 hover:shadow-glow transition-all active:scale-95 cursor-pointer"
          >
            {t("game_day.confirm_attendance")}
          </button>
        ) : checkedIn || match.status === "IN_PROGRESS" ? (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Asistiendo
          </span>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isParticipant || isFull || isJoining}
            className="px-4 py-2 rounded-lg bg-gradient-neon text-neon-foreground text-sm font-bold disabled:opacity-50 transition-all active:scale-95 cursor-pointer shadow-neon hover:scale-105"
          >
            {isJoining ? "..." : isParticipant ? "Unido" : isFull ? "Lleno" : "Unirme"}
          </button>
        )}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(spotsTaken / match.max_players) * 100}%` }}
        />
      </div>

      <InsufficientBalanceModal
        isOpen={isBalanceModalOpen}
        onOpenChange={setIsBalanceModalOpen}
        cost={courtFee}
        balance={user?.fitcoins_balance ?? 0}
      />
    </div>
  );
}

// === BLOQUE: PostMatchReviewForm — Formulario de calificación post-partido ===
// Permite calificar la cancha (1-5 estrellas) y a cada compañero con tags
// (good_level, punctual, good_teammate, disrespectful, no_show).
// Los tags negativos ajustan trust_score y fitcoins_balance del evaluado.
function PostMatchReviewForm({ match, onClose }: { match: Match; onClose: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [courtRating, setCourtRating] = useState<number>(5);
  const [playerRatings, setPlayerRatings] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherPlayers = useMemo(() => {
    if (!match.current_players) return [];
    return match.current_players.filter((p) => p.id !== user?.id);
  }, [match.current_players, user]);

  // === BLOQUE: handleSubmit — Envía las calificaciones ===
  // Itera sobre cada compañero, calcula ajustes de trust_score y fitcoins,
  // y persiste en Supabase (o MOCK_USERS en modo demo).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      for (const player of otherPlayers) {
        const ratingTag = playerRatings[player.id];
        if (!ratingTag) continue;

        let trustAdjustment = 0;
        let fitcoinsAdjustment = 0;
        let tagDescription = "";

        switch (ratingTag) {
          case "good_level":
            trustAdjustment = 2;
            tagDescription = t("feedback.tag_good_level");
            break;
          case "punctual":
            trustAdjustment = 2;
            tagDescription = t("feedback.tag_punctual");
            break;
          case "good_teammate":
            trustAdjustment = 3;
            tagDescription = t("feedback.tag_good_teammate");
            break;
          case "disrespectful":
            trustAdjustment = -10;
            fitcoinsAdjustment = -50;
            tagDescription = t("feedback.tag_disrespectful");
            break;
          case "no_show":
            trustAdjustment = -15;
            fitcoinsAdjustment = -100;
            tagDescription = t("feedback.tag_no_show");
            break;
        }

        if (useAuthStore.getState().isDemoMode) {
          const { MOCK_USERS, MOCK_TRANSACTIONS } = await import("@/shared/api/apiClient");
          const target = MOCK_USERS.find((u) => u.id === player.id);
          if (target) {
            target.trust_score = Math.max(0, Math.min(100, target.trust_score + trustAdjustment));
            target.fitcoins_balance = Math.max(0, target.fitcoins_balance + fitcoinsAdjustment);
            if (fitcoinsAdjustment < 0) {
              MOCK_TRANSACTIONS.push({
                id: `tx-penalty-${Date.now()}-${Math.random()}`,
                created_at: new Date().toISOString(),
                user_id: player.id,
                amount: fitcoinsAdjustment,
                description: `Penalización: ${tagDescription}`,
                type: "PENALTY",
              });
            }
          }
        } else {
          const { data: profile } = await withTimeout(
            supabase
              .from("profiles")
              .select("trust_score, fitcoins_balance")
              .eq("id", player.id)
              .single(),
          );

          if (profile) {
            const newTrustScore = Math.max(
              0,
              Math.min(100, (profile.trust_score || 100) + trustAdjustment),
            );
            const newFitcoins = Math.max(0, (profile.fitcoins_balance || 0) + fitcoinsAdjustment);

            await withTimeout(
              supabase
                .from("profiles")
                .update({
                  trust_score: newTrustScore,
                  fitcoins_balance: newFitcoins,
                })
                .eq("id", player.id),
            );

            if (fitcoinsAdjustment < 0) {
              await withTimeout(
                supabase.from("wallet_transactions").insert({
                  user_id: player.id,
                  amount: fitcoinsAdjustment,
                  description: `Penalización: ${tagDescription}`,
                  type: "PENALTY",
                }),
              );
            }
          }
        }
      }

      toast.success(t("feedback.feedback_success"));
      onClose();
    } catch {
      toast.error("Error al enviar calificaciones.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      {/* Calificación de la cancha (1-5 estrellas) */}
      {match.court && (
        <div className="space-y-2 border-b border-border/50 pb-4">
          <label className="text-sm font-semibold text-foreground block">
            {t("feedback.rate_court")}: <span className="text-neon">{match.court.name}</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCourtRating(star)}
                className="focus:outline-none cursor-pointer"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= courtRating ? "fill-warning text-warning" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calificación de otros jugadores con tags */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        <label className="text-sm font-semibold text-foreground block">
          {t("feedback.rate_players")}
        </label>
        {otherPlayers.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            No hay otros participantes para calificar en este partido.
          </div>
        ) : (
          otherPlayers.map((player) => (
            <div
              key={player.id}
              className="p-3 bg-accent/20 rounded-2xl border border-border/50 space-y-3"
            >
              <div className="flex items-center gap-2">
                <img
                  src={player.avatar_url}
                  alt={player.name}
                  className="h-8 w-8 rounded-full bg-muted object-cover"
                />
                <span className="text-sm font-medium">{player.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    tag: "good_level",
                    label: t("feedback.tag_good_level"),
                    color: "hover:bg-violet/20 hover:text-violet-foreground",
                  },
                  {
                    tag: "punctual",
                    label: t("feedback.tag_punctual"),
                    color: "hover:bg-blue-500/20 hover:text-blue-400",
                  },
                  {
                    tag: "good_teammate",
                    label: t("feedback.tag_good_teammate"),
                    color: "hover:bg-emerald-500/20 hover:text-emerald-400",
                  },
                  {
                    tag: "disrespectful",
                    label: t("feedback.tag_disrespectful"),
                    color: "hover:bg-red-500/20 hover:text-red-400",
                  },
                  {
                    tag: "no_show",
                    label: t("feedback.tag_no_show"),
                    color: "hover:bg-orange-500/20 hover:text-orange-400",
                  },
                ].map((item) => {
                  const isSelected = playerRatings[player.id] === item.tag;
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setPlayerRatings({ ...playerRatings, [player.id]: item.tag })}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground font-semibold"
                          : `bg-background border-border/60 text-muted-foreground ${item.color}`
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-xl bg-neon text-neon-foreground font-bold hover:shadow-neon transition-shadow disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? "Enviando..." : t("feedback.submit_feedback")}
      </button>
    </form>
  );
}

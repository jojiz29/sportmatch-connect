import { Level, User } from "@/entities/types";
import { calculateDistance } from "@/shared/api/geoService";

export const MATCHMAKING_WEIGHTS = {
  location: 0.35,
  sport: 0.3,
  level: 0.2,
  availability: 0.1,
  trust: 0.05,
} as const;

const NEUTRAL_SCORE = 50;
const MAX_RECOMMENDED_DISTANCE_KM = 50;
const LEVEL_ORDER: Level[] = ["Principiante", "Intermedio", "Avanzado", "Elite"];

export interface MatchScoreBreakdown {
  location: number;
  sport: number;
  level: number;
  availability: number;
  trust: number;
}

export interface MatchRecommendation {
  user: User;
  score: number;
  breakdown: MatchScoreBreakdown;
  distanceKm: number | null;
  matchedSport: string | null;
}

interface MatchmakingContext {
  activeSport?: string;
  currentLocation?: { lat: number; lng: number } | null;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getSports(user: User): string[] {
  const matrixSports = Object.keys(user.sport_preferences?.sports_matrix ?? {});
  return Array.from(new Set([...(user.preferred_sports ?? []), ...matrixSports]));
}

function resolveMatchedSport(
  currentUser: User,
  candidate: User,
  activeSport?: string,
): string | null {
  if (activeSport) return activeSport;

  const candidateSports = getSports(candidate);
  return getSports(currentUser).find((sport) => candidateSports.includes(sport)) ?? null;
}

function calculateSportScore(currentUser: User, candidate: User, activeSport?: string): number {
  const currentSports = getSports(currentUser);
  const candidateSports = getSports(candidate);

  if (activeSport) {
    return currentSports.includes(activeSport) && candidateSports.includes(activeSport) ? 100 : 0;
  }

  return currentSports.some((sport) => candidateSports.includes(sport)) ? 100 : 0;
}

function getLevelForSport(user: User, activeSport?: string): Level {
  const sportLevel = activeSport
    ? user.sport_preferences?.sports_matrix?.[activeSport]?.level
    : undefined;

  // The sports matrix uses English labels, while the profile uses Spanish labels.
  const normalizedLevel: Record<string, Level> = {
    Amateur: "Principiante",
    Intermediate: "Intermedio",
    Advanced: "Avanzado",
    Pro: "Elite",
  };

  return normalizedLevel[sportLevel ?? ""] ?? user.level;
}

function calculateLevelScore(currentUser: User, candidate: User, activeSport?: string): number {
  const currentIndex = LEVEL_ORDER.indexOf(getLevelForSport(currentUser, activeSport));
  const candidateIndex = LEVEL_ORDER.indexOf(getLevelForSport(candidate, activeSport));

  if (currentIndex < 0 || candidateIndex < 0) return NEUTRAL_SCORE;

  const difference = Math.abs(currentIndex - candidateIndex);
  return [100, 75, 40, 0][difference] ?? 0;
}

function calculateAvailabilityScore(currentUser: User, candidate: User): number {
  const currentHours = currentUser.sport_preferences?.behavioral_intent?.weekly_hours;
  const candidateHours = candidate.sport_preferences?.behavioral_intent?.weekly_hours;

  // Until detailed schedules exist, weekly training hours are the availability proxy.
  if (currentHours == null || candidateHours == null) return NEUTRAL_SCORE;

  return clampScore(100 - Math.abs(currentHours - candidateHours) * 10);
}

function calculateLocationScore(
  currentUser: User,
  candidate: User,
  currentLocation?: MatchmakingContext["currentLocation"],
): { score: number; distanceKm: number | null } {
  const origin =
    currentLocation ??
    (currentUser.last_location_lat != null && currentUser.last_location_lng != null
      ? { lat: currentUser.last_location_lat, lng: currentUser.last_location_lng }
      : null);

  if (origin && candidate.last_location_lat != null && candidate.last_location_lng != null) {
    const distanceKm = calculateDistance(
      origin.lat,
      origin.lng,
      candidate.last_location_lat,
      candidate.last_location_lng,
    );

    return {
      score: clampScore(100 - (distanceKm / MAX_RECOMMENDED_DISTANCE_KM) * 100),
      distanceKm,
    };
  }

  // City is a coarse fallback when either user has not shared coordinates.
  if (currentUser.city && candidate.city) {
    return {
      score:
        currentUser.city.trim().toLowerCase() === candidate.city.trim().toLowerCase() ? 75 : 25,
      distanceKm: null,
    };
  }

  return { score: NEUTRAL_SCORE, distanceKm: null };
}

export function calculateMatchRecommendation(
  currentUser: User,
  candidate: User,
  context: MatchmakingContext = {},
): MatchRecommendation {
  // En la vista "Todos" elegimos el primer deporte compartido para comparar
  // niveles y explicar al usuario por qué el candidato fue recomendado.
  const matchedSport = resolveMatchedSport(currentUser, candidate, context.activeSport);
  const location = calculateLocationScore(currentUser, candidate, context.currentLocation);
  const breakdown: MatchScoreBreakdown = {
    location: location.score,
    sport: calculateSportScore(currentUser, candidate, matchedSport ?? undefined),
    level: calculateLevelScore(currentUser, candidate, matchedSport ?? undefined),
    availability: calculateAvailabilityScore(currentUser, candidate),
    trust: clampScore(candidate.trust_score ?? NEUTRAL_SCORE),
  };

  const score = clampScore(
    breakdown.location * MATCHMAKING_WEIGHTS.location +
      breakdown.sport * MATCHMAKING_WEIGHTS.sport +
      breakdown.level * MATCHMAKING_WEIGHTS.level +
      breakdown.availability * MATCHMAKING_WEIGHTS.availability +
      breakdown.trust * MATCHMAKING_WEIGHTS.trust,
  );

  return { user: candidate, score, breakdown, distanceKm: location.distanceKm, matchedSport };
}

export function rankMatchCandidates(
  currentUser: User,
  candidates: User[],
  context: MatchmakingContext = {},
): MatchRecommendation[] {
  return candidates
    .filter((candidate) => candidate.id !== currentUser.id)
    .map((candidate) => calculateMatchRecommendation(currentUser, candidate, context))
    .sort((a, b) => b.score - a.score || b.breakdown.trust - a.breakdown.trust);
}

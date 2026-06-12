// ============================================================
// matchmaking.test.ts — Tests de lógica de matchmaking
// Verifica algoritmo de compatibilidad entre jugadores
// ============================================================

import { describe, expect, it } from "vitest";
import { User } from "@/entities/types";
import {
  calculateMatchRecommendation,
  MATCHMAKING_WEIGHTS,
  rankMatchCandidates,
} from "@/features/matchmaking/matchmakingScore";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "current-user",
    created_at: "2026-06-10T00:00:00.000Z",
    name: "Jugador",
    age: 25,
    city: "Lima",
    avatar_url: "",
    bio: null,
    trust_score: 80,
    fitcoins_balance: 0,
    level: "Intermedio",
    preferred_sports: ["Tenis"],
    matches_played: 0,
    last_location_lat: -12.0464,
    last_location_lng: -77.0428,
    sport_preferences: {
      sports_matrix: {
        Tenis: { level: "Intermediate", weight: 1 },
      },
      behavioral_intent: {
        weekly_hours: 6,
        intent: "Recreativo",
      },
    },
    ...overrides,
  };
}

describe("matchmaking score", () => {
  it("keeps the documented weights totaling 100 percent", () => {
    const totalWeight = Object.values(MATCHMAKING_WEIGHTS).reduce(
      (total, weight) => total + weight,
      0,
    );

    expect(totalWeight).toBeCloseTo(1);
  });

  it("gives a strong score to a nearby compatible player", () => {
    const currentUser = makeUser();
    const candidate = makeUser({
      id: "compatible-player",
      trust_score: 95,
      last_location_lat: -12.047,
      last_location_lng: -77.043,
    });

    const result = calculateMatchRecommendation(currentUser, candidate, { activeSport: "Tenis" });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.breakdown.sport).toBe(100);
    expect(result.breakdown.level).toBe(100);
    expect(result.breakdown.availability).toBe(100);
  });

  it("uses documented fallback scores when coordinates and availability are missing", () => {
    const currentUser = makeUser({
      last_location_lat: null,
      last_location_lng: null,
      sport_preferences: undefined,
    });
    const candidate = makeUser({
      id: "fallback-player",
      last_location_lat: null,
      last_location_lng: null,
      sport_preferences: undefined,
    });

    const result = calculateMatchRecommendation(currentUser, candidate, { activeSport: "Tenis" });

    expect(result.breakdown.location).toBe(75);
    expect(result.breakdown.availability).toBe(50);
    expect(result.distanceKm).toBeNull();
  });

  it("excludes the current user and sorts candidates by compatibility", () => {
    const currentUser = makeUser();
    const compatible = makeUser({ id: "compatible", trust_score: 95 });
    const incompatible = makeUser({
      id: "incompatible",
      city: "Cusco",
      level: "Elite",
      preferred_sports: ["Running"],
      last_location_lat: null,
      last_location_lng: null,
      sport_preferences: undefined,
      trust_score: 40,
    });

    const results = rankMatchCandidates(currentUser, [incompatible, currentUser, compatible], {
      activeSport: "Tenis",
    });

    expect(results.map((result) => result.user.id)).toEqual(["compatible", "incompatible"]);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("selects a shared sport automatically when viewing all sports", () => {
    const currentUser = makeUser({
      preferred_sports: ["Tenis", "Running"],
    });
    const candidate = makeUser({
      id: "runner",
      preferred_sports: ["Running"],
      sport_preferences: undefined,
    });

    const result = calculateMatchRecommendation(currentUser, candidate);

    expect(result.matchedSport).toBe("Running");
    expect(result.breakdown.sport).toBe(100);
  });
});

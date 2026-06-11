import { describe, it, expect, beforeEach } from "vitest";
import { usePublicMatchStore } from "../usePublicMatchStore";
import { useAuthStore } from "@/entities/user/useAuth";

describe("usePublicMatchStore Zustand Store", () => {
  beforeEach(() => {
    // Reset store state if needed
  });

  it("should initialize with structurally sound initial states", () => {
    const state = usePublicMatchStore.getState();
    expect(Array.isArray(state.publicMatches)).toBe(true);
    expect(state.publicMatches.length).toBeGreaterThan(0);
    expect(Array.isArray(state.reviews)).toBe(true);
    expect(Array.isArray(state.reports)).toBe(true);
  });

  it("should support creating a public match when authenticated", () => {
    // Authenticate user
    useAuthStore.setState({
      user: {
        id: "creator-id",
        created_at: "",
        name: "Edwin Flores",
        age: 26,
        city: "Lima",
        avatar_url: "avatar.png",
        bio: "",
        trust_score: 99,
        fitcoins_balance: 1000,
        level: "Intermedio",
        preferred_sports: ["Tenis"],
        matches_played: 5,
        last_location_lat: -12.0463,
        last_location_lng: -77.0427,
      },
    });

    const initialCount = usePublicMatchStore.getState().publicMatches.length;

    const matchData = {
      title: "Pádel Nocturno Jockey",
      sport: "Pádel" as const,
      level: "Intermedio" as const,
      courtName: "Cancha Jockey 3",
      address: "Santiago de Surco",
      lat: -12.08,
      lng: -76.98,
      date: "2026-06-12",
      time: "20:00",
      maxPlayers: 4,
    };

    const newMatch = usePublicMatchStore.getState().createMatch(matchData);

    expect(usePublicMatchStore.getState().publicMatches.length).toBe(initialCount + 1);
    expect(newMatch.creatorId).toBe("creator-id");
    expect(newMatch.creatorName).toBe("Edwin Flores");
    expect(newMatch.participants.length).toBe(1);
    expect(newMatch.participants[0].userId).toBe("creator-id");
  });

  it("should support submitting a user review and calculating average rating", () => {
    useAuthStore.setState({
      user: {
        id: "reviewer-id",
        created_at: "",
        name: "María Gómez",
        age: 23,
        city: "Lima",
        avatar_url: "maria.png",
        bio: "",
        trust_score: 90,
        fitcoins_balance: 50,
        level: "Intermedio",
        preferred_sports: [],
        matches_played: 1,
        last_location_lat: 0,
        last_location_lng: 0,
      },
    });

    const targetUserId = "player-target-123";

    // Set initial reviews for target user to empty
    usePublicMatchStore.setState({
      reviews: [],
    });

    // Submit review 1 (5 stars)
    usePublicMatchStore.getState().submitReview({
      targetUserId,
      rating: 5,
      comment: "Excelente partner de tenis!",
    });

    // Change auth user to another reviewer to pass the unique reviewer validation
    useAuthStore.setState({
      user: {
        id: "reviewer-id-2",
        created_at: "",
        name: "Diego Sánchez",
        age: 25,
        city: "Lima",
        avatar_url: "diego.png",
        bio: "",
        trust_score: 90,
        fitcoins_balance: 50,
        level: "Intermedio",
        preferred_sports: [],
        matches_played: 1,
        last_location_lat: 0,
        last_location_lng: 0,
      },
    });

    // Submit review 2 (3 stars)
    usePublicMatchStore.getState().submitReview({
      targetUserId,
      rating: 3,
      comment: "Llegó un poco tarde, pero buen nivel",
    });

    // Check reviews length
    const state = usePublicMatchStore.getState();
    expect(state.reviews.length).toBe(2);

    // Check average rating ( (5 + 3) / 2 = 4 )
    const average = usePublicMatchStore.getState().getAverageRating(targetUserId);
    expect(average).toBe(4);
  });
});

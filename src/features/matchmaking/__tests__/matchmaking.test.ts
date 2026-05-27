import { describe, it, expect } from "vitest";
import { User } from "@/entities/types";

import { Sport } from "@/entities/types";

// Lógica pura extraída
export const filterMatches = (users: User[], filters: { maxDistance: number; sport: string }) => {
  return users.filter(
    (u) =>
      (u.distance_km || 0) <= filters.maxDistance &&
      u.preferred_sports.includes(filters.sport as Sport),
  );
};

const mockUsers: User[] = [
  {
    id: "1",
    name: "A",
    preferred_sports: ["Pádel"],
    distance_km: 2,
    created_at: "",
    age: 20,
    city: "",
    avatar_url: "",
    bio: "",
    trust_score: 90,
    fitcoins_balance: 0,
    level: "Intermedio",
    last_location_lat: 0,
    last_location_lng: 0,
  },
  {
    id: "2",
    name: "B",
    preferred_sports: ["Fútbol"],
    distance_km: 5,
    created_at: "",
    age: 20,
    city: "",
    avatar_url: "",
    bio: "",
    trust_score: 90,
    fitcoins_balance: 0,
    level: "Intermedio",
    last_location_lat: 0,
    last_location_lng: 0,
  },
  {
    id: "3",
    name: "C",
    preferred_sports: ["Pádel"],
    distance_km: 15,
    created_at: "",
    age: 20,
    city: "",
    avatar_url: "",
    bio: "",
    trust_score: 90,
    fitcoins_balance: 0,
    level: "Intermedio",
    last_location_lat: 0,
    last_location_lng: 0,
  },
] as User[];

describe("Matchmaking Filtering Logic", () => {
  it("should filter users by distance and sport", () => {
    const result = filterMatches(mockUsers, { maxDistance: 10, sport: "Pádel" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("A");
  });

  it("should return empty if no one matches sport", () => {
    const result = filterMatches(mockUsers, { maxDistance: 10, sport: "Tenis" });
    expect(result).toHaveLength(0);
  });

  it("should return empty if everyone is too far", () => {
    const result = filterMatches(mockUsers, { maxDistance: 1, sport: "Pádel" });
    expect(result).toHaveLength(0);
  });
});

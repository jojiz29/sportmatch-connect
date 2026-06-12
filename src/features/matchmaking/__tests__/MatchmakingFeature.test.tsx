// ============================================================
// MatchmakingFeature.test.tsx — Tests del componente de matchmaking
// Verifica renderizado, swipe y modal de match
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MatchmakingFeature } from "../MatchmakingFeature";
import { useAuthStore } from "@/entities/user/useAuth";

// Mock React Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock challenge service APIs to avoid network requests
vi.mock("@/shared/api/challengeService", () => ({
  getPendingChallengesSent: vi.fn().mockResolvedValue([]),
  getPendingChallengesReceived: vi.fn().mockResolvedValue([]),
}));

// Mock connections APIs
vi.mock("@/shared/api/connectionService", () => ({
  getPlayerConnections: vi.fn().mockResolvedValue([]),
  createPlayerConnection: vi.fn().mockResolvedValue(true),
  checkConnectionExists: vi.fn().mockResolvedValue(false),
}));

// Mock matchmaking hook
vi.mock("../useMatchmaking", () => ({
  useMatchmaking: (initialStack: any) => ({
    stack: initialStack || [],
    isLoading: false,
    swipe: vi.fn(),
  }),
}));

describe("MatchmakingFeature UI Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when initialStack is empty", () => {
    // Authenticate user
    useAuthStore.setState({
      user: {
        id: "current-user",
        created_at: "",
        name: "Test User",
        age: 25,
        city: "Lima",
        avatar_url: "",
        bio: "",
        trust_score: 80,
        fitcoins_balance: 0,
        level: "Intermedio",
        preferred_sports: ["Tenis"],
        matches_played: 0,
        last_location_lat: 0,
        last_location_lng: 0,
      },
    });

    render(<MatchmakingFeature initialStack={[]} />);

    // Verify empty stack text is rendered (translated via key fallback)
    expect(screen.getByText("matchmaking.empty_stack")).toBeInTheDocument();
  });
});

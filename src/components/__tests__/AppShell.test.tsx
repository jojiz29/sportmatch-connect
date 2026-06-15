// ============================================================
// AppShell.test.tsx — Tests del shell principal de la app
// Verifica renderizado del layout con navegación y sidebar
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AppShell } from "../AppShell";
import { useAuthStore } from "@/entities/user/useAuth";

// Mock React Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search }: any) => (
    <a href={to} data-search={JSON.stringify(search)}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouterState: () => ({
    location: { pathname: "/app" },
  }),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: "es",
    },
  }),
  initReactI18next: { type: "3rdParty", init: () => undefined },
}));

// Mock shared i18n module
vi.mock("@/shared/i18n", () => ({
  default: {
    changeLanguage: () => Promise.resolve(),
    language: "es",
  },
}));

// Mock theme store
vi.mock("@/features/theme/store", () => ({
  useThemeStore: () => ({
    theme: "dark-footballer",
    toggleTheme: vi.fn(),
  }),
}));

// Mock tour store
vi.mock("@/shared/hooks/useTourStore", () => ({
  useTourStore: () => ({
    run: false,
    steps: [],
  }),
}));

// Mock child features to prevent unrelated component failures
vi.mock("@/features/notifications/ui/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));
vi.mock("@/components/JuryTour", () => ({
  JuryTour: () => <div data-testid="jury-tour" />,
}));
vi.mock("@/components/WorldCupBackground", () => ({
  WorldCupBackground: () => <div data-testid="world-cup-bg" />,
}));

describe("AppShell Navigation Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Standard Player navigation options when user role is not BUSINESS", () => {
    // Set standard user in store
    useAuthStore.setState({
      user: {
        id: "player-123",
        created_at: "",
        name: "Diego Player",
        age: 22,
        city: "Lima",
        avatar_url: "diego.png",
        bio: "",
        trust_score: 85,
        fitcoins_balance: 100,
        level: "Intermedio",
        preferred_sports: [],
        matches_played: 1,
        last_location_lat: 0,
        last_location_lng: 0,
        user_role: "PLAYER", // Standard player role
      },
    });

    render(
      <AppShell>
        <div data-testid="child-content">Content</div>
      </AppShell>,
    );

    // Verify player specific navigation links are rendered
    expect(screen.getAllByText("nav.inicio")[0]).toBeInTheDocument();
    expect(screen.getAllByText("nav.matchmaking")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Mapa Comercial")[0]).toBeInTheDocument();

    // Verify business links are NOT rendered
    expect(screen.queryByText("nav.business_profile")).not.toBeInTheDocument();
    expect(screen.queryByText("nav.business_venues")).not.toBeInTheDocument();
  });

  it("renders Business navigation options when user role is BUSINESS", () => {
    // Set business user in store
    useAuthStore.setState({
      user: {
        id: "business-123",
        created_at: "",
        name: "Arena Club Owner",
        age: 35,
        city: "Lima",
        avatar_url: "owner.png",
        bio: "",
        trust_score: 95,
        fitcoins_balance: 5000,
        level: "Principiante",
        preferred_sports: [],
        matches_played: 0,
        last_location_lat: 0,
        last_location_lng: 0,
        user_role: "BUSINESS", // Business role
      },
    });

    render(
      <AppShell>
        <div data-testid="child-content">Content</div>
      </AppShell>,
    );

    // Verify business navigation links are rendered
    expect(screen.getByText("Perfil Comercial")).toBeInTheDocument();
    expect(screen.getByText("Mis Sedes")).toBeInTheDocument();
    expect(screen.getByText("Gestión de Anuncios")).toBeInTheDocument();
    expect(screen.getByText("Catálogo")).toBeInTheDocument();

    // Verify player links are NOT rendered
    expect(screen.queryByText("nav.matchmaking")).not.toBeInTheDocument();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CommercialSheetModal } from "../ui/CommercialSheetModal";

// Mock ads store
vi.mock("@/features/business/model/useAdsStore", () => ({
  useAdsStore: () => ({
    ads: [],
    fetchAds: vi.fn(),
    trackAdAction: vi.fn(),
  }),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock routing links if any
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe("CommercialSheetModal Component Fallbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders safe fallbacks and empty states when business details are missing", () => {
    // Render with minimal business information
    const minimalBusiness = {
      id: "biz-1",
      created_at: "",
      name: "Club Deportivo Incompleto",
      age: 0,
      city: "Lima",
      avatar_url: "",
      bio: null, // missing bio
      trust_score: 90,
      fitcoins_balance: 0,
      level: "Principiante",
      preferred_sports: null as any, // missing sports
      matches_played: 0,
      last_location_lat: 0,
      last_location_lng: 0,
      user_role: "BUSINESS" as const,
      operating_hours: null as any, // missing hours
      whatsapp: null,
      instagram: null,
      website: null,
    };

    render(
      <CommercialSheetModal
        isOpen={true}
        onOpenChange={vi.fn()}
        business={minimalBusiness as any}
      />,
    );

    // Verify name is rendered
    expect(screen.getByText("Club Deportivo Incompleto")).toBeInTheDocument();

    // Verify fallback hours are rendered
    expect(screen.getByText("Lunes a Sábado: 8:00 AM - 10:00 PM")).toBeInTheDocument();

    // Verify fallback description is rendered
    expect(
      screen.getByText(/Este comercio aún no ha registrado una descripción comercial/i),
    ).toBeInTheDocument();
  });

  it("renders nothing when business is null", () => {
    const { container } = render(
      <CommercialSheetModal isOpen={true} onOpenChange={vi.fn()} business={null} />,
    );

    expect(container.firstChild).toBeNull();
  });
});

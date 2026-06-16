// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// XpBar.test.tsx — Tests del componente XpBar
// SCRUM-229
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { XpBar } from "@/features/profile/components/XpBar";

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  id: "u1",
  xp: 250,
  xp_level: 2,
  xp_to_next_level: 400,
  ...overrides,
});

vi.mock("@/entities/user/useAuth", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, d?: any) => (typeof d === "string" ? d : k),
  }),
}));

import { useAuthStore } from "@/entities/user/useAuth";

describe("XpBar (SCRUM-229)", () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ user: mockUser() }));
  });

  it("renderiza el variant default con level y label", () => {
    render(<XpBar variant="default" />);
    expect(screen.getByText(/Nivel 2/)).toBeInTheDocument();
    // xp=250 -> nivel 2 -> label Principiante
    expect(screen.getByText("Principiante")).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it("renderiza el variant compact con level y progressbar", () => {
    render(<XpBar variant="compact" />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute("aria-valuenow");
  });

  it("renderiza el variant detailed con info completa", () => {
    render(<XpBar variant="detailed" />);
    expect(screen.getAllByText(/250/)[0]).toBeInTheDocument();
  });

  it("acepta customInfo sin usar useXpLevel", () => {
    render(
      <XpBar
        variant="default"
        customInfo={{
          current: 5000,
          level: 8,
          toNext: 6400,
          label: "Elite",
          color: "from-amber-500 to-orange-600",
          textColor: "text-amber-700",
          progress: 0.7,
          remaining: 1400,
        }}
      />,
    );
    expect(screen.getByText(/Nivel 8/)).toBeInTheDocument();
    // label aparece en pantalla via t() con fallback, debe contener "Elite"
    expect(screen.getAllByText(/Elite/)).toBeTruthy();
  });

  it("no renderiza nada si no hay user ni customInfo", () => {
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ user: null }));
    const { container } = render(<XpBar variant="default" />);
    expect(container.firstChild).toBeNull();
  });
});

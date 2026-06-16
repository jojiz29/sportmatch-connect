// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerifiedBadge } from "../VerifiedBadge";

describe("VerifiedBadge", () => {
  it("debe renderizar la insignia correctamente con el tooltip predeterminado", () => {
    render(<VerifiedBadge />);
    const badge = screen.getByTitle("Cuenta Verificada");
    expect(badge).toBeInTheDocument();
  });

  it("debe aplicar el tamaño solicitado", () => {
    const { container } = render(<VerifiedBadge size="lg" className="custom-class" />);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("h-5");
    expect(badge).toHaveClass("w-5");
    expect(badge).toHaveClass("custom-class");
  });
});

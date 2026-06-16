// @vitest-environment jsdom
// ============================================================
// card.test.tsx — Tests unitarios para el componente Card
// ============================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";

describe("Card Components", () => {
  it("debe renderizar el contenedor principal de Card", () => {
    render(
      <Card data-testid="card-root">
        <div>Contenido</div>
      </Card>,
    );
    const card = screen.getByTestId("card-root");
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent("Contenido");
    expect(card.className).toContain("rounded-xl");
  });

  it("debe aplicar clases personalizadas adicionales", () => {
    render(<Card data-testid="card-root" className="custom-class-123" />);
    const card = screen.getByTestId("card-root");
    expect(card.className).toContain("custom-class-123");
  });

  it("debe renderizar todos los subcomponentes de Card en una estructura correcta", () => {
    render(
      <Card data-testid="card-root">
        <CardHeader data-testid="card-header">
          <CardTitle data-testid="card-title">Título de la Tarjeta</CardTitle>
          <CardDescription data-testid="card-desc">Descripción detallada</CardDescription>
        </CardHeader>
        <CardContent data-testid="card-content">
          <p>Este es el cuerpo principal.</p>
        </CardContent>
        <CardFooter data-testid="card-footer">
          <button>Aceptar</button>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByTestId("card-header")).toBeInTheDocument();
    expect(screen.getByTestId("card-title")).toHaveTextContent("Título de la Tarjeta");
    expect(screen.getByTestId("card-desc")).toHaveTextContent("Descripción detallada");
    expect(screen.getByTestId("card-content")).toHaveTextContent("Este es el cuerpo principal.");
    expect(screen.getByTestId("card-footer")).toHaveTextContent("Aceptar");
  });
});

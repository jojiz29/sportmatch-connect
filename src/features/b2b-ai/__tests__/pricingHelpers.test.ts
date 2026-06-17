// ============================================================
// src/features/b2b-ai/__tests__/pricingHelpers.test.ts
// Tests para los helpers puros (formateo, validación, colores).
// No requieren DOM, jsdom ni mocks de Supabase.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  formatPEN,
  formatPercent,
  isValidDate,
  isValidHour,
  getTomorrowDate,
  getTodayDate,
  describeShapFeature,
  partitionShapDrivers,
  riskLevelColor,
  riskLevelLabel,
  deltaColor,
} from "../model/pricingHelpers";
import type { ShapFeature } from "@/entities/types";

describe("formatPEN", () => {
  it("formatea números como PEN con 2 decimales", () => {
    expect(formatPEN(50)).toContain("50");
    expect(formatPEN(50)).toMatch(/S\/|PEN|Soles/);
  });

  it("respeta el número de decimales", () => {
    const formatted = formatPEN(62.5, 1);
    expect(formatted).toMatch(/62\.5/);
  });

  it("devuelve placeholder para NaN/Infinity", () => {
    expect(formatPEN(NaN)).toBe("S/ —");
    expect(formatPEN(Infinity)).toBe("S/ —");
  });
});

describe("formatPercent", () => {
  it("formatea fracción como porcentaje", () => {
    expect(formatPercent(0.085)).toBe("+8.5%");
  });

  it("permite omitir el signo", () => {
    expect(formatPercent(0.085, 1, false)).toBe("8.5%");
  });

  it("maneja números negativos", () => {
    expect(formatPercent(-0.05)).toBe("-5.0%");
  });

  it("maneja 0 sin signo", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("devuelve placeholder para NaN", () => {
    expect(formatPercent(NaN)).toBe("—");
  });
});

describe("isValidDate", () => {
  it("acepta fechas YYYY-MM-DD válidas", () => {
    expect(isValidDate("2026-06-20")).toBe(true);
    expect(isValidDate("2025-12-31")).toBe(true);
  });

  it("rechaza formatos incorrectos", () => {
    expect(isValidDate("20-06-2026")).toBe(false);
    expect(isValidDate("2026/06/20")).toBe(false);
    expect(isValidDate("not a date")).toBe(false);
  });

  it("rechaza fechas inválidas", () => {
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("2026-02-30")).toBe(false);
  });
});

describe("isValidHour", () => {
  it("acepta horas 0-23 enteras", () => {
    expect(isValidHour(0)).toBe(true);
    expect(isValidHour(12)).toBe(true);
    expect(isValidHour(23)).toBe(true);
  });

  it("rechaza horas fuera de rango", () => {
    expect(isValidHour(-1)).toBe(false);
    expect(isValidHour(24)).toBe(false);
    expect(isValidHour(23.5)).toBe(false);
  });

  it("rechaza undefined", () => {
    expect(isValidHour(undefined)).toBe(false);
  });
});

describe("getTomorrowDate / getTodayDate", () => {
  it("getTodayDate devuelve formato YYYY-MM-DD", () => {
    const d = getTodayDate();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("getTomorrowDate es 1 día después de hoy", () => {
    const today = new Date(getTodayDate() + "T00:00:00Z").getTime();
    const tomorrow = new Date(getTomorrowDate() + "T00:00:00Z").getTime();
    const diffDays = (tomorrow - today) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(1);
  });
});

describe("describeShapFeature", () => {
  it("describe driver positivo con signo +", () => {
    const driver: ShapFeature = { feature: "Ocupación", contribution: 7.5, value: 0.85 };
    const desc = describeShapFeature(driver);
    expect(desc).toMatch(/\+.*7\.50/);
    expect(desc).toContain("Ocupación");
  });

  it("describe driver negativo sin signo +", () => {
    const driver: ShapFeature = { feature: "Hora valle", contribution: -2.3, value: 0 };
    const desc = describeShapFeature(driver);
    expect(desc).not.toMatch(/\+-/);
    expect(desc).toContain("2.30");
  });

  it("incluye el peso si está presente", () => {
    const driver: ShapFeature = { feature: "X", contribution: 1, value: 0, weight: 0.45 };
    const desc = describeShapFeature(driver);
    expect(desc).toMatch(/peso 45%/);
  });
});

describe("partitionShapDrivers", () => {
  it("separa drivers en positivos y negativos", () => {
    const drivers: ShapFeature[] = [
      { feature: "A", contribution: 5, value: 1 },
      { feature: "B", contribution: -3, value: 0 },
      { feature: "C", contribution: 2, value: 0.5 },
      { feature: "D", contribution: -1, value: 0 },
    ];
    const { positives, negatives } = partitionShapDrivers(drivers);
    expect(positives).toHaveLength(2);
    expect(negatives).toHaveLength(2);
    expect(positives[0].feature).toBe("A"); // mayor primero
    expect(negatives[0].feature).toBe("B"); // más negativo primero
  });

  it("maneja array vacío", () => {
    const { positives, negatives } = partitionShapDrivers([]);
    expect(positives).toEqual([]);
    expect(negatives).toEqual([]);
  });
});

describe("riskLevelColor / riskLevelLabel", () => {
  it("devuelve clases CSS distintas para cada nivel", () => {
    expect(riskLevelColor("low")).toContain("emerald");
    expect(riskLevelColor("medium")).toContain("warning");
    expect(riskLevelColor("high")).toContain("red");
  });

  it("devuelve labels en español", () => {
    expect(riskLevelLabel("low")).toBe("Bajo");
    expect(riskLevelLabel("medium")).toBe("Medio");
    expect(riskLevelLabel("high")).toBe("Alto");
  });
});

describe("deltaColor", () => {
  it("verde para subidas", () => {
    expect(deltaColor(0.05)).toContain("emerald");
  });

  it("rojo para bajadas", () => {
    expect(deltaColor(-0.05)).toContain("red");
  });

  it("neutro para cambios menores", () => {
    expect(deltaColor(0)).toContain("muted");
    expect(deltaColor(0.01)).toContain("muted");
  });
});

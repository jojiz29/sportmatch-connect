// ============================================================
// src/features/b2b-ai/model/pricingHelpers.ts
// Helpers de formateo y validación para las respuestas de B2B-AI.
// Pura (sin React) para que sean testables sin DOM.
// ============================================================

import type { ShapFeature } from "@/entities/types";

/**
 * Formatea un número como moneda PEN (Soles peruanos).
 * Default: 2 decimales, separador de miles con coma.
 */
export function formatPEN(amount: number, decimals = 2): string {
  if (!Number.isFinite(amount)) return "S/ —";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formatea un porcentaje con 1 decimal y signo.
 * Input: 0.085 → Output: "+8.5%"
 */
export function formatPercent(value: number, decimals = 1, withSign = true): string {
  if (!Number.isFinite(value)) return "—";
  const pct = value * 100;
  const sign = withSign && pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(decimals)}%`;
}

/**
 * Valida que un string sea una fecha YYYY-MM-DD válida.
 * Rechaza fechas como 2026-02-30 que JavaScript parsearía como Mar 2.
 */
export function isValidDate(date: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Verifica que el día sea válido para el mes (incluye bisiestos)
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/**
 * Valida que un número sea una hora válida 0-23.
 */
export function isValidHour(hour: number | undefined): hour is number {
  return hour !== undefined && Number.isInteger(hour) && hour >= 0 && hour <= 23;
}

/**
 * Devuelve la fecha de mañana en formato YYYY-MM-DD (default para el form).
 */
export function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD.
 */
export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resumen de un driver SHAP para mostrar en tooltip.
 * "Ocupación del slot: +S/ 7.50 (peso 45%)"
 */
export function describeShapFeature(driver: ShapFeature): string {
  const sign = driver.contribution > 0 ? "+" : "";
  const weightStr =
    driver.weight !== undefined ? ` (peso ${(driver.weight * 100).toFixed(0)}%)` : "";
  return `${driver.feature}: ${sign}${formatPEN(driver.contribution)}${weightStr}`;
}

/**
 * Agrupa drivers en positivos y negativos, ordenados por magnitud.
 * Útil para el waterfall chart de SHAP.
 */
export function partitionShapDrivers(drivers: ShapFeature[]): {
  positives: ShapFeature[];
  negatives: ShapFeature[];
} {
  const positives = drivers
    .filter((d) => d.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution);
  const negatives = drivers
    .filter((d) => d.contribution < 0)
    .sort((a, b) => a.contribution - b.contribution);
  return { positives, negatives };
}

/**
 * Convierte un riskLevel a un color semántico (Tailwind class).
 */
export function riskLevelColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    case "medium":
      return "text-warning bg-warning/10 border-warning/30";
    case "high":
      return "text-red-500 bg-red-500/10 border-red-500/30";
  }
}

export function riskLevelLabel(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "Bajo";
    case "medium":
      return "Medio";
    case "high":
      return "Alto";
  }
}

/**
 * Convierte un deltaPct a un color semántico.
 */
export function deltaColor(deltaPct: number): string {
  if (deltaPct > 0.02) return "text-emerald-500";
  if (deltaPct < -0.02) return "text-red-500";
  return "text-muted-foreground";
}

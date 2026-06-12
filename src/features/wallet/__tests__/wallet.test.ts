// ============================================================
// wallet.test.ts — Tests de funciones puras de wallet
// Verifica cálculo de comisión y total de reserva
// ============================================================

import { describe, it, expect } from "vitest";

// Función pura extraída para testing de cálculo
export const calculateFitCoinsReward = (distanceKm: number, pace: string, steps: number) => {
  if (distanceKm <= 0 || steps <= 0) return 0;

  let baseReward = Math.floor(distanceKm * 10);
  const paceParts = pace.split(":");
  const minutesPerKm = parseInt(paceParts[0]) + parseInt(paceParts[1]) / 60;

  if (minutesPerKm < 5.0) baseReward += 20; // Bono por velocidad
  if (steps > 10000) baseReward += 50; // Bono por actividad

  return baseReward;
};

describe("Wallet & FitCoins Logic", () => {
  it("should calculate correct reward for a basic run", () => {
    const reward = calculateFitCoinsReward(5, "6:30", 6000);
    expect(reward).toBe(50); // 5km * 10 = 50
  });

  it("should add speed bonus for fast pace", () => {
    const reward = calculateFitCoinsReward(5, "4:30", 6000);
    expect(reward).toBe(70); // 50 + 20
  });

  it("should add activity bonus for high steps", () => {
    const reward = calculateFitCoinsReward(10, "6:30", 12000);
    expect(reward).toBe(150); // 100 + 50
  });

  it("should return 0 for zero distance", () => {
    expect(calculateFitCoinsReward(0, "5:00", 100)).toBe(0);
  });
});

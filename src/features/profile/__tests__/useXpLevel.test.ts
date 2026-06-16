/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// ============================================================
// useXpLevel.test.ts — Tests para hook de XP y nivel
// SCRUM-229
// ============================================================

import { describe, it, expect } from "vitest";
import {
  levelToLabel,
  levelToColor,
  levelToTextColor,
  xpForLevel,
  formatXp,
  type XpLevelLabel,
} from "@/features/profile/hooks/useXpLevel";

describe("useXpLevel utilities (SCRUM-229)", () => {
  describe("levelToLabel", () => {
    it("mapea nivel 1 a Principiante", () => {
      expect(levelToLabel(1)).toBe("Principiante");
    });
    it("mapea nivel 2 a Principiante", () => {
      expect(levelToLabel(2)).toBe("Principiante");
    });
    it("mapea nivel 3 a Intermedio", () => {
      expect(levelToLabel(3)).toBe("Intermedio");
    });
    it("mapea nivel 4 a Intermedio", () => {
      expect(levelToLabel(4)).toBe("Intermedio");
    });
    it("mapea nivel 5 a Avanzado", () => {
      expect(levelToLabel(5)).toBe("Avanzado");
    });
    it("mapea nivel 6 a Avanzado", () => {
      expect(levelToLabel(6)).toBe("Avanzado");
    });
    it("mapea nivel 7 a Elite", () => {
      expect(levelToLabel(7)).toBe("Elite");
    });
    it("mapea nivel 9 a Elite", () => {
      expect(levelToLabel(9)).toBe("Elite");
    });
    it("mapea nivel 10 a Pro", () => {
      expect(levelToLabel(10)).toBe("Pro");
    });
    it("mapea nivel 100 a Pro", () => {
      expect(levelToLabel(100)).toBe("Pro");
    });
  });

  describe("levelToColor", () => {
    it("retorna gradiente para nivel bajo", () => {
      expect(levelToColor(1)).toContain("from-slate");
    });
    it("retorna gradiente para nivel alto", () => {
      expect(levelToColor(10)).toContain("from-fuchsia");
    });
    it("retorna string para cada nivel", () => {
      for (let i = 1; i <= 12; i++) {
        expect(levelToColor(i)).toMatch(/^from-/);
      }
    });
  });

  describe("levelToTextColor", () => {
    it("retorna clase de texto para cada nivel", () => {
      for (let i = 1; i <= 12; i++) {
        expect(levelToTextColor(i)).toMatch(/^text-/);
      }
    });
  });

  describe("xpForLevel", () => {
    it("nivel 1 requiere 0 xp", () => {
      expect(xpForLevel(1)).toBe(0);
    });
    it("nivel 2 requiere 100 xp", () => {
      expect(xpForLevel(2)).toBe(100);
    });
    it("nivel 3 requiere 400 xp", () => {
      expect(xpForLevel(3)).toBe(400);
    });
    it("nivel 5 requiere 1600 xp", () => {
      expect(xpForLevel(5)).toBe(1600);
    });
    it("nivel 10 requiere 8100 xp", () => {
      expect(xpForLevel(10)).toBe(8100);
    });
    it("nivel 0 retorna 0", () => {
      expect(xpForLevel(0)).toBe(0);
    });
    it("nivel negativo retorna 0", () => {
      expect(xpForLevel(-5)).toBe(0);
    });
  });

  describe("formatXp", () => {
    it("formatea numeros pequenos sin sufijo", () => {
      expect(formatXp(0)).toBe("0");
      expect(formatXp(100)).toBe("100");
      expect(formatXp(999)).toBe("999");
    });
    it("formatea miles con sufijo K", () => {
      expect(formatXp(1000)).toBe("1.0K");
      expect(formatXp(1500)).toBe("1.5K");
      expect(formatXp(10000)).toBe("10.0K");
    });
    it("formatea millones con sufijo M", () => {
      expect(formatXp(1_000_000)).toBe("1.0M");
      expect(formatXp(2_500_000)).toBe("2.5M");
    });
  });
});

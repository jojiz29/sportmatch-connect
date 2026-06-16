// ============================================================
// useXpLevel.ts — Hook para nivel de XP del usuario actual
// SCRUM-229: Indicador de nivel de experiencia (XP) y progreso
// Lee el perfil del usuario actual, expone xp, level, y helpers
// para formatear y calcular progreso.
// ============================================================

import { useMemo } from "react";
import { useAuthStore } from "@/entities/user/useAuth";

export type XpLevelLabel = "Principiante" | "Intermedio" | "Avanzado" | "Elite" | "Pro";

/** Mapea un nivel numérico a una etiqueta legible */
export function levelToLabel(level: number): XpLevelLabel {
  if (level <= 2) return "Principiante";
  if (level <= 4) return "Intermedio";
  if (level <= 6) return "Avanzado";
  if (level <= 9) return "Elite";
  return "Pro";
}

/** Color Tailwind para cada nivel */
export function levelToColor(level: number): string {
  if (level <= 2) return "from-slate-400 to-slate-500";
  if (level <= 4) return "from-emerald-400 to-emerald-600";
  if (level <= 6) return "from-blue-500 to-indigo-600";
  if (level <= 9) return "from-amber-500 to-orange-600";
  return "from-fuchsia-500 to-pink-600";
}

/** Color de texto para cada nivel */
export function levelToTextColor(level: number): string {
  if (level <= 2) return "text-slate-600 dark:text-slate-300";
  if (level <= 4) return "text-emerald-700 dark:text-emerald-300";
  if (level <= 6) return "text-blue-700 dark:text-blue-300";
  if (level <= 9) return "text-amber-700 dark:text-amber-300";
  return "text-fuchsia-700 dark:text-fuchsia-300";
}

export interface XpInfo {
  /** XP actual acumulado */
  current: number;
  /** Nivel numérico actual */
  level: number;
  /** XP total necesario para el siguiente nivel */
  toNext: number;
  /** XP del nivel anterior (base) */
  fromXp: number;
  /** Progreso 0-1 dentro del nivel actual */
  progress: number;
  /** Etiqueta legible del nivel */
  label: XpLevelLabel;
  /** Color CSS del gradiente */
  color: string;
  /** Color CSS del texto */
  textColor: string;
  /** XP que faltan para el siguiente nivel */
  remaining: number;
}

/**
 * Hook que lee el XP del usuario actual y devuelve un objeto con
 * toda la info necesaria para renderizar la barra de progreso.
 */
export function useXpLevel(): XpInfo | null {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    if (!user) return null;
    const xp = user.xp ?? 0;
    const level = user.xp_level ?? 1;
    const toNext = user.xp_to_next_level ?? 100;
    const fromXp = (level - 1) * (level - 1) * 100;
    const progress = toNext > fromXp ? (xp - fromXp) / (toNext - fromXp) : 0;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const remaining = Math.max(0, toNext - xp);

    return {
      current: xp,
      level,
      toNext,
      fromXp,
      progress: clampedProgress,
      label: levelToLabel(level),
      color: levelToColor(level),
      textColor: levelToTextColor(level),
      remaining,
    };
  }, [user, user?.xp, user?.xp_level, user?.xp_to_next_level]);
}

/**
 * Devuelve el XP necesario para alcanzar un nivel dado.
 * (level - 1)^2 * 100
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 100;
}

/**
 * Formatea un número grande con sufijos (1.2K, 3.4M)
 */
export function formatXp(xp: number): string {
  if (xp < 1000) return String(xp);
  if (xp < 1_000_000) return `${(xp / 1000).toFixed(1)}K`;
  return `${(xp / 1_000_000).toFixed(1)}M`;
}

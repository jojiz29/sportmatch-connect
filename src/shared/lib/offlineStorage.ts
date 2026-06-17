// ============================================================
// offlineStorage.ts — Wrapper de idb-keyval para cache offline
// SCRUM-411
// ============================================================

import { get, set, del, keys } from "idb-keyval";

/**
 * Storage simple para guardar datos del usuario en IndexedDB.
 * Usado por el Service Worker y por hooks de TanStack Query
 * con networkMode: 'offlineFirst'.
 */

export const KEYS = {
  lastProfile: "sm:last-profile",
  lastMatches: "sm:last-matches",
  lastSquads: "sm:last-squads",
  lastFeed: "sm:last-feed",
  lastBookings: "sm:last-bookings",
  preferences: "sm:preferences",
  userId: "sm:user-id",
} as const;

export interface OfflineCache<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

async function save<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): Promise<void> {
  const cache: OfflineCache<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  await set(key, cache);
}

async function load<T>(key: string): Promise<T | null> {
  const cache = (await get<OfflineCache<T>>(key)) ?? null;
  if (!cache) return null;
  if (Date.now() > cache.expiresAt) {
    await del(key);
    return null;
  }
  return cache.data;
}

async function clearKey(key: string): Promise<void> {
  await del(key);
}

async function clearAll(): Promise<void> {
  const allKeys = await keys();
  await Promise.all(
    (allKeys as Array<string | number | Date | ArrayBuffer | ArrayBufferView>)
      .filter((k): k is string => typeof k === "string" && (k as string).startsWith("sm:"))
      .map((k) => del(k)),
  );
}

export const offlineStorage = {
  save,
  load,
  clear: clearKey,
  clearAll,
  KEYS,
};

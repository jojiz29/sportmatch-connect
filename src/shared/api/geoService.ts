import { supabase } from "./supabase";
import { Court } from "@/entities/types";

// ──────────────────────────────────────────────────────────────
// HAVERSINE (utilidad geométrica)
// ──────────────────────────────────────────────────────────────
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// In-memory cache for courts
interface CacheEntry {
  timestamp: number;
  data: Court[];
}
const courtCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

function getCacheKey(lat: number, lng: number, dist: number) {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${dist}`;
}

import { useAuthStore } from "@/entities/user/useAuth";
import { MOCK_COURTS } from "./apiClient";

export async function searchNearbyCourts(
  latitude: number,
  longitude: number,
  maxDistanceMeters: number = 50_000,
): Promise<Court[]> {
  if (useAuthStore.getState().isDemoMode) {
    const courts = MOCK_COURTS.map((c) => ({
      ...c,
      distance_km: parseFloat(calculateDistance(latitude, longitude, c.lat, c.lng).toFixed(2)),
    }));
    return courts.sort((a, b) => a.distance_km - b.distance_km);
  }

  const cacheKey = getCacheKey(latitude, longitude, maxDistanceMeters);
  const cached = courtCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    if (import.meta.env.DEV) console.log(`[GeoService] Cache hit: ${cacheKey}`);
    return cached.data;
  }

  if (import.meta.env.DEV)
    console.log(
      `[GeoService] Supabase RPC search_nearby_courts (lat=${latitude}, lng=${longitude}, dist=${maxDistanceMeters}m)`,
    );

  const { data, error } = await supabase.rpc("search_nearby_courts", {
    latitude,
    longitude,
    max_distance_meters: maxDistanceMeters,
  });

  if (error) {
    if (import.meta.env.DEV)
      console.error("[GeoService] RPC error fetching nearby courts:", error.message);
    throw new Error(`Failed to search nearby courts: ${error.message}`);
  }

  const courts: Court[] = (data ?? []).map(
    (row: {
      id: string;
      created_at: string;
      name: string;
      sport: string;
      price_per_hour: string | number;
      rating: string | number;
      reviews_count: string | number;
      lat: string | number;
      lng: string | number;
      image_url: string | null;
      amenities: string[] | null;
      is_available: boolean;
      address: string | null;
      is_sponsored: boolean | null;
      distance_km: string | number;
    }) => ({
      id: row.id,
      created_at: row.created_at,
      name: row.name,
      sport: row.sport as Court["sport"],
      price_per_hour: parseFloat(String(row.price_per_hour)),
      rating: parseFloat(String(row.rating)),
      reviews_count: parseInt(String(row.reviews_count), 10),
      lat: parseFloat(String(row.lat)),
      lng: parseFloat(String(row.lng)),
      image_url: row.image_url ?? "",
      amenities: row.amenities ?? [],
      is_available: row.is_available,
      address: row.address ?? undefined,
      is_sponsored: row.is_sponsored ?? false,
      distance_km: parseFloat(parseFloat(String(row.distance_km)).toFixed(2)),
    }),
  );

  courtCache.set(cacheKey, { timestamp: Date.now(), data: courts });
  return courts;
}

export async function getSponsoredCourts(latitude: number, longitude: number): Promise<Court[]> {
  const all = await searchNearbyCourts(latitude, longitude, 100_000);
  return all.filter((c) => c.is_sponsored === true);
}

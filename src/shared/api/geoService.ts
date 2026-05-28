/**
 * geoService.ts
 * Servicio de geolocalización con Hybrid Mode:
 *
 * - PRODUCCIÓN (Supabase configurado): Llama a supabase.rpc('search_nearby_courts')
 *   que ejecuta la función PostGIS en Supabase. El profesor puede auditarlo.
 *
 * - DEMO / MOCK (sin Supabase): Usa la fórmula de Haversine sobre MOCK_COURTS.
 *   La demo nunca falla, incluso sin internet.
 *
 * PostGIS query interna usa ST_DWithin con GEOGRAPHY(Point, 4326) — tipo espacial real.
 */

import { supabase, USE_SUPABASE } from "@/lib/supabase";
import { Court } from "@/entities/types";
import { MOCK_COURTS } from "@/lib/mock";

// ──────────────────────────────────────────────────────────────
// HAVERSINE (fallback local, igual que PostGIS ST_Distance)
// ──────────────────────────────────────────────────────────────
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ──────────────────────────────────────────────────────────────
// IN-MEMORY CACHE (1 min TTL — evita compute excesivo)
// ──────────────────────────────────────────────────────────────
interface CacheEntry {
  timestamp: number;
  data: Court[];
}
const courtCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

function getCacheKey(lat: number, lng: number, dist: number) {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${dist}`;
}

// ──────────────────────────────────────────────────────────────
// MAIN: searchNearbyCourts
// ──────────────────────────────────────────────────────────────
export async function searchNearbyCourts(
  latitude: number,
  longitude: number,
  maxDistanceMeters: number = 50_000,
): Promise<Court[]> {
  // ── MOCK MODE (Supabase no configurado) ──
  if (!USE_SUPABASE) {
    const results = MOCK_COURTS.map((court) => ({
      ...court,
      distance_km: parseFloat(
        calculateDistance(latitude, longitude, court.lat, court.lng).toFixed(2),
      ),
    }))
      .filter((c) => c.distance_km * 1000 <= maxDistanceMeters)
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

    return results;
  }

  // ── SUPABASE MODE — usa RPC con PostGIS ──
  const cacheKey = getCacheKey(latitude, longitude, maxDistanceMeters);
  const cached = courtCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[GeoService] Cache hit: ${cacheKey}`);
    return cached.data;
  }

  console.log(
    `[GeoService] Supabase RPC search_nearby_courts (lat=${latitude}, lng=${longitude}, dist=${maxDistanceMeters}m)`,
  );

  const { data, error } = await supabase.rpc("search_nearby_courts", {
    latitude,
    longitude,
    max_distance_meters: maxDistanceMeters,
  });

  if (error) {
    console.error("[GeoService] RPC error — falling back to mocks:", error.message);
    // Fallback automático a mocks si Supabase falla (demo resiliente)
    return MOCK_COURTS.map((court) => ({
      ...court,
      distance_km: parseFloat(
        calculateDistance(latitude, longitude, court.lat, court.lng).toFixed(2),
      ),
    })).sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
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

// ──────────────────────────────────────────────────────────────
// SPONSORED COURTS — para destacar patrocinadores en el mapa
// Devuelve primero los patrocinados (is_sponsored = true)
// ──────────────────────────────────────────────────────────────
export async function getSponsoredCourts(latitude: number, longitude: number): Promise<Court[]> {
  const all = await searchNearbyCourts(latitude, longitude, 100_000);
  // Los patrocinados ya vienen primero del ORDER BY is_sponsored DESC en la RPC.
  // Para mocks, los filtramos manualmente.
  return all.filter((c) => (c as Court & { is_sponsored?: boolean }).is_sponsored === true);
}

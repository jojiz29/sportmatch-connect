/**
 * ===================================================================
 * ARCHIVO: src/shared/api/geoService.ts
 * PROPÓSITO: Servicios de geolocalización para búsqueda de canchas
 *            cercanas usando la fórmula de Haversine y la función
 *            RPC search_nearby_courts de PostGIS en Supabase.
 * INCLUYE:
 *   - calculateDistance(): Fórmula Haversine para distancia entre
 *     dos coordenadas geográficas
 *   - searchNearbyCourts(): Canchas cercanas con caché en memoria
 *   - getSponsoredCourts(): Canchas patrocinadas filtradas
 * ===================================================================
 */

import { supabase } from "./supabase";
import { Court } from "@/entities/types";

// ==============================================================
// FÓRMULA HAVERSINE: Cálculo de distancia entre puntos geográficos
// ==============================================================
// La fórmula de Haversine calcula la distancia del gran círculo
// entre dos puntos en una esfera (la Tierra) usando latitud/longitud.
// Retorna la distancia en kilómetros.
// Fórmula: a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
//          c = 2 · atan2(√a, √(1-a))
//          d = R · c   (R = radio terrestre = 6371 km)
// ==============================================================
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180; // Diferencia de latitud en radianes
  const dLon = ((lon2 - lon1) * Math.PI) / 180; // Diferencia de longitud en radianes
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ==============================================================
// CACHÉ EN MEMORIA: Evita consultas repetitivas a PostGIS
// ==============================================================
// Almacena resultados de searchNearbyCourts con un TTL de 60 segundos
// para evitar saturar la base de datos con consultas geográficas
// cuando el usuario mueve el mapa o cambia filtros rápidamente.
interface CacheEntry {
  timestamp: number;
  data: Court[];
}
const courtCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 segundos

function getCacheKey(lat: number, lng: number, dist: number) {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}_${dist}`;
}

import { useAuthStore } from "@/entities/user/useAuth";
import { apiClient } from "./apiClient";

/**
 * searchNearbyCourts(): Busca canchas cercanas a una ubicación
 * ------------------------------------------------------------------
 * En Demo Mode: filtra mock data usando Haversine en el cliente.
 * En modo real: llama a la RPC search_nearby_courts de Supabase/PostGIS.
 * Los resultados se cachean en memoria por 60 segundos.
 *
 * @param latitude         - Latitud del centro de búsqueda
 * @param longitude        - Longitud del centro de búsqueda
 * @param maxDistanceMeters - Radio máximo en metros (default: 50km)
 * @returns Array de Court con distance_km calculado
 */
export async function searchNearbyCourts(
  latitude: number,
  longitude: number,
  maxDistanceMeters: number = 50_000,
): Promise<Court[]> {
  // --- MODO DEMO: Calcula distancias con Haversine en el cliente ---
  if (useAuthStore.getState().isDemoMode) {
    const list = await apiClient.venues.getAll();
    const courts = list.map((c) => ({
      ...c,
      distance_km: parseFloat(calculateDistance(latitude, longitude, c.lat, c.lng).toFixed(2)),
    }));
    return courts.sort((a, b) => a.distance_km - b.distance_km);
  }

  // --- MODO REAL: Intenta usar caché primero ---
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

  // --- Ejecuta RPC PostGIS en Supabase ---
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

  // --- Normaliza los campos numéricos (vienen como string desde Postgres) ---
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
      district: string | null;
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
      district: row.district ?? undefined,
    }),
  );

  // --- Guarda en caché ---
  courtCache.set(cacheKey, { timestamp: Date.now(), data: courts });
  return courts;
}

/**
 * getSponsoredCourts(): Filtra solo canchas patrocinadas
 * Útil para mostrar cards destacadas en la página principal.
 */
export async function getSponsoredCourts(latitude: number, longitude: number): Promise<Court[]> {
  const all = await searchNearbyCourts(latitude, longitude, 100_000);
  return all.filter((c) => c.is_sponsored === true);
}

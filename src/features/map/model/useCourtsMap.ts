// ============================================================
// useCourtsMap.ts — Hook para cargar canchas con PostGIS
// SCRUM-210
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/shared/api/supabase";

export interface CourtOnMap {
  id: string;
  name: string;
  address: string | null;
  sport: string;
  price_per_hour: number;
  distance_km: number;
  photo_url: string | null;
  lat: number;
  lng: number;
}

export interface MapFilters {
  lat: number;
  lng: number;
  radius_km: number;
  sport?: string;
  max_price?: number;
}

const DEFAULT_CENTER = { lat: -12.0464, lng: -77.0428 }; // Lima, Peru

export function useCourtsMap() {
  const [courts, setCourts] = useState<CourtOnMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [filters, setFilters] = useState<MapFilters>({
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    radius_km: 25,
  });

  const search = useCallback(async (override?: Partial<MapFilters>) => {
    const params = { ...filters, ...override };
    setFilters(params);
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc("search_courts_nearby", {
        p_lng: params.lng,
        p_lat: params.lat,
        p_radius_km: params.radius_km,
        p_sport: params.sport ?? null,
        p_max_price: params.max_price ?? null,
      });
      if (rpcErr) throw rpcErr;
      setCourts((data || []) as CourtOnMap[]);
      setCenter({ lat: params.lat, lng: params.lng });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al buscar canchas";
      setError(msg);
      setCourts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Carga inicial con centro default
  useEffect(() => {
    search({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centrar en ubicacion del usuario
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalizacion no soportada");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        search({ lat: latitude, lng: longitude });
      },
      (err) => {
        setError(`No se pudo obtener ubicacion: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [search]);

  return {
    courts,
    loading,
    error,
    center,
    filters,
    search,
    setFilters,
    useMyLocation,
  };
}

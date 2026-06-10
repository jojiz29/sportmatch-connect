import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { MapFeature } from "@/features/map/MapFeature";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { searchNearbyCourts, calculateDistance } from "@/shared/api/geoService";
import { Court, Match } from "@/entities/types";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/app/map")({
  head: () => ({
    meta: [
      { title: "Mapa en vivo — SportMatch" },
      { name: "description", content: "Encuentra jugadores y canchas activas cerca tuyo." },
      { property: "og:title", content: "SportMatch - Mapa en vivo" },
      {
        property: "og:description",
        content: "Descubre quién está jugando cerca tuyo ahora mismo.",
      },
      { property: "og:image", content: "https://sportmatch.app/og-map.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    // If in demo mode, bypass backend fetch immediately for zero-lag (Task 2.4 / 2.5)
    if (useAuthStore.getState().isDemoMode) {
      const [courts, players, matches] = await Promise.all([
        apiClient.courts.getAll().catch(() => []),
        apiClient.users.getMatches().catch(() => []),
        apiClient.matches.getAll().catch(() => []),
      ]);
      return { courts, players, matches };
    }

    const [backendCourts, backendMatches] = await Promise.all([
      backendApi.courts.getAll().catch(() => null),
      backendApi.matches.getAll().catch(() => null),
    ]);

    const [courts, players, matches] = await Promise.all([
      backendCourts && backendCourts.data
        ? Promise.resolve(backendCourts.data as Court[])
        : apiClient.courts.getAll().catch(() => []),
      apiClient.users.getMatches().catch(() => []),
      backendMatches && backendMatches.data
        ? Promise.resolve(backendMatches.data as Match[])
        : apiClient.matches.getAll().catch(() => []),
    ]);
    return { courts, players, matches };
  },
  pendingComponent: MapPendingComponent,
  component: MapPage,
});

function MapPendingComponent() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mb-2" />
      <div className="h-5 w-72 bg-muted animate-pulse rounded-lg mb-8" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[560px] rounded-3xl bg-muted animate-pulse border border-border" />
        <div className="space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-5 space-y-4">
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 items-center animate-pulse">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded-lg" />
                    <div className="h-3 w-1/2 bg-muted rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  "Santiago de Surco": [-12.1314, -76.9812],
  "San Borja": [-12.1067, -76.9989],
  Miraflores: [-12.1228, -77.0282],
  Lince: [-12.0833, -77.0333],
  Magdalena: [-12.0911, -77.0694],
};

function MapPage() {
  const { t } = useTranslation();
  const data = Route.useLoaderData();
  const user = useAuthStore((state) => state.user);
  const [courts, setCourts] = useState<Court[]>(data.courts);
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let active = true;
    let baseLat = -12.14; // Default Surco lat
    let baseLng = -76.995; // Default Surco lng

    if (user && user.last_location_lat && user.last_location_lng) {
      baseLat = user.last_location_lat;
      baseLng = user.last_location_lng;
    }

    const loadCourts = async (latitude: number, longitude: number) => {
      try {
        const fetched = await searchNearbyCourts(latitude, longitude);
        if (active) {
          setCourts(fetched);
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Error loading nearby courts from spatial search:", err);
      }
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (active) {
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            loadCourts(position.coords.latitude, position.coords.longitude);
          }
        },
        (error) => {
          if (import.meta.env.DEV)
            console.warn(
              "Geolocation API unavailable or permission denied. Using profile location.",
              error.message,
            );
          if (active) {
            loadCourts(baseLat, baseLng);
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    } else {
      loadCourts(baseLat, baseLng);
    }

    return () => {
      active = false;
    };
  }, [user, user?.last_location_lat, user?.last_location_lng]);

  const baseLocation = useMemo(() => {
    if (userCoords) return userCoords;
    if (user && user.last_location_lat && user.last_location_lng) {
      return { lat: user.last_location_lat, lng: user.last_location_lng };
    }
    return null;
  }, [userCoords, user]);

  const [selectedDistrict, setSelectedDistrict] = useState("");

  const selectedDistrictCenter = useMemo(() => {
    if (!selectedDistrict) return null;
    return DISTRICT_CENTROIDS[selectedDistrict] || null;
  }, [selectedDistrict]);

  const sortedCourts = useMemo(() => {
    if (!baseLocation) return courts;
    const res = [...courts]
      .map((c) => ({
        ...c,
        distance_km: calculateDistance(baseLocation.lat, baseLocation.lng, c.lat, c.lng),
      }))
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    console.log(
      "SORTED COURTS DEBUG:",
      baseLocation,
      res.slice(0, 3).map((c) => `${c.name} (${c.distance_km?.toFixed(2)} km)`),
    );
    return res;
  }, [courts, baseLocation]);

  const filteredCourts = useMemo(() => {
    if (!selectedDistrict) return sortedCourts;
    return sortedCourts.filter((c) =>
      c.district?.toLowerCase().includes(selectedDistrict.toLowerCase()),
    );
  }, [sortedCourts, selectedDistrict]);

  if (!data || !data.courts || !data.matches) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  const { players, matches } = data;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Mapa en vivo" subtitle="Canchas, partidos y jugadores cerca tuyo" />

      {/* District Selector Filter */}
      <div className="bg-gradient-card border border-border/40 rounded-2xl p-4 mb-6 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-card">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span className="text-neon">📍</span>{" "}
          {t("map.filter_district", "Filtrar por distrito / Hub")}
        </div>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="bg-accent/40 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-foreground transition-all cursor-pointer min-w-[220px]"
        >
          <option value="">{t("map.all_districts", "Todos los distritos")}</option>
          <option value="Santiago de Surco">Santiago de Surco</option>
          <option value="San Borja">San Borja</option>
          <option value="Miraflores">Miraflores</option>
          <option value="Lince">Lince</option>
          <option value="Magdalena">Magdalena del Mar</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-[560px] rounded-3xl overflow-hidden shadow-card animate-fade-in">
          <ErrorBoundary>
            <MapFeature
              courts={filteredCourts}
              players={players}
              matches={matches}
              onBookCourt={(c) => setSelectedCourtForBooking(c)}
              selectedDistrictCenter={selectedDistrictCenter}
            />
          </ErrorBoundary>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card max-h-[560px] overflow-y-auto">
            <h3 className="font-semibold mb-3">Cerca tuyo (Ordenado por distancia)</h3>
            <div className="space-y-3">
              {filteredCourts.map((c) => (
                <CourtCard
                  key={`${c.id}-${c.name}-${c.district}`}
                  court={c}
                  onClick={() => setSelectedCourtForBooking(c)}
                  baseLocation={baseLocation}
                  variant="list"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        court={selectedCourtForBooking}
        isOpen={selectedCourtForBooking !== null}
        onOpenChange={(open) => !open && setSelectedCourtForBooking(null)}
        baseLocation={baseLocation}
      />
    </div>
  );
}

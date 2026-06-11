import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { MapFeature } from "@/features/map/MapFeature";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { calculateDistance } from "@/shared/api/geoService";
import { Match, User } from "@/entities/types";
import { CommercialSheetModal } from "@/features/business/ui/CommercialSheetModal";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/app/map")({
  head: () => ({
    meta: [
      { title: "Mapa Comercial — SportMatch" },
      {
        name: "description",
        content: "Encuentra establecimientos y centros deportivos cerca de ti.",
      },
      { property: "og:title", content: "SportMatch - Mapa Comercial" },
      {
        property: "og:description",
        content: "Descubre gimnasios, academias, centros de nutrición y fisioterapia cerca de ti.",
      },
      { property: "og:image", content: "https://sportmatch.app/og-map.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => {
    // If in demo mode, bypass backend fetch immediately for zero-lag
    if (useAuthStore.getState().isDemoMode) {
      const [matches, businesses, venues] = await Promise.all([
        apiClient.matches.getAll().catch(() => []),
        apiClient.users.getBusinesses().catch(() => []),
        apiClient.venues.getAll().catch(() => []),
      ]);
      return { matches, businesses, venues };
    }

    const [backendMatches] = await Promise.all([backendApi.matches.getAll().catch(() => null)]);

    const [matches, businesses, venues] = await Promise.all([
      backendMatches && backendMatches.data
        ? Promise.resolve(backendMatches.data as Match[])
        : apiClient.matches.getAll().catch(() => []),
      apiClient.users.getBusinesses().catch(() => []),
      apiClient.venues.getAll().catch(() => []),
    ]);
    return { matches, businesses, venues };
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

function BusinessListCard({
  business,
  onClick,
  distance,
}: {
  business: User;
  onClick: () => void;
  distance?: number;
}) {
  let emoji = "🥤";
  const cat = business.business_category;
  if (cat === "Canchas") emoji = "🏟️";
  else if (cat === "Gym") emoji = "🏋️";
  else if (cat === "Tienda") emoji = "🛍️";
  else if (cat === "Academia") emoji = "🎓";
  else if (cat === "Nutricionista") emoji = "🍎";
  else if (cat === "Fisioterapia") emoji = "💆";
  else if (cat === "Torneos") emoji = "🏆";
  else if (cat === "Marcas") emoji = "🏷️";
  else if (cat === "Patrocinador") emoji = "⭐";

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 items-center p-3 rounded-2xl cursor-pointer transition-all hover:bg-accent/40 bg-card border ${
        business.is_sponsored ? "border-amber-500/50 shadow-neon-gold" : "border-border/50"
      }`}
    >
      <div className="h-12 w-12 rounded-xl bg-accent/40 flex items-center justify-center text-xl shrink-0 border border-border/30 overflow-hidden">
        {business.avatar_url ? (
          <img
            src={business.avatar_url}
            alt={business.company_name || business.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{emoji}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
          {business.company_name || business.name}
          {business.is_sponsored && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
              PRO
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {business.business_category} · {business.district || "Surco"}
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3 text-neon" />
            {distance !== undefined ? `${distance.toFixed(1)} km` : "Cerca de ti"}
          </span>
        </div>
      </div>
    </div>
  );
}

function MapPage() {
  const { t } = useTranslation();
  const data = Route.useLoaderData();
  const user = useAuthStore((state) => state.user);
  const [selectedBusinessForSheet, setSelectedBusinessForSheet] = useState<User | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let active = true;

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (active) {
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          }
        },
        (error) => {
          if (import.meta.env.DEV) console.warn("Geolocation API unavailable:", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    }

    return () => {
      active = false;
    };
  }, []);

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

  const sortedBusinesses = useMemo(() => {
    const list = data.businesses || [];
    if (!baseLocation) return list;
    return [...list]
      .map((b) => ({
        ...b,
        distance_km: calculateDistance(
          baseLocation.lat,
          baseLocation.lng,
          b.last_location_lat ?? -12.14,
          b.last_location_lng ?? -76.995,
        ),
      }))
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
  }, [data.businesses, baseLocation]);

  const filteredBusinesses = useMemo(() => {
    if (!selectedDistrict) return sortedBusinesses;
    return sortedBusinesses.filter((b) =>
      (b.district || "").toLowerCase().includes(selectedDistrict.toLowerCase()),
    );
  }, [sortedBusinesses, selectedDistrict]);

  const filteredVenues = useMemo(() => {
    const list = data.venues || [];
    if (!selectedDistrict) return list;
    return list.filter((c) =>
      (c.district || "").toLowerCase().includes(selectedDistrict.toLowerCase()),
    );
  }, [data.venues, selectedDistrict]);

  if (!data || !data.businesses) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader
        title="Mapa Comercial"
        subtitle="Descubre centros deportivos y especialistas cerca tuyo"
      />

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
              venues={filteredVenues}
              players={filteredBusinesses}
              selectedDistrictCenter={selectedDistrictCenter}
              onViewCommercialSheet={(b) => setSelectedBusinessForSheet(b)}
            />
          </ErrorBoundary>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card max-h-[560px] overflow-y-auto">
            <h3 className="font-semibold mb-3 text-left">Cerca tuyo (Ordenado por distancia)</h3>
            <div className="space-y-3">
              {filteredBusinesses.map((b) => (
                <BusinessListCard
                  key={b.id}
                  business={b}
                  onClick={() => setSelectedBusinessForSheet(b)}
                  distance={b.distance_km}
                />
              ))}
              {filteredBusinesses.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No hay centros deportivos en este distrito.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CommercialSheetModal
        business={selectedBusinessForSheet}
        isOpen={selectedBusinessForSheet !== null}
        onOpenChange={(open) => !open && setSelectedBusinessForSheet(null)}
      />
    </div>
  );
}

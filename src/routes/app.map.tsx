import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { MapFeature } from "@/features/map/MapFeature";
import { apiClient } from "@/shared/api/apiClient";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { searchNearbyCourts } from "@/shared/api/geoService";
import { Court } from "@/entities/types";

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
    const [courts, matches] = await Promise.all([
      apiClient.courts.getAll(),
      apiClient.users.getMatches(),
    ]);
    return { courts, matches };
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

function MapPage() {
  const data = Route.useLoaderData();
  const user = useAuthStore((state) => state.user);
  const [courts, setCourts] = useState<Court[]>(data.courts);

  useEffect(() => {
    let baseLat = -12.14; // Default Surco lat
    let baseLng = -76.995; // Default Surco lng

    if (user && user.last_location_lat && user.last_location_lng) {
      baseLat = user.last_location_lat;
      baseLng = user.last_location_lng;
    }

    const loadCourts = async (latitude: number, longitude: number) => {
      try {
        const fetched = await searchNearbyCourts(latitude, longitude);
        setCourts(fetched);
      } catch (err) {
        console.error("Error loading nearby courts from spatial search:", err);
      }
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          loadCourts(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn(
            "Geolocation API unavailable or permission denied. Using profile location.",
            error.message,
          );
          loadCourts(baseLat, baseLng);
        },
      );
    } else {
      loadCourts(baseLat, baseLng);
    }
  }, [user, user?.last_location_lat, user?.last_location_lng]);

  if (!data || !data.courts || !data.matches) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  const { matches } = data;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Mapa en vivo" subtitle="Canchas, partidos y jugadores cerca tuyo" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-[560px] rounded-3xl overflow-hidden shadow-card animate-fade-in">
          <ErrorBoundary>
            <MapFeature courts={courts} matches={matches} />
          </ErrorBoundary>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card max-h-[560px] overflow-y-auto">
            <h3 className="font-semibold mb-3">Cerca tuyo (Ordenado por distancia)</h3>
            <div className="space-y-3">
              {courts.map((c) => (
                <div
                  key={c.id}
                  className="flex gap-3 items-center hover:bg-accent/40 p-2 rounded-xl transition-colors"
                >
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.distance_km} km · ${c.price_per_hour}/h
                    </div>
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

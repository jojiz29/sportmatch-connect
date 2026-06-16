// ============================================================
// CourtsMap.tsx — Mapa interactivo de canchas con Leaflet
// SCRUM-210
// ============================================================

import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster";
import { Crosshair, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useCourtsMap, type CourtOnMap } from "../model/useCourtsMap";
import { cn } from "@/lib/utils";

// Fix para los iconos de Leaflet en Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

const SPORTS = [
  { value: "Futbol", label: "Futbol" },
  { value: "Basquet", label: "Basquet" },
  { value: "Tenis", label: "Tenis" },
  { value: "Padel", label: "Padel" },
  { value: "Voley", label: "Voley" },
];

function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 13);
  }, [center, map]);
  return null;
}

interface CourtsMapProps {
  className?: string;
  onCourtClick?: (court: CourtOnMap) => void;
}

export function CourtsMap({ className, onCourtClick }: CourtsMapProps) {
  const { t } = useTranslation();
  const { courts, loading, error, center, filters, setFilters, search, useMyLocation } =
    useCourtsMap();

  const handleSportChange = (sport: string) => {
    setFilters((f) => ({ ...f, sport: sport === f.sport ? undefined : sport }));
    search({ sport: sport === filters.sport ? undefined : sport });
  };

  const handleRadiusChange = (radius_km: number) => {
    setFilters((f) => ({ ...f, radius_km }));
    search({ radius_km });
  };

  const handlePriceChange = (max_price: number | undefined) => {
    setFilters((f) => ({ ...f, max_price }));
    search({ max_price });
  };

  const courtIcon = useMemo(
    () =>
      L.divIcon({
        className: "court-marker",
        html: `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-glow border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
    [],
  );

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      <div className="rounded-2xl bg-card/60 backdrop-blur border border-border/40 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-bold flex-1">
            {t("map.title", "Canchas cercanas")}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={useMyLocation}
            disabled={loading}
            className="min-h-[44px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4 mr-2" />
            )}
            {t("map.my_location", "Mi ubicacion")}
          </Button>
        </div>

        <div className="mt-3 space-y-3">
          {/* Filtro de deportes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              {t("map.sport_label", "Deporte")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SPORTS.map((s) => {
                const isActive = filters.sport === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleSportChange(s.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[32px]",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border/40 hover:border-primary/50",
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider de radio */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              {t("map.radius_label", "Radio")}: {filters.radius_km} km
            </label>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={filters.radius_km}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="w-full accent-primary min-h-[44px]"
              aria-label="Radio de busqueda en km"
            />
          </div>

          {/* Filtro de precio maximo */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              {t("map.price_label", "Precio maximo")}:{" "}
              {filters.max_price ? `${filters.max_price} FC` : t("map.any", "Cualquiera")}
            </label>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={filters.max_price ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                handlePriceChange(v === 0 ? undefined : v);
              }}
              className="w-full accent-primary min-h-[44px]"
              aria-label="Precio maximo por hora en FitCoins"
            />
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          {loading
            ? t("map.searching", "Buscando canchas...")
            : `${courts.length} ${t("map.courts_found", "canchas encontradas")}`}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden border border-border/40 shadow-card"
        style={{ height: "60vh", minHeight: "400px" }}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <MapController center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          {courts.map((court) => (
            <Marker
              key={court.id}
              position={[court.lat, court.lng]}
              icon={courtIcon}
              eventHandlers={{
                click: () => onCourtClick?.(court),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">{court.name}</div>
                  {court.address && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {court.address}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      {court.sport}
                    </span>
                    <span className="text-muted-foreground">
                      {court.distance_km.toFixed(1)} km
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-primary">
                    {court.price_per_hour} FC/h
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="text-xs text-muted-foreground px-2">
        {t("map.attribution", "Tiles por OpenStreetMap contributors")}
      </div>
    </div>
  );
}

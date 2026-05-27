import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Court, User } from "@/entities/types";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTranslation } from "react-i18next";
import { MOCK_MATCHES } from "@/lib/mock";

// Generador de iconos premium personalizados usando L.divIcon
const createCourtIcon = (sport: string) => {
  const emoji =
    sport === "Pádel" ? "🏓" : sport === "Fútbol" ? "⚽" : sport === "Tenis" ? "🎾" : "🏃";
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        width: 40px;
        height: 40px;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(139, 92, 246, 0.7);
        font-size: 18px;
        transition: transform 0.2s ease-in-out;
      ">
        ${emoji}
      </div>
    `,
    className: "custom-court-marker-wrapper",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const playerIcon = L.divIcon({
  html: `
    <div style="
      display: flex;
      width: 32px;
      height: 32px;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 242, 254, 0.7);
      font-size: 14px;
    ">
      👤
    </div>
  `,
  className: "custom-player-marker-wrapper",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export function MapFeature({ courts, matches }: { courts: Court[]; matches: User[] }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const courtMarkers = useMemo(() => {
    return courts.map((c) => {
      const activeMatches = MOCK_MATCHES.filter((m) => m.court_id === c.id).length;
      return (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={createCourtIcon(c.sport)}>
          <Popup>
            <div className="p-1 min-w-[150px] font-sans">
              <div className="font-bold text-sm text-foreground mb-0.5">{c.name}</div>
              <div className="text-xs text-muted-foreground mb-1.5">
                {c.sport} · ${c.price_per_hour}/h
              </div>
              <div className="text-xs font-semibold text-neon flex items-center gap-1 mb-3">
                🔥 {activeMatches} {activeMatches === 1 ? "partido activo" : "partidos activos"}
              </div>
              <a
                href={`/app/courts/${c.id}`}
                className="block w-full text-center px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow"
              >
                {t("map.view_court")}
              </a>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [courts, t]);

  const matchMarkers = useMemo(() => {
    return matches.map((m) => {
      if (!m.last_location_lat || !m.last_location_lng) return null;
      return (
        <Marker key={m.id} position={[m.last_location_lat, m.last_location_lng]} icon={playerIcon}>
          <Popup>
            <div className="p-1 font-sans">
              <div className="font-bold text-sm text-foreground">{m.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {m.distance_km} km de distancia
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [matches]);

  if (!mounted || typeof window === "undefined") {
    return <div className="h-[600px] min-h-[500px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

  return (
    <div className="h-[600px] min-h-[500px] w-full flex-1 rounded-3xl overflow-hidden border border-border shadow-card relative z-0">
      <MapContainer
        center={[-12.14, -76.995]}
        zoom={14}
        style={{ height: "100%", width: "100%", minHeight: "500px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading>
          {courtMarkers}
          {matchMarkers}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

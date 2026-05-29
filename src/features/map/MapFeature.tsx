import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Court, Match, User } from "@/entities/types";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTranslation } from "react-i18next";

// Cache for Leaflet court icons to prevent memory leaks and GC overhead
const courtIconCache = new Map<string, L.DivIcon>();

const createCourtIcon = (sport: string, isSponsored?: boolean) => {
  const cacheKey = `${sport}_${isSponsored}`;
  if (courtIconCache.has(cacheKey)) {
    return courtIconCache.get(cacheKey)!;
  }
  const getSportEmoji = (name: string) => {
    switch (name.toLowerCase()) {
      case "paddle":
      case "padel":
      case "pádel":
        return "🏓";
      case "football":
      case "futbol":
      case "fútbol":
        return "⚽";
      case "tennis":
      case "tenis":
        return "🎾";
      case "running":
        return "🏃";
      case "basketball":
      case "basquet":
      case "básquet":
        return "🏀";
      case "volleyball":
      case "voley":
      case "vóley":
        return "🏐";
      default:
        return "🏆";
    }
  };
  const emoji = getSportEmoji(sport);

  // Gold ring for sponsored courts, purple for regular
  const border = isSponsored ? "3px solid #fbbf24" : "2.5px solid #ffffff";
  const bg = isSponsored
    ? "linear-gradient(135deg, #f59e0b, #d97706)"
    : "linear-gradient(135deg, #8b5cf6, #3b82f6)";
  const shadow = isSponsored
    ? "0 0 20px rgba(251, 191, 36, 0.9), 0 0 8px rgba(251, 191, 36, 0.5)"
    : "0 0 15px rgba(139, 92, 246, 0.7)";
  const sponsorBadge = isSponsored
    ? `<div style="position:absolute;top:-6px;right:-6px;background:#fbbf24;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:8px;border:1px solid #fff">⭐</div>`
    : "";

  const icon = L.divIcon({
    html: `
      <div style="position:relative;display:flex;width:40px;height:40px;align-items:center;justify-content:center;background:${bg};border:${border};border-radius:50%;box-shadow:${shadow};font-size:18px;">
        ${emoji}
        ${sponsorBadge}
      </div>
    `,
    className: `custom-court-marker-wrapper${isSponsored ? " animate-pulse" : ""}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
  courtIconCache.set(cacheKey, icon);
  return icon;
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

const businessIconCache = new Map<string, L.DivIcon>();

const createBusinessIcon = (isSponsored?: boolean, category?: string) => {
  const key = `${isSponsored}_${category}`;
  if (businessIconCache.has(key)) {
    return businessIconCache.get(key)!;
  }

  const emoji =
    category === "Canchas" ? "🏟️" : category === "Gym" ? "🏋️" : category === "Tienda" ? "🛍️" : "🥤";

  const border = isSponsored ? "2.5px solid #fbbf24" : "2px solid #ffffff";
  const shadow = isSponsored
    ? "0 0 15px rgba(251, 191, 36, 0.9)"
    : "0 0 10px rgba(16, 185, 129, 0.5)";
  const bg = isSponsored
    ? "linear-gradient(135deg, #f59e0b, #d97706)"
    : "linear-gradient(135deg, #10b981, #059669)";

  const icon = L.divIcon({
    html: `
      <div style="
        display: flex;
        width: 36px;
        height: 36px;
        align-items: center;
        justify-content: center;
        background: ${bg};
        border: ${border};
        border-radius: 50%;
        box-shadow: ${shadow};
        font-size: 16px;
      ">
        ${emoji}
      </div>
    `,
    className: `custom-business-marker-wrapper ${isSponsored ? "animate-pulse" : ""}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

  businessIconCache.set(key, icon);
  return icon;
};

export function MapFeature({
  courts,
  players,
  matches,
}: {
  courts: Court[];
  players: User[];
  matches: Match[];
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const courtMarkers = useMemo(() => {
    return courts.map((c) => {
      const activeMatches = matches.filter((m) => m.court_id === c.id).length;
      return (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={createCourtIcon(c.sport, c.is_sponsored)}
        >
          <Popup>
            <div className="p-1 min-w-[150px] font-sans">
              {c.is_sponsored && (
                <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5">
                  ⭐ Cancha Patrocinada
                </span>
              )}
              <div className="font-bold text-sm text-foreground mb-0.5">{c.name}</div>
              <div className="text-xs text-muted-foreground mb-1.5">
                {c.sport} · S/{c.price_per_hour}/h
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
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-3 py-2 mt-2 rounded-xl bg-gradient-neon text-neon-foreground text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-neon"
              >
                Cómo llegar
              </a>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [courts, matches, t]);

  const matchMarkers = useMemo(() => {
    return players.map((m) => {
      if (!m.last_location_lat || !m.last_location_lng) return null;

      const isBusiness = m.user_role === "BUSINESS";
      const icon = isBusiness
        ? createBusinessIcon(m.is_sponsored, m.business_category)
        : playerIcon;

      return (
        <Marker key={m.id} position={[m.last_location_lat, m.last_location_lng]} icon={icon}>
          <Popup>
            <div className="p-1 font-sans min-w-[150px]">
              {isBusiness && m.is_sponsored && (
                <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5 animate-pulse">
                  ⭐ Sponsor Premium
                </span>
              )}
              <div className="font-bold text-sm text-foreground">{m.company_name || m.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isBusiness ? `${m.business_category} · ` : ""}
                {m.distance_km !== undefined ? `${m.distance_km} km de distancia` : "Cerca de ti"}
              </div>
              {isBusiness && (
                <a
                  href="/app/wallet"
                  className="block w-full text-center px-2 py-1.5 mt-3 rounded-xl bg-gradient-primary text-primary-foreground text-[10px] font-bold hover:scale-[1.02] transition-transform"
                >
                  Ver Catálogo
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [players]);

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

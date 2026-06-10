import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
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

interface PopupContentProps {
  court: Court;
  activeMatches: number;
  onBookCourt?: (court: Court) => void;
  onViewCourt: (courtId: string) => void;
  t: (key: string, fallback: string) => string;
}

function PopupContent({ court, activeMatches, onBookCourt, onViewCourt, t }: PopupContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Prevent Leaflet from dragging/closing popup on container interaction
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);

    const handleNativeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest("[data-action]");
      if (!clickable) return;

      const action = clickable.getAttribute("data-action");
      if (action === "book") {
        e.preventDefault();
        e.stopPropagation();
        onBookCourt?.(court);
      } else if (action === "view") {
        e.preventDefault();
        e.stopPropagation();
        onViewCourt(court.id);
      }
    };

    el.addEventListener("click", handleNativeClick);
    return () => {
      el.removeEventListener("click", handleNativeClick);
    };
  }, [court, onBookCourt, onViewCourt]);

  return (
    <div ref={containerRef} className="p-1 min-w-[150px] font-sans">
      {court.is_sponsored && (
        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5">
          ⭐ Cancha Patrocinada
        </span>
      )}
      <div className="font-bold text-sm text-foreground mb-0.5">{court.name}</div>
      <div className="text-xs text-muted-foreground mb-1.5">
        {court.sport} · S/{court.price_per_hour}/h
      </div>
      <div className="text-xs font-semibold text-neon flex items-center gap-1 mb-3">
        🔥 {activeMatches} {activeMatches === 1 ? "partido activo" : "partidos activos"}
      </div>
      <button
        type="button"
        data-action="book"
        className="block w-full text-center px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow mb-2 cursor-pointer border-0"
      >
        RESERVAR AHORA
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-action="view"
          className="block text-center px-2 py-1.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-[10px] font-bold transition-all border-0 cursor-pointer"
        >
          {t("map.view_court", "Ver Cancha")}
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${court.lat},${court.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block text-center px-2 py-1.5 rounded-xl bg-gradient-neon text-neon-foreground text-[10px] font-bold hover:scale-[1.02] transition-all shadow-neon"
        >
          Cómo llegar
        </a>
      </div>
    </div>
  );
}

interface BusinessPopupProps {
  player: User;
  onNavigateWallet: () => void;
}

function BusinessPopup({ player, onNavigateWallet }: BusinessPopupProps) {
  const isBusiness = player.user_role === "BUSINESS";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);

    const handleNativeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest("[data-action]");
      if (!clickable) return;

      const action = clickable.getAttribute("data-action");
      if (action === "catalog") {
        e.preventDefault();
        e.stopPropagation();
        onNavigateWallet();
      }
    };

    el.addEventListener("click", handleNativeClick);
    return () => {
      el.removeEventListener("click", handleNativeClick);
    };
  }, [onNavigateWallet]);

  return (
    <div ref={containerRef} className="p-1 font-sans min-w-[150px]">
      {isBusiness && player.is_sponsored && (
        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5 animate-pulse">
          ⭐ Sponsor Premium
        </span>
      )}
      <div className="font-bold text-sm text-foreground">{player.company_name || player.name}</div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {isBusiness ? `${player.business_category} · ` : ""}
        {player.distance_km !== undefined ? `${player.distance_km} km de distancia` : "Cerca de ti"}
      </div>
      {isBusiness && (
        <button
          type="button"
          data-action="catalog"
          className="block w-full text-center px-2 py-1.5 mt-3 rounded-xl bg-gradient-primary text-primary-foreground text-[10px] font-bold hover:scale-[1.02] transition-transform cursor-pointer border-0"
        >
          Ver Catálogo
        </button>
      )}
    </div>
  );
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [map, center, zoom]);
  return null;
}

export function MapFeature({
  courts,
  players,
  matches,
  onBookCourt,
  selectedDistrictCenter,
}: {
  courts: Court[];
  players: User[];
  matches: Match[];
  onBookCourt?: (court: Court) => void;
  selectedDistrictCenter?: [number, number] | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Temporary circle highlight state
  const [highlightCoords, setHighlightCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedDistrictCenter) {
      setHighlightCoords(selectedDistrictCenter);
      const timer = setTimeout(() => {
        setHighlightCoords(null);
      }, 3000); // 3 seconds visual highlight
      return () => clearTimeout(timer);
    }
  }, [selectedDistrictCenter]);

  const onViewCourt = useCallback(
    (courtId: string) => {
      navigate({ to: "/app/courts/$courtId", params: { courtId } });
    },
    [navigate],
  );

  const onNavigateWallet = useCallback(() => {
    navigate({ to: "/app/wallet", search: { buyItem: undefined } });
  }, [navigate]);

  const courtMarkers = useMemo(() => {
    return courts.map((c) => {
      const activeMatches = matches.filter((m) => m.court_id === c.id).length;
      return (
        <Marker
          key={`${c.id}-${c.name}-${c.district}`}
          position={[c.lat, c.lng]}
          icon={createCourtIcon(c.sport, c.is_sponsored)}
        >
          <Popup>
            <PopupContent
              court={c}
              activeMatches={activeMatches}
              onBookCourt={onBookCourt}
              onViewCourt={onViewCourt}
              t={t}
            />
          </Popup>
        </Marker>
      );
    });
  }, [courts, matches, t, onBookCourt, onViewCourt]);

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
            <BusinessPopup player={m} onNavigateWallet={onNavigateWallet} />
          </Popup>
        </Marker>
      );
    });
  }, [players, onNavigateWallet]);

  if (!mounted || typeof window === "undefined") {
    return <div className="h-[600px] min-h-[500px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

  // Adjust center/zoom based on selected district or default
  const mapCenter = selectedDistrictCenter || [-12.14, -76.995];
  const mapZoom = selectedDistrictCenter ? 14 : 13;

  return (
    <div className="h-[600px] min-h-[500px] w-full flex-1 rounded-3xl overflow-hidden border border-border shadow-card relative z-0">
      <MapContainer
        center={[-12.14, -76.995]}
        zoom={13}
        style={{ height: "100%", width: "100%", minHeight: "500px" }}
      >
        <TileLayer
          className="map-tiles-dark"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedDistrictCenter && <MapController center={mapCenter} zoom={mapZoom} />}

        {highlightCoords && (
          <Circle
            center={highlightCoords}
            radius={700}
            pathOptions={{
              color: "#39FF14",
              fillColor: "#39FF14",
              fillOpacity: 0.15,
              weight: 2.5,
              dashArray: "6, 6",
            }}
          />
        )}

        {courtMarkers}
        {matchMarkers}
      </MapContainer>
    </div>
  );
}

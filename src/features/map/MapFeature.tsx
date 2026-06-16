// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { Venue, User } from "@/entities/types";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useThemeStore } from "@/features/theme/store";

// === BLOQUE: CACHÉ DE ICONOS LEAFLET ===
// Previene fugas de memoria y sobrecarga del GC al reutilizar iconos DivIcon.
const courtIconCache = new Map<string, L.DivIcon>();

// Crea un icono circular con emoji para canchas deportivas.
// Usa anillo dorado si es sponsored, o morado/azul para las regulares.
const createCourtIcon = (sport: string, isSponsored?: boolean) => {
  const cacheKey = `${sport}_${isSponsored}`;
  if (courtIconCache.has(cacheKey)) return courtIconCache.get(cacheKey)!;

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
    html: `<div style="position:relative;display:flex;width:40px;height:40px;align-items:center;justify-content:center;background:${bg};border:${border};border-radius:50%;box-shadow:${shadow};font-size:18px;">${emoji}${sponsorBadge}</div>`,
    className: `custom-court-marker-wrapper${isSponsored ? " animate-pulse" : ""}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
  courtIconCache.set(cacheKey, icon);
  return icon;
};

const businessIconCache = new Map<string, L.DivIcon>();

// Crea un icono circular para negocios (patrocinadores, academias, etc.).
const createBusinessIcon = (isSponsored?: boolean, category?: string) => {
  const key = `${isSponsored}_${category}`;
  if (businessIconCache.has(key)) return businessIconCache.get(key)!;

  let emoji = "🥤";
  if (category === "Canchas") emoji = "🏟️";
  else if (category === "Gym") emoji = "🏋️";
  else if (category === "Tienda") emoji = "🛍️";
  else if (category === "Academia") emoji = "🎓";
  else if (category === "Nutricionista") emoji = "🍎";
  else if (category === "Fisioterapia") emoji = "💆";
  else if (category === "Torneos") emoji = "🏆";
  else if (category === "Marcas") emoji = "🏷️";
  else if (category === "Patrocinador") emoji = "⭐";

  const border = isSponsored ? "2.5px solid #fbbf24" : "2px solid #ffffff";
  const shadow = isSponsored
    ? "0 0 15px rgba(251, 191, 36, 0.9)"
    : "0 0 10px rgba(16, 185, 129, 0.5)";
  const bg = isSponsored
    ? "linear-gradient(135deg, #f59e0b, #d97706)"
    : "linear-gradient(135deg, #10b981, #059669)";

  const icon = L.divIcon({
    html: `<div style="display:flex;width:36px;height:36px;align-items:center;justify-content:center;background:${bg};border:${border};border-radius:50%;box-shadow:${shadow};font-size:16px;">${emoji}</div>`,
    className: `custom-business-marker-wrapper ${isSponsored ? "animate-pulse" : ""}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
  businessIconCache.set(key, icon);
  return icon;
};

// === BLOQUE: CONTENIDO DEL POPUP DE CANCHA ===
interface PopupContentProps {
  readonly venue: Venue;
  readonly onBookCourt?: (venue: Venue) => void;
  readonly onViewCourt: (venueId: string) => void;
  readonly owner?: User;
  readonly onViewCommercialSheet?: (business: User) => void;
  readonly onOpenVenueActivity?: (venue: Venue) => void;
}

function PopupContent({
  venue,
  onBookCourt,
  onViewCourt,
  owner,
  onViewCommercialSheet,
  onOpenVenueActivity,
}: PopupContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Previene que Leaflet cierre el popup al interactuar con sus elementos internos.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);

    const handleNativeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest("[data-action]");
      if (!clickable) return;
      const action = (clickable as HTMLElement).dataset.action;
      if (action === "book") {
        e.preventDefault();
        e.stopPropagation();
        onBookCourt?.(venue);
      } else if (action === "view") {
        e.preventDefault();
        e.stopPropagation();
        onViewCourt(venue.id);
      } else if (action === "profile") {
        e.preventDefault();
        e.stopPropagation();
        if (owner) onViewCommercialSheet?.(owner);
      } else if (action === "activity") {
        e.preventDefault();
        e.stopPropagation();
        onOpenVenueActivity?.(venue);
      }
    };
    el.addEventListener("click", handleNativeClick);
    return () => {
      el.removeEventListener("click", handleNativeClick);
    };
  }, [venue, onBookCourt, onViewCourt, owner, onViewCommercialSheet, onOpenVenueActivity]);

  return (
    <div ref={containerRef} className="p-1 min-w-[200px] max-w-[240px] font-sans text-left">
      {venue.image_url && (
        <div className="h-24 w-full rounded-lg overflow-hidden mb-2 bg-muted border border-border/30">
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        </div>
      )}
      {venue.is_sponsored && (
        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5">
          ⭐ Sede Premium
        </span>
      )}
      <div className="font-extrabold text-sm text-foreground mb-0.5">{venue.name}</div>
      {venue.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1.5 leading-snug">
          {venue.description}
        </p>
      )}
      <div className="text-[11px] text-muted-foreground mb-2 leading-tight">
        📍 {venue.address || "Dirección no especificada"}
        {venue.district && ` · ${venue.district}`}
      </div>
      {venue.operating_hours && venue.operating_hours.length > 0 && (
        <div className="text-[10px] text-neon font-semibold mb-2 flex items-center gap-1">
          <span>🕒</span> Horario: {venue.operating_hours[0]}
        </div>
      )}

      {owner && (
        <div className="border-t border-border/40 pt-2 mt-2 mb-2">
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
            Administrado por:
          </div>
          <div className="flex items-center gap-2 mb-2.5">
            {owner.avatar_url && (
              <img
                src={owner.avatar_url}
                alt={owner.company_name || owner.name}
                className="h-6 w-6 rounded-full object-cover shrink-0 border border-border/40"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold truncate text-foreground">
                {owner.company_name || owner.name}
              </div>
              <div className="text-[9px] text-muted-foreground">{owner.business_category}</div>
            </div>
          </div>
          <button
            type="button"
            data-action="profile"
            className="w-full text-center py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-[10px] font-bold hover:scale-[1.02] transition-transform cursor-pointer border-0 mb-1.5 shadow-glow"
          >
            🏢 VER FICHA COMERCIAL
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          data-action="activity"
          className="flex-1 text-center py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-[10px] font-bold cursor-pointer border-0"
        >
          ACTIVIDAD
        </button>
        {owner?.whatsapp && (
          <a
            href={`https://wa.me/${owner.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-center py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all decoration-none"
            style={{ textDecoration: "none" }}
          >
            💬 WhatsApp
          </a>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-center py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-[10px] font-bold transition-all decoration-none"
          style={{ textDecoration: "none" }}
        >
          📍 Cómo llegar
        </a>
      </div>
    </div>
  );
}

// === BLOQUE: POPUP DE NEGOCIO EN EL MAPA ===
interface BusinessPopupProps {
  readonly player: User;
  readonly onViewCommercialSheet?: (business: User) => void;
}

function BusinessPopup({ player, onViewCommercialSheet }: BusinessPopupProps) {
  const isBusiness = player.user_role === "BUSINESS";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
    const handleNativeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("button");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "profile") {
        e.preventDefault();
        e.stopPropagation();
        onViewCommercialSheet?.(player);
      }
    };
    el.addEventListener("click", handleNativeClick);
    return () => el.removeEventListener("click", handleNativeClick);
  }, [player, onViewCommercialSheet]);

  return (
    <div ref={containerRef} className="p-1 font-sans min-w-[150px] text-left">
      {isBusiness && player.is_sponsored && (
        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5 animate-pulse">
          ⭐ Sponsor Premium
        </span>
      )}
      <div className="font-bold text-sm text-foreground">{player.company_name || player.name}</div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {isBusiness ? `${player.business_category} · ` : ""}
        {player.distance_km !== undefined ? `${player.distance_km.toFixed(1)} km` : "Cerca de ti"}
      </div>
      {isBusiness && (
        <div className="flex flex-col gap-1.5 mt-3">
          <button
            type="button"
            data-action="profile"
            className="block w-full text-center px-2 py-1.5 rounded-xl bg-gradient-primary text-primary-foreground text-[10px] font-bold hover:scale-[1.02] transition-transform cursor-pointer border-0"
          >
            Ver Ficha Comercial
          </button>
        </div>
      )}
    </div>
  );
}

// === BLOQUE: CONTROLADOR DE MOVIMIENTO DEL MAPA ===
// Vuela el mapa a una posición y zoom específicos con animación suave.
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { animate: true, duration: 1.5 });
  }, [map, center, zoom]);
  return null;
}

// === BLOQUE: COMPONENTE PRINCIPAL DEL MAPA ===
// Mapa Leaflet con marcadores de canchas (venues) y negocios (players).
// Incluye círculo de resaltado temporal al seleccionar un distrito.
interface MapFeatureProps {
  readonly venues: Venue[];
  readonly players: User[];
  readonly onBookCourt?: (venue: Venue) => void;
  readonly selectedDistrictCenter?: [number, number] | null;
  readonly onViewCommercialSheet?: (business: User) => void;
  readonly onOpenVenueActivity?: (venue: Venue) => void;
}

export function MapFeature({
  venues,
  players,
  onBookCourt,
  selectedDistrictCenter,
  onViewCommercialSheet,
  onOpenVenueActivity,
}: MapFeatureProps) {
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);
  const [highlightCoords, setHighlightCoords] = useState<[number, number] | null>(null);

  const getThemePrimaryColor = () => {
    if (theme === "world-cup") return "#D4AF37";
    if (theme === "dark-footballer") return "#39FF14";
    return "#ff5722"; // light/default
  };
  const primaryColor = getThemePrimaryColor();

  // Hidratación del lado del cliente (evita errores SSR con Leaflet).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Resalta temporalmente el distrito seleccionado con un círculo animado (3s).
  useEffect(() => {
    if (selectedDistrictCenter) {
      setHighlightCoords(selectedDistrictCenter);
      const timer = setTimeout(() => setHighlightCoords(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedDistrictCenter]);

  const onViewCourt = useCallback(
    (courtId: string) => {
      navigate({ to: "/app/courts/$courtId", params: { courtId } });
    },
    [navigate],
  );

  // Marcadores de canchas (venues), con popup que muestra info y acciones.
  const venueMarkers = useMemo(() => {
    return venues.map((c) => {
      const owner = players.find((p) => p.id === c.owner_id);
      return (
        <Marker
          key={`${c.id}-${c.name}-${c.district}`}
          position={[c.lat, c.lng]}
          icon={createCourtIcon(c.sport, c.is_sponsored)}
        >
          <Popup>
            <PopupContent
              venue={c}
              onBookCourt={onBookCourt}
              onViewCourt={onViewCourt}
              owner={owner}
              onViewCommercialSheet={onViewCommercialSheet}
              onOpenVenueActivity={onOpenVenueActivity}
            />
          </Popup>
        </Marker>
      );
    });
  }, [venues, players, onBookCourt, onViewCourt, onViewCommercialSheet, onOpenVenueActivity]);

  // Marcadores de negocios (players con rol BUSINESS).
  const matchMarkers = useMemo(() => {
    return players.map((m) => {
      if (!m.last_location_lat || !m.last_location_lng) return null;
      const isBusiness = m.user_role === "BUSINESS";
      if (!isBusiness) return null;
      const icon = createBusinessIcon(m.is_sponsored, m.business_category);
      return (
        <Marker key={m.id} position={[m.last_location_lat, m.last_location_lng]} icon={icon}>
          <Popup>
            <BusinessPopup player={m} onViewCommercialSheet={onViewCommercialSheet} />
          </Popup>
        </Marker>
      );
    });
  }, [players, onViewCommercialSheet]);

  if (!mounted || typeof globalThis.window === "undefined") {
    return <div className="h-[600px] min-h-[500px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

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
              color: primaryColor,
              fillColor: primaryColor,
              fillOpacity: 0.15,
              weight: 2.5,
              dashArray: "6, 6",
            }}
          />
        )}
        {matchMarkers}
        {venueMarkers}
      </MapContainer>
    </div>
  );
}

import { Star, MapPin } from "lucide-react";
import { Court } from "@/entities/types";
import { calculateDistance } from "@/shared/api/geoService";
import { getSportFallbackImage } from "@/shared/lib/imageUtils";
import { FavoriteButton } from "@/features/courts/ui/FavoriteButton";

interface CourtCardProps {
  court: Court;
  isSelected?: boolean;
  onClick?: () => void;
  baseLocation: { lat: number; lng: number } | null;
  variant?: "grid" | "list";
}

export function CourtCard({
  court,
  isSelected,
  onClick,
  baseLocation,
  variant = "grid",
}: CourtCardProps) {
  const distance = baseLocation
    ? calculateDistance(baseLocation.lat, baseLocation.lng, court.lat, court.lng)
    : (court.distance_km ?? 0);

  if (variant === "list") {
    return (
      <div
        onClick={onClick}
        className={`flex gap-3 items-center p-2 rounded-2xl hover:bg-accent/40 cursor-pointer transition-colors ${
          isSelected ? "bg-accent/60 ring-1 ring-primary" : "bg-card border border-border/50"
        }`}
      >
        <img
          src={court.image_url || getSportFallbackImage(court.sport)}
          alt={court.name}
          onError={(e) => {
            e.currentTarget.src = getSportFallbackImage(court.sport);
          }}
          className="h-14 w-14 rounded-xl object-cover bg-muted border border-border/50"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate text-foreground">{court.name}</div>
          <div className="text-xs text-muted-foreground">
            {court.sport} · S/ {court.price_per_hour}/h
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2.5 mt-0.5">
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3 text-neon" />
              {distance.toFixed(1)} km
            </span>
            <span className="flex items-center gap-0.5 text-warning font-semibold">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {court.rating}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl overflow-hidden border transition-all cursor-pointer bg-card ${
        isSelected ? "border-primary ring-glow scale-[1.01]" : "border-border hover:border-accent"
      }`}
    >
      <div className="relative h-40">
        <img
          src={court.image_url || getSportFallbackImage(court.sport)}
          alt={court.name}
          onError={(e) => {
            e.currentTarget.src = getSportFallbackImage(court.sport);
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <FavoriteButton courtId={court.id} size="sm" />
          
          {court.is_available ? (
            <span className="px-2 py-1 rounded-full bg-neon/90 text-neon-foreground text-xs font-semibold">
              Disponible
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full bg-destructive/90 text-destructive-foreground text-xs">
              Ocupado
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="font-semibold text-white truncate drop-shadow-md">{court.name}</div>
          <div className="text-xs text-white/80 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {distance.toFixed(1)} km
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {court.rating}
            </span>
            <span>· S/ {court.price_per_hour}/h</span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex flex-wrap gap-1">
          {court.amenities?.map((a) => (
            <span
              key={a}
              className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground"
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

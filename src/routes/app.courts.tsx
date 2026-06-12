// === BLOQUE: Ruta de Reserva de Canchas ===
// Catálogo de canchas deportivas con filtros (distrito, deporte, búsqueda),
// ordenamiento por distancia o rating, y modal de booking.
// NOTA: Actualmente redirige a /app porque la funcionalidad se integró
// en el dashboard principal (app.index.tsx).
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { Court } from "@/entities/types";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { calculateDistance } from "@/shared/api/geoService";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/app/courts")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Reservas — SportMatch" }] }),
  // === BLOQUE: Loader de canchas ===
  // Intenta backendApi primero, con fallback a apiClient.
  loader: async () => {
    const backendCourts = await backendApi.courts.getAll().catch(() => null);
    if (
      backendCourts &&
      typeof backendCourts === "object" &&
      "data" in backendCourts &&
      Array.isArray((backendCourts as { data: Court[] }).data)
    ) {
      return (backendCourts as { data: Court[] }).data;
    }
    return await apiClient.courts.getAll();
  },
  component: Courts,
});

function Courts() {
  const courts = Route.useLoaderData() as Court[];
  const user = useAuthStore((s) => s.user);
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // === BLOQUE: Estado de filtros y paginación ===
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);

  // === BLOQUE: Geolocalización ===
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation API unavailable or permission denied.", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    }
  }, []);

  // === BLOQUE: Ubicación base para ordenar por distancia ===
  const baseLocation = useMemo(() => {
    if (userCoords) return userCoords;
    if (user && user.last_location_lat && user.last_location_lng) {
      return { lat: user.last_location_lat, lng: user.last_location_lng };
    }
    return null;
  }, [userCoords, user]);

  // === BLOQUE: Distritos disponibles (dinámicos desde datos) ===
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    courts.forEach((c) => {
      if (c.district) set.add(c.district);
    });
    return Array.from(set).sort();
  }, [courts]);

  // === BLOQUE: Deportes disponibles (dinámicos desde datos) ===
  const availableSports = useMemo(() => {
    const set = new Set<string>();
    courts.forEach((c) => {
      if (c.sport) set.add(c.sport);
    });
    return Array.from(set).sort();
  }, [courts]);

  // === BLOQUE: Reset de paginación al cambiar filtros ===
  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm, selectedDistrict, selectedSport]);

  // === BLOQUE: Filtrado y ordenamiento de canchas ===
  // Aplica filtros secuencialmente: distrito, deporte, búsqueda
  // y finalmente ordena por distancia o rating.
  const filteredAndSortedCourts = useMemo(() => {
    let result = [...courts];

    if (selectedDistrict) {
      result = result.filter((c) => c.district === selectedDistrict);
    }
    if (selectedSport) {
      result = result.filter((c) => c.sport === selectedSport);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.address && c.address.toLowerCase().includes(term)),
      );
    }
    if (baseLocation) {
      result = result
        .map((c) => ({
          ...c,
          distance_km: calculateDistance(baseLocation.lat, baseLocation.lng, c.lat, c.lng),
        }))
        .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    } else {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [courts, selectedDistrict, selectedSport, searchTerm, baseLocation]);

  const displayedCourts = useMemo(() => {
    return filteredAndSortedCourts.slice(0, visibleCount);
  }, [filteredAndSortedCourts, visibleCount]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title="Reservar cancha"
        subtitle="Disponibilidad en tiempo real para todas las disciplinas en Lima"
      />

      {/* === BLOQUE: Contenedor de filtros === */}
      <div className="bg-card/20 border border-border/40 rounded-3xl p-5 mb-8 backdrop-blur-md shadow-card">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>Filtros de búsqueda</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda por nombre o dirección */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por complejo o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-accent/30 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60 transition-all"
            />
          </div>

          {/* Filtro por distrito */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground transition-all cursor-pointer"
          >
            <option value="">Todos los distritos ({availableDistricts.length})</option>
            {availableDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Filtro por deporte */}
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground transition-all cursor-pointer"
          >
            <option value="">Todos los deportes ({availableSports.length})</option>
            {availableSports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* === BLOQUE: Resultados === */}
      <div className="flex items-center justify-between mb-6 text-xs text-muted-foreground font-semibold">
        <span>
          Mostrando {displayedCourts.length} de {filteredAndSortedCourts.length} complejos
          deportivos
        </span>
        {baseLocation && (
          <span className="flex items-center gap-1 text-neon">
            <MapPin className="h-3.5 w-3.5" /> Ordenado por cercanía
          </span>
        )}
      </div>

      {displayedCourts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" id="courts-grid">
          {displayedCourts.map((c) => (
            <CourtCard
              key={`${c.id}-${c.name}-${c.district}`}
              court={c}
              onClick={() => setSelectedCourtForBooking(c)}
              baseLocation={baseLocation}
              variant="grid"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-dashed border-border/60 bg-card/10 text-muted-foreground max-w-lg mx-auto">
          <p className="text-base font-semibold mb-1">No se encontraron canchas</p>
          <p className="text-xs">Prueba cambiando tus filtros de búsqueda o distrito.</p>
        </div>
      )}

      {/* === BLOQUE: Botón "Ver más" (paginación) === */}
      {filteredAndSortedCourts.length > visibleCount && (
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-glow cursor-pointer"
          >
            Ver más complejos
          </button>
        </div>
      )}

      {/* === BLOQUE: Modal de booking === */}
      <BookingModal
        court={selectedCourtForBooking}
        isOpen={selectedCourtForBooking !== null}
        onOpenChange={(open) => !open && setSelectedCourtForBooking(null)}
        baseLocation={baseLocation}
      />
    </div>
  );
}

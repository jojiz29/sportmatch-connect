import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { MapFeature } from "@/features/map/MapFeature";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { calculateDistance } from "@/shared/api/geoService";
import { Match, Squad, User, Venue } from "@/entities/types";
import { CommercialSheetModal } from "@/features/business/ui/CommercialSheetModal";
import { useTranslation } from "react-i18next";
import { MapPin, MessageSquare, Shield, Swords, UserPlus, Users, X } from "lucide-react";
import { rankMatchCandidates } from "@/features/matchmaking/matchmakingScore";
import { getMutualPlayerConnections } from "@/shared/api/connectionService";
import { getSquads } from "@/shared/api/squadService";
import { useChatStore } from "@/features/chat/useChatStore";
import {
  createVenueActivity,
  getVenueActivities,
  joinVenueActivity,
  VenueActivity,
} from "@/shared/api/venueActivityService";
import { toast } from "sonner";

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
      const [matches, businesses, venues, players, squads] = await Promise.all([
        apiClient.matches.getAll().catch(() => []),
        apiClient.users.getBusinesses().catch(() => []),
        apiClient.venues.getAll().catch(() => []),
        apiClient.users.getMatches().catch(() => []),
        getSquads().catch(() => []),
      ]);
      return { matches, businesses, venues, players, squads };
    }

    const [backendMatches] = await Promise.all([backendApi.matches.getAll().catch(() => null)]);

    const [matches, businesses, venues, players, squads] = await Promise.all([
      backendMatches && backendMatches.data
        ? Promise.resolve(backendMatches.data as Match[])
        : apiClient.matches.getAll().catch(() => []),
      apiClient.users.getBusinesses().catch(() => []),
      apiClient.venues.getAll().catch(() => []),
      apiClient.users.getMatches().catch(() => []),
      getSquads().catch(() => []),
    ]);
    return { matches, businesses, venues, players, squads };
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

function hasValidLimaCoordinates(venue: Venue): boolean {
  // Para el MVP aceptamos únicamente sedes registradas con coordenadas numéricas
  // dentro del área metropolitana de Lima; así evitamos pines en 0,0 o países ajenos.
  return (
    Number.isFinite(venue.lat) &&
    Number.isFinite(venue.lng) &&
    venue.lat >= -12.6 &&
    venue.lat <= -11.5 &&
    venue.lng >= -77.4 &&
    venue.lng <= -76.5
  );
}

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

function VenueActivityPanel({
  venue,
  currentUser,
  players,
  squads,
  activities,
  connectionIds,
  onClose,
  onActivityCreated,
  onActivityJoined,
}: {
  venue: Venue;
  currentUser: User;
  players: User[];
  squads: Squad[];
  activities: VenueActivity[];
  connectionIds: string[];
  onClose: () => void;
  onActivityCreated: (activity: VenueActivity) => void;
  onActivityJoined: (activityId: string) => Promise<void>;
}) {
  const createChat = useChatStore((state) => state.createChat);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const [selectedSquadId, setSelectedSquadId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);
  const [requiredPlayers, setRequiredPlayers] = useState(Math.max(2, venue.max_players || 2));

  const compatiblePlayers = useMemo(
    () =>
      rankMatchCandidates(currentUser, players, {
        activeSport: venue.sport,
        currentLocation: { lat: venue.lat, lng: venue.lng },
      }).slice(0, 5),
    [currentUser, players, venue],
  );
  const ownSquads = squads.filter((squad) => squad.creator_id === currentUser.id);

  const invitePlayer = async (player: User) => {
    const chatId = await createChat(player.id);
    if (!chatId) return;
    await sendMessage(chatId, `¿Jugamos ${venue.sport} en ${venue.name}?`, undefined, {
      type: "venue_invite",
      venue_id: venue.id,
      venue_name: venue.name,
      venue_address: venue.address,
      venue_lat: venue.lat,
      venue_lng: venue.lng,
    });
    setActiveConversation(chatId);
    toast.success(`Invitación enviada a ${player.name}`);
  };

  const publishActivity = async (activityType: "PLAYER_CHALLENGE" | "TEAM_CHALLENGE") => {
    if (activityType === "TEAM_CHALLENGE" && !selectedSquadId) {
      toast.error("Selecciona el equipo que busca rival");
      return;
    }
    setIsSaving(true);
    try {
      const activity = await createVenueActivity({
        venueId: venue.id,
        creatorId: currentUser.id,
        sport: venue.sport,
        activityType,
        squadId: activityType === "TEAM_CHALLENGE" ? selectedSquadId : undefined,
        // Un duelo por equipos requiere dos equipos; una búsqueda individual usa el aforo elegido.
        requiredPlayers: activityType === "TEAM_CHALLENGE" ? 2 : requiredPlayers,
      });
      onActivityCreated(activity);
      toast.success(
        activityType === "TEAM_CHALLENGE"
          ? "Tu equipo ahora busca rival en esta sede"
          : "Búsqueda de jugador publicada",
      );
    } catch (error) {
      console.error("Error al publicar actividad de sede:", error);
      toast.error("No se pudo publicar la actividad");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm">
      <button
        aria-label="Cerrar actividad de sede"
        className="flex-1 cursor-default"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              Lobby deportivo
            </div>
            <h2 className="mt-1 text-2xl font-bold">{venue.name}</h2>
            <div className="mt-1 text-sm text-muted-foreground">
              {venue.sport} · {venue.address || venue.district}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-muted grid place-items-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left">
            <UserPlus className="h-5 w-5 text-primary" />
            <div className="mt-2 text-sm font-bold">Buscar jugador</div>
            <div className="text-xs text-muted-foreground">Publica que deseas jugar aquí.</div>
            <label className="mt-3 block text-xs text-muted-foreground">
              Jugadores para comenzar
              <input
                type="number"
                min={2}
                max={Math.max(2, venue.max_players || 22)}
                value={requiredPlayers}
                onChange={(event) => setRequiredPlayers(Math.max(2, Number(event.target.value)))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5"
              />
            </label>
            <button
              disabled={isSaving}
              onClick={() => publishActivity("PLAYER_CHALLENGE")}
              className="mt-2 w-full rounded-lg bg-gradient-primary px-2 py-1.5 text-xs font-bold text-primary-foreground cursor-pointer disabled:opacity-50"
            >
              Publicar búsqueda
            </button>
          </div>
          <div className="rounded-2xl border border-electric/30 bg-electric/10 p-4">
            <Shield className="h-5 w-5 text-electric" />
            <div className="mt-2 text-sm font-bold">Buscar equipo rival</div>
            <select
              value={selectedSquadId}
              onChange={(event) => setSelectedSquadId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
            >
              <option value="">Selecciona equipo</option>
              {ownSquads.map((squad) => (
                <option key={squad.id} value={squad.id}>
                  {squad.name}
                </option>
              ))}
            </select>
            <button
              disabled={isSaving || ownSquads.length === 0}
              onClick={() => publishActivity("TEAM_CHALLENGE")}
              className="mt-2 w-full rounded-lg bg-electric px-2 py-1.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
            >
              Publicar búsqueda
            </button>
          </div>
        </div>

        <section className="mt-7">
          <h3 className="flex items-center gap-2 font-bold">
            <Swords className="h-4 w-4 text-primary" />
            Actividad abierta ({activities.length})
          </h3>
          <div className="mt-3 space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl border border-border bg-background/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center">
                    {activity.activity_type === "TEAM_CHALLENGE" ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <Swords className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">
                      {activity.activity_type === "TEAM_CHALLENGE"
                        ? "Equipo buscando rival"
                        : "Jugador buscando compañero"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.sport} · {activity.participant_ids.length + 1}/
                      {activity.required_players}{" "}
                      {activity.activity_type === "TEAM_CHALLENGE" ? "equipos" : "jugadores"}
                    </div>
                  </div>
                  {activity.status === "matched" ? (
                    <span className="rounded-lg bg-neon/15 px-3 py-2 text-xs font-bold text-neon">
                      Listo para iniciar
                    </span>
                  ) : (
                    activity.creator_id !== currentUser.id && (
                      <button
                        disabled={joiningActivityId === activity.id}
                        onClick={async () => {
                          setJoiningActivityId(activity.id);
                          try {
                            await onActivityJoined(activity.id);
                          } finally {
                            setJoiningActivityId(null);
                          }
                        }}
                        className="rounded-lg bg-gradient-primary px-3 py-2 text-xs font-bold text-primary-foreground cursor-pointer disabled:opacity-50"
                      >
                        {joiningActivityId === activity.id ? "Uniendo..." : "Unirme"}
                      </button>
                    )
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((activity.participant_ids.length + 1) / activity.required_players) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                Todavía no hay búsquedas abiertas en esta sede.
              </div>
            )}
          </div>
        </section>

        <section className="mt-7">
          <h3 className="flex items-center gap-2 font-bold">
            <Users className="h-4 w-4 text-neon" />
            Jugadores compatibles cerca
          </h3>
          <div className="mt-3 space-y-2">
            {compatiblePlayers.map((recommendation) => (
              <div
                key={recommendation.user.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <img
                  src={recommendation.user.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover bg-muted"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{recommendation.user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {recommendation.score}% compatible ·{" "}
                    {recommendation.distanceKm?.toFixed(1) || "?"} km
                  </div>
                </div>
                <button
                  onClick={() => invitePlayer(recommendation.user)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 text-xs text-muted-foreground">
          {connectionIds.length} de tus conexiones están disponibles para invitaciones directas.
        </div>
      </aside>
    </div>
  );
}

function MapPage() {
  const { t } = useTranslation();
  const data = Route.useLoaderData();
  const user = useAuthStore((state) => state.user);
  const [selectedBusinessForSheet, setSelectedBusinessForSheet] = useState<User | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venueActivities, setVenueActivities] = useState<VenueActivity[]>([]);
  const [connectionIds, setConnectionIds] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    getMutualPlayerConnections(user.id)
      .then((connections) =>
        setConnectionIds(connections.map((connection) => connection.connected_user_id)),
      )
      .catch((error) => console.error("Error al cargar conexiones para el mapa:", error));
  }, [user]);

  useEffect(() => {
    getVenueActivities((data.venues || []).map((venue) => venue.id))
      .then(setVenueActivities)
      .catch((error) => console.error("Error al cargar actividad de sedes:", error));
  }, [data.venues]);

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
    const businessOwnerIds = new Set(
      (data.businesses || [])
        .filter((business) => business.user_role === "BUSINESS")
        .map((business) => business.id),
    );
    // El mapa comercial solo muestra sedes creadas y administradas por una cuenta empresa.
    const list = (data.venues || []).filter(
      (venue) =>
        Boolean(venue.owner_id) &&
        businessOwnerIds.has(venue.owner_id as string) &&
        hasValidLimaCoordinates(venue),
    );
    if (!selectedDistrict) return list;
    return list.filter((c) =>
      (c.district || "").toLowerCase().includes(selectedDistrict.toLowerCase()),
    );
  }, [data.businesses, data.venues, selectedDistrict]);

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
              onOpenVenueActivity={setSelectedVenue}
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

      {selectedVenue && user && (
        <VenueActivityPanel
          venue={selectedVenue}
          currentUser={user}
          players={(data.players || []).filter((player) => player.user_role !== "BUSINESS")}
          squads={data.squads || []}
          activities={venueActivities.filter((activity) => activity.venue_id === selectedVenue.id)}
          connectionIds={connectionIds}
          onClose={() => setSelectedVenue(null)}
          onActivityCreated={(activity) => setVenueActivities((current) => [activity, ...current])}
          onActivityJoined={async (activityId) => {
            try {
              console.info("[venue-activity] ui:join-click", { activityId, userId: user.id });
              const joinedActivity = await joinVenueActivity(activityId, user.id);
              setVenueActivities((current) =>
                current.map((activity) =>
                  activity.id === joinedActivity.id ? joinedActivity : activity,
                ),
              );
              const occupied = joinedActivity.participant_ids.length + 1;
              toast.success(
                joinedActivity.status === "matched"
                  ? "Te uniste. Ya alcanzaron los cupos para iniciar."
                  : `Te uniste correctamente. Faltan ${joinedActivity.required_players - occupied} cupos.`,
              );
            } catch (error) {
              console.error("Error al unirse a actividad de sede:", error);
              toast.error(error instanceof Error ? error.message : "No se pudo completar la unión");
            }
          }}
        />
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/shared/api/apiClient";
import { Match, User, Court, SportCatalog, Level } from "@/entities/types";
import {
  Trophy,
  Flame,
  MapPin,
  Users,
  ArrowRight,
  Calendar,
  Star,
  Sparkles,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/entities/user/useAuth";
import { toast } from "sonner";
import { NewsFeed } from "@/features/feed/ui/NewsFeed";
import { SquadExplorer } from "@/features/squads/ui/SquadExplorer";
import { supabase } from "@/shared/api/supabase";
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";
import { calculateDistance } from "@/shared/api/geoService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Inicio — SportMatch" }] }),
  loader: async () => {
    const [matches, users, courts, sports] = await Promise.all([
      apiClient.matches.getAll(),
      apiClient.users.getMatches(),
      apiClient.courts.getAll(),
      apiClient.sports.getAll(),
    ]);
    return { matches, users, courts, sports };
  },
  component: Dashboard,
});

function getSportEmoji(name: string) {
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
}

function Dashboard() {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"matches" | "feed" | "squads">("matches");
  const user = useAuthStore((state) => state.user);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

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
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    }
  }, []);

  const baseLocation = useMemo(() => {
    if (userCoords) return userCoords;
    if (user && user.last_location_lat && user.last_location_lng) {
      return { lat: user.last_location_lat, lng: user.last_location_lng };
    }
    return null;
  }, [userCoords, user]);
  const { matches, users, courts, sports } = Route.useLoaderData() as {
    matches: Match[];
    users: User[];
    courts: Court[];
    sports: SportCatalog[];
  };

  const filteredMatches = selectedSport
    ? matches.filter((m) => m.sport === selectedSport)
    : matches;

  const SPORTS =
    sports.length > 0
      ? sports.map((s) => ({ name: s.name, emoji: getSportEmoji(s.name) }))
      : [
          { name: "Pádel", emoji: "🏓" },
          { name: "Fútbol", emoji: "⚽" },
          { name: "Tenis", emoji: "🎾" },
          { name: "Running", emoji: "🏃" },
        ];

  // Match creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [matchTitle, setMatchTitle] = useState("");
  const [matchSport, setMatchSport] = useState("");
  const [matchCourtId, setMatchCourtId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchMaxPlayers, setMatchMaxPlayers] = useState<number>(4);
  const [matchLevel, setMatchLevel] = useState<Level>("Intermedio");
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para crear un partido.");
      return;
    }
    if (!matchTitle || !matchSport || !matchDate || !matchTime || !matchMaxPlayers || !matchLevel) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      setIsCreatingMatch(true);
      const newMatch = await apiClient.matches.create({
        title: matchTitle,
        sport: matchSport,
        court_id: matchCourtId || null,
        date: matchDate,
        time: matchTime,
        max_players: Number(matchMaxPlayers),
        required_level: matchLevel,
        creator_id: user.id,
      });

      if (!useAuthStore.getState().isDemoMode) {
        // Automatically join the creator to match_participants
        const { error: partError } = await supabase.from("match_participants").insert({
          match_id: newMatch.id,
          user_id: user.id,
          status: "ACCEPTED",
        });

        if (partError) {
          console.error("Error joining creator to match:", partError);
        }
      }

      toast.success("¡Partido creado con éxito!");
      setIsCreateModalOpen(false);

      // Clear form
      setMatchTitle("");
      setMatchSport("");
      setMatchCourtId("");
      setMatchDate("");
      setMatchTime("");
      setMatchMaxPlayers(4);
      setMatchLevel("Intermedio");

      window.location.reload();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Error al crear el partido: " + msg);
    } finally {
      setIsCreatingMatch(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-card border border-border p-6 md:p-8 shadow-card relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative">
          <div>
            <div className="text-sm text-muted-foreground">Hola,</div>
            <h1 className="text-3xl md:text-4xl font-bold">{user.name.split(" ")[0]} 👋</h1>
            <p className="text-muted-foreground mt-1">
              Tenés {matches.length} partidos compatibles cerca tuyo hoy.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/app/match"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow"
              >
                <Sparkles className="h-4 w-4" /> Encontrar partido
              </Link>
              <Link
                to="/app/courts"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass"
              >
                <Calendar className="h-4 w-4" /> Reservar cancha
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[280px]">
            <Stat
              icon={<Trophy className="h-4 w-4 text-neon" />}
              label="FitCoins"
              value={user.fitcoins_balance}
            />
            <Stat
              icon={<Flame className="h-4 w-4 text-warning" />}
              label="Trust"
              value={`${user.trust_score}%`}
            />
            <Stat
              icon={<Users className="h-4 w-4 text-electric" />}
              label="Partidos"
              value={user.matches_played}
            />
          </div>
        </div>
      </div>

      {/* Sport chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4">
        {SPORTS.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelectedSport(selectedSport === s.name ? null : s.name)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-all ${
              selectedSport === s.name
                ? "bg-gradient-neon text-neon-foreground shadow-neon font-semibold"
                : "glass hover:bg-accent"
            }`}
          >
            <span>{s.emoji}</span> {s.name}
          </button>
        ))}
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-4 border-b border-border/50 pb-2 mb-6">
        <button
          onClick={() => setActiveTab("matches")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === "matches"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="dashboard-tab-matches"
        >
          Partidos
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === "feed"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="dashboard-tab-feed"
        >
          Comunidad (Feed)
        </button>
        <button
          onClick={() => setActiveTab("squads")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === "squads"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="dashboard-tab-squads"
        >
          Squads (Clubes)
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "matches" && (
            <>
              <PageHeader
                title="Partidos recomendados"
                subtitle="Curado por IA según tu nivel y horarios"
                action={
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-xs shadow-glow"
                  >
                    <Plus className="h-3.5 w-3.5" /> Crear Partido
                  </button>
                }
              />
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((m) => <MatchCard key={m.id} match={m} />)
                ) : (
                  <div className="col-span-2 p-8 text-center text-muted-foreground glass rounded-2xl border border-border">
                    No hay partidos recomendados para este deporte.
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "feed" && (
            <>
              <PageHeader
                title="Feed de Noticias"
                subtitle="Novedades de los jugadores que sigues"
              />
              <NewsFeed />
            </>
          )}

          {activeTab === "squads" && (
            <>
              <PageHeader title="Squads y Clubes" subtitle="Comunidades y equipos de tu zona" />
              <SquadExplorer />
            </>
          )}
        </div>

        {/* Side */}
        <div className="space-y-6">
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Jugadores cerca</h3>
              <Link to="/app/match" className="text-xs text-neon flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {users.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.preferred_sports[0]} ·{" "}
                      {baseLocation && p.last_location_lat && p.last_location_lng
                        ? `${calculateDistance(baseLocation.lat, baseLocation.lng, p.last_location_lat, p.last_location_lng).toFixed(1)} km`
                        : `${p.distance_km || 0} km`}
                    </div>
                  </div>
                  <span className="text-xs text-neon flex items-center gap-1">
                    <Star className="h-3 w-3 fill-neon" /> {p.trust_score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-4">Canchas top</h3>
            <div className="space-y-3">
              {courts.slice(0, 3).map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.sport} · ${c.price_per_hour}/h
                    </div>
                    <div className="text-xs text-warning flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-warning" /> {c.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog for Match Creation */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-background border border-border rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Crear nuevo partido</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Completa los detalles para invitar a otros jugadores.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMatch} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Título del partido
              </label>
              <input
                type="text"
                required
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                placeholder="Ej. Dobles de Pádel"
                className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Deporte
                </label>
                <select
                  required
                  value={matchSport}
                  onChange={(e) => {
                    setMatchSport(e.target.value);
                    setMatchCourtId("");
                  }}
                  className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="">Selecciona...</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nivel requerido
                </label>
                <select
                  required
                  value={matchLevel}
                  onChange={(e) => setMatchLevel(e.target.value as Level)}
                  className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Cancha (Opcional)
              </label>
              <select
                value={matchCourtId}
                onChange={(e) => setMatchCourtId(e.target.value)}
                className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="">Ninguna (Sin Cancha Reservada)</option>
                {courts
                  .filter((c) => !matchSport || c.sport === matchSport)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (${c.price_per_hour}/h)
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Máx. Jugadores
              </label>
              <input
                type="number"
                required
                min="1"
                value={matchMaxPlayers}
                onChange={(e) => setMatchMaxPlayers(Number(e.target.value))}
                className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingMatch}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-50 transition-all"
            >
              {isCreatingMatch ? "Creando..." : "Crear Partido"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const user = useAuthStore((state) => state.user);
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const currentParticipants = match.current_players?.length || 0;
  const spotsTaken = joined ? currentParticipants + 1 : currentParticipants;
  const isFull = spotsTaken >= match.max_players;

  const courtFee = match.court
    ? Math.ceil(match.court.price_per_hour / (match.max_players || 4))
    : 0;

  const handleJoin = () => {
    if (user && courtFee > user.fitcoins_balance) {
      setIsBalanceModalOpen(true);
      return;
    }
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      setJoined(true);
      toast.success("¡Te uniste al partido!", {
        description: "Revisa tu calendario para más detalles.",
      });
    }, 600);
  };

  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card hover:ring-glow transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-violet/20 text-violet-foreground border border-violet/30">
          {match.sport}
        </span>
        <span className="text-xs text-neon">{new Date(match.date).toLocaleDateString()}</span>
      </div>
      <h3 className="font-semibold">{match.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
        <MapPin className="h-3 w-3" /> {match.court?.name}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Cupos</div>
          <div className="text-sm font-semibold">
            {spotsTaken}/{match.max_players}
          </div>
        </div>
        <button
          onClick={handleJoin}
          disabled={joined || isFull || isJoining}
          className="px-3 py-1.5 rounded-lg bg-gradient-neon text-neon-foreground text-sm font-semibold disabled:opacity-50 transition-all active:scale-95"
        >
          {isJoining ? "..." : joined ? "Unido" : isFull ? "Lleno" : "Unirme"}
        </button>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${(spotsTaken / match.max_players) * 100}%` }}
        />
      </div>

      <InsufficientBalanceModal
        isOpen={isBalanceModalOpen}
        onOpenChange={setIsBalanceModalOpen}
        cost={courtFee}
        balance={user?.fitcoins_balance ?? 0}
      />
    </div>
  );
}

import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/entities/user/useAuth";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { withTimeout } from "@/shared/api/timeoutHelper";
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";
import { calculateDistance } from "@/shared/api/geoService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useChatStore } from "@/features/chat/useChatStore";
import { useTranslation } from "react-i18next";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";

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
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const [streak, setStreak] = useState<{ current_streak: number; max_streak: number } | null>(null);
  const [attendanceDays, setAttendanceDays] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    if (useAuthStore.getState().isDemoMode) {
      const storedStreak = localStorage.getItem(`sportmatch_demo_streak_${user.id}`);
      if (storedStreak) {
        setStreak(JSON.parse(storedStreak));
      } else {
        const defaultStreak = { current_streak: 3, max_streak: 5 };
        setStreak(defaultStreak);
        localStorage.setItem(`sportmatch_demo_streak_${user.id}`, JSON.stringify(defaultStreak));
      }

      const storedAttendance = localStorage.getItem(`sportmatch_demo_attendance_${user.id}`);
      if (storedAttendance) {
        setAttendanceDays(JSON.parse(storedAttendance));
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        const dayMinus3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const dayMinus7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const mockAttendance = [todayStr, dayMinus3, dayMinus7];
        setAttendanceDays(mockAttendance);
        localStorage.setItem(
          `sportmatch_demo_attendance_${user.id}`,
          JSON.stringify(mockAttendance),
        );
      }
    } else {
      const fetchStats = async () => {
        try {
          const { data: stats } = await supabase
            .from("user_stats")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (stats) {
            setStreak({ current_streak: stats.current_streak, max_streak: stats.max_streak });
          } else {
            setStreak({ current_streak: 0, max_streak: 0 });
          }

          const { data: participants } = await supabase
            .from("match_participants")
            .select("joined_at, matches(date)")
            .eq("user_id", user.id)
            .eq("status", "ATTENDED");

          if (participants) {
            const days = (
              participants as unknown as {
                joined_at: string;
                matches: { date: string } | null;
              }[]
            )
              .map((p) => p.matches?.date || p.joined_at?.split("T")[0])
              .filter(Boolean);
            setAttendanceDays(days);
          }
        } catch (err) {
          console.error("Error fetching user stats/attendance:", err);
        }
      };

      fetchStats();
    }
  }, [user]);

  const contributionGrid = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - daysToMonday - 28);

    const cells = [];
    for (let d = 0; d < 35; d++) {
      const current = new Date(startDay);
      current.setDate(startDay.getDate() + d);
      const dateStr = current.toISOString().split("T")[0];
      const dayVal = current.getDay();
      const row = dayVal === 0 ? 6 : dayVal - 1;
      const col = Math.floor(d / 7);
      cells.push({ date: dateStr, row, col });
    }
    return cells;
  }, []);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reviewMatch, setReviewMatch] = useState<Match | null>(null);
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);

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
          if (import.meta.env.DEV)
            console.warn("Geolocation API unavailable or permission denied.", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
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

  const [liveMatches, setLiveMatches] = useState<Match[]>(matches);

  useEffect(() => {
    setLiveMatches(matches);
  }, [matches]);

  // Find user's next upcoming match (declared safe after liveMatches initialization)
  const nextMatch = useMemo(() => {
    if (!user) return null;
    const userMatches = liveMatches.filter((m) => {
      const isCreator = m.creator_id === user.id;
      const isParticipant = m.current_players?.some((p) => p.id === user.id);
      if (!isCreator && !isParticipant) return false;

      // Filter for future matches
      try {
        const matchStart = new Date(`${m.date}T${m.time}`);
        return matchStart.getTime() > Date.now();
      } catch {
        return false;
      }
    });

    if (userMatches.length === 0) return null;

    // Sort by date and time ascending
    return userMatches.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time}`).getTime();
      const timeB = new Date(`${b.date}T${b.time}`).getTime();
      return timeA - timeB;
    })[0];
  }, [liveMatches, user]);

  useEffect(() => {
    if (useAuthStore.getState().isDemoMode) return;

    const channel = supabase
      .channel("public:matches")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMatch = payload.new as Match;
            try {
              const { data: courtData } = await supabase
                .from("courts")
                .select("*")
                .eq("id", newMatch.court_id)
                .single();

              const matchWithCourt = {
                ...newMatch,
                court: courtData || undefined,
                current_players: [],
              };

              setLiveMatches((prev) => {
                if (prev.some((m) => m.id === newMatch.id)) return prev;
                return [matchWithCourt, ...prev];
              });
            } catch (err) {
              console.error("Error fetching court details for realtime match insert:", err);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMatch = payload.new as Match;
            setLiveMatches((prev) =>
              prev.map((m) => (m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m)),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedMatch = payload.old as { id: string };
            setLiveMatches((prev) => prev.filter((m) => m.id !== deletedMatch.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    const reviewedIds = JSON.parse(
      localStorage.getItem(`sportmatch_reviewed_matches_${currentUser.id}`) || "[]",
    );

    async function checkRatingLoop() {
      // 1. Filter candidate past/completed matches
      const candidates = matches.filter((m) => {
        const isPart =
          m.creator_id === currentUser.id ||
          m.current_players?.some((p) => p.id === currentUser.id);
        if (!isPart) return false;

        const matchStart = new Date(`${m.date}T${m.time}`);
        const isPast = matchStart.getTime() < Date.now();

        // Match status must be finished/completed or past
        const isCompleted =
          (m.status as string) === "COMPLETED" || m.status === "Finished" || isPast;
        if (!isCompleted) return false;

        return !reviewedIds.includes(m.id);
      });

      if (candidates.length === 0) return;

      // 2. Gate checking for 'ATTENDED' status and geolocation proximity
      for (const match of candidates) {
        let isAttended = false;

        if (useAuthStore.getState().isDemoMode) {
          // Check demo storage flag
          isAttended = localStorage.getItem(`sportmatch_demo_checkin_${match.id}`) === "true";
        } else {
          try {
            const { data: participant } = await supabase
              .from("match_participants")
              .select("status")
              .eq("match_id", match.id)
              .eq("user_id", currentUser.id)
              .single();
            isAttended = participant?.status === "ATTENDED";
          } catch (e) {
            console.warn("Failed to query match status:", e);
          }
        }

        if (!isAttended) continue;

        // Geolocation Liveness check (user within 100m of the court coordinates)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLat = position.coords.latitude;
              const userLng = position.coords.longitude;
              const courtLat = match.court?.lat || -12.1221;
              const courtLng = match.court?.lng || -77.0298;

              const distance = calculateDistance(userLat, userLng, courtLat, courtLng);
              const threshold = 0.1; // 100m

              if (distance <= threshold) {
                setReviewMatch(match);
              } else {
                console.warn(
                  `Gated Rating Loop warning: User is too far (${(distance * 1000).toFixed(0)}m) to review match ${match.id}`,
                );
              }
            },
            (err) => {
              console.warn("Geolocation permission error during rating loop liveness check:", err);
            },
            { enableHighAccuracy: true, timeout: 5000 },
          );
        }
        break; // Process one rating prompt at a time
      }
    }

    checkRatingLoop();
  }, [matches, user]);

  const filteredMatches = selectedSport
    ? liveMatches.filter((m) => m.sport === selectedSport)
    : liveMatches;

  const closestCourts = useMemo(() => {
    if (!baseLocation) return courts.slice(0, 5);
    return [...courts]
      .map((c) => ({
        ...c,
        distance: calculateDistance(baseLocation.lat, baseLocation.lng, c.lat, c.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [courts, baseLocation]);

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
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);

  useEffect(() => {
    if (!isCreateModalOpen) return;

    let active = true;
    setLoadingCourts(true);
    apiClient.courts
      .getAll(matchSport || undefined)
      .then((res) => {
        if (active) {
          setFilteredCourts(res);
        }
      })
      .catch((err) => {
        console.error("Error loading filtered courts:", err);
      })
      .finally(() => {
        if (active) setLoadingCourts(false);
      });

    return () => {
      active = false;
    };
  }, [matchSport, isCreateModalOpen]);

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
        const { error: partError } = await withTimeout(
          supabase.from("match_participants").insert({
            match_id: newMatch.id,
            user_id: user.id,
            status: "ACCEPTED",
          }),
        );

        if (partError) {
          if (import.meta.env.DEV) console.error("Error joining creator to match:", partError);
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

      // BUG-01: Use router.invalidate() instead of window.location.reload().
      // This re-runs the route loader to refresh match data without destroying
      // React state, causing hydration lags, or risking session loss on mobile.
      await router.invalidate();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Próximo Partido Card */}
          {nextMatch ? (
            <div className="animate-fade-in">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neon animate-pulse" />
                {t("dashboard.next_match", "Próximo Partido")}
              </h3>
              <div className="bg-gradient-card border border-primary/20 rounded-2xl p-5 shadow-neon relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-neon/5 blur-2xl pointer-events-none" />
                <div className="flex gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-neon shrink-0 grid place-items-center shadow-neon">
                    <Calendar className="h-5 w-5 text-neon-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] bg-neon/20 text-neon font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {nextMatch.sport}
                    </span>
                    <h4 className="font-bold text-base mt-1 text-foreground leading-tight truncate">
                      {nextMatch.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {nextMatch.date} a las {nextMatch.time} hrs
                    </p>
                    {nextMatch.court && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {nextMatch.court.name} · {nextMatch.court.district}
                      </p>
                    )}
                  </div>
                </div>
                {nextMatch.court_id ? (
                  <Link
                    to="/app/courts/$courtId"
                    params={{ courtId: nextMatch.court_id }}
                    className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-105 active:scale-95 transition-transform shrink-0 w-full sm:w-auto text-center cursor-pointer"
                  >
                    Ver Detalles
                  </Link>
                ) : (
                  <Link
                    to="/app/map"
                    className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-105 active:scale-95 transition-transform shrink-0 w-full sm:w-auto text-center cursor-pointer"
                  >
                    Ver Mapa
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-card border border-border rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-xs text-foreground">
                  {t("dashboard.no_next_match", "No tienes partidos programados")}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Organiza una pichanga o únete a una hoy.
                </p>
              </div>
              <Link
                to="/app/match"
                className="px-3.5 py-2 rounded-xl bg-accent text-foreground hover:bg-accent/80 font-bold text-xs transition-colors shrink-0"
              >
                {t("dashboard.find_one", "Encontrar")}
              </Link>
            </div>
          )}

          {/* Recommended Matches List */}
          <div className="space-y-4">
            <PageHeader
              title="Partidos recomendados"
              subtitle="Curado por IA según tu nivel y horarios"
              action={
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-xs shadow-glow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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
          </div>
        </div>

        {/* Side */}
        <div className="space-y-6">
          {/* Weekly Streak & Contribution Graph Widget */}
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-neon" />
                <h3 className="font-bold text-sm">
                  {t("onboarding.streak_title", "Racha Deportiva")}
                </h3>
              </div>
              {streak && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span>
                    {t("onboarding.streak_current", "Racha actual:")}{" "}
                    <strong className="text-neon">{streak.current_streak}</strong>{" "}
                    {streak.current_streak === 1
                      ? t("onboarding.streak_unit_sing", "sem")
                      : t("onboarding.streak_unit_plur", "sems")}
                  </span>
                  <span>·</span>
                  <span>
                    {t("onboarding.streak_max", "Máx:")}{" "}
                    <strong className="text-foreground">{streak.max_streak}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <svg
                  width="220"
                  height="110"
                  viewBox="0 0 220 110"
                  className="text-muted-foreground"
                >
                  {/* Days labels */}
                  <text x="5" y="18" fontSize="8" fill="currentColor">
                    {t("onboarding.day_mon", "Lun")}
                  </text>
                  <text x="5" y="46" fontSize="8" fill="currentColor">
                    {t("onboarding.day_wed", "Mié")}
                  </text>
                  <text x="5" y="74" fontSize="8" fill="currentColor">
                    {t("onboarding.day_fri", "Vie")}
                  </text>
                  <text x="5" y="102" fontSize="8" fill="currentColor">
                    {t("onboarding.day_sun", "Dom")}
                  </text>

                  {/* Grid Cells */}
                  {contributionGrid.map((cell, idx) => {
                    const isAttended = attendanceDays.includes(cell.date);
                    const x = 35 + cell.col * 36;
                    const y = 10 + cell.row * 14;

                    return (
                      <rect
                        key={idx}
                        x={x}
                        y={y}
                        width="10"
                        height="10"
                        rx="2"
                        fill={isAttended ? "#39FF14" : "#1e293b"}
                        stroke={isAttended ? "#39FF14" : "rgba(255,255,255,0.05)"}
                        strokeWidth="0.5"
                        className="transition-all duration-300 hover:stroke-white hover:stroke-[1.5px]"
                      >
                        <title>{cell.date}</title>
                      </rect>
                    );
                  })}
                </svg>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {t(
                  "onboarding.streak_footer_prefix",
                  "Los días con asistencia verificada se iluminan en",
                )}{" "}
                <span className="text-[#39FF14] font-bold">
                  {t("onboarding.streak_footer_color", "Verde Neón")}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Jugadores cerca</h3>
              <Link to="/app/match" className="text-xs text-neon flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {users.slice(0, 4).map((p) => {
                const isMe = p.id === user?.id;
                return (
                  <Link
                    key={p.id}
                    to={isMe ? "/app/profile" : "/app/profile/$userId"}
                    params={isMe ? undefined : { userId: p.id }}
                    className="flex items-center gap-3 hover:bg-accent/30 p-1.5 rounded-xl transition-all cursor-pointer text-left w-full"
                  >
                    <img
                      src={p.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full bg-muted shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.preferred_sports[0]} ·{" "}
                        {baseLocation && p.last_location_lat && p.last_location_lng
                          ? `${calculateDistance(baseLocation.lat, baseLocation.lng, p.last_location_lat, p.last_location_lng).toFixed(1)} km`
                          : `${p.distance_km || 0} km`}
                      </div>
                    </div>
                    <span className="text-xs text-neon flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 fill-neon animate-pulse" /> {p.trust_score}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-4">Canchas más cercanas</h3>
            <div className="space-y-3">
              {closestCourts.map((c) => (
                <CourtCard
                  key={`${c.id}-${c.name}-${c.district}`}
                  court={c}
                  onClick={() => setSelectedCourtForBooking(c)}
                  baseLocation={baseLocation}
                  variant="list"
                />
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
                disabled={!matchSport}
                className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none disabled:opacity-50"
              >
                <option value="">
                  {!matchSport
                    ? "Selecciona primero un deporte..."
                    : "Ninguna (Sin Cancha Reservada)"}
                </option>
                {loadingCourts ? (
                  <option disabled>Cargando canchas...</option>
                ) : (
                  filteredCourts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (${c.price_per_hour}/h)
                    </option>
                  ))
                )}
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

      {/* Post-Match Review Modal */}
      <Dialog
        open={!!reviewMatch}
        onOpenChange={(open) => {
          if (!open) setReviewMatch(null);
        }}
      >
        <DialogContent className="max-w-md bg-background border border-border rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("feedback.modal_title")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ayúdanos a mantener una comunidad saludable calificando tu experiencia.
            </DialogDescription>
          </DialogHeader>
          {reviewMatch && (
            <PostMatchReviewForm
              match={reviewMatch}
              onClose={() => {
                const reviewedIds = JSON.parse(
                  localStorage.getItem(`sportmatch_reviewed_matches_${user?.id}`) || "[]",
                );
                localStorage.setItem(
                  `sportmatch_reviewed_matches_${user?.id}`,
                  JSON.stringify([...reviewedIds, reviewMatch.id]),
                );
                setReviewMatch(null);
                router.invalidate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <BookingModal
        court={selectedCourtForBooking}
        isOpen={selectedCourtForBooking !== null}
        onOpenChange={(open) => !open && setSelectedCourtForBooking(null)}
        baseLocation={baseLocation}
      />
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
  const router = useRouter();
  const { t } = useTranslation();
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const currentParticipants = match.current_players?.length || 0;
  const spotsTaken = joined ? currentParticipants + 1 : currentParticipants;
  const isFull = spotsTaken >= match.max_players;

  const courtFee = match.court
    ? Math.ceil(match.court.price_per_hour / (match.max_players || 4))
    : 0;

  const matchStart = new Date(`${match.date}T${match.time}`);
  const now = Date.now();
  const fifteenMinsBefore = matchStart.getTime() - 15 * 60 * 1000;
  const twoHoursAfter = matchStart.getTime() + 2 * 60 * 60 * 1000;

  const isParticipant =
    match.creator_id === user?.id ||
    match.current_players?.some((p) => p.id === user?.id) ||
    joined;

  const showCheckIn =
    isParticipant &&
    now >= fifteenMinsBefore &&
    now <= twoHoursAfter &&
    match.status !== "IN_PROGRESS" &&
    match.status !== "Finished";

  const [checkedIn, setCheckedIn] = useState(match.status === "IN_PROGRESS");

  const handleJoin = () => {
    if (user && courtFee > user.fitcoins_balance) {
      setIsBalanceModalOpen(true);
      return;
    }
    setIsJoining(true);
    setTimeout(async () => {
      try {
        if (!useAuthStore.getState().isDemoMode) {
          const { error } = await withTimeout(
            supabase.from("match_participants").insert({
              match_id: match.id,
              user_id: user?.id,
              status: "ACCEPTED",
            }),
          );
          if (error) throw error;
        }
        setIsJoining(false);
        setJoined(true);
        toast.success("¡Te uniste al partido!", {
          description: "Revisa tu calendario para más detalles.",
        });
        // Automatically create a temporary Group Chat for the match
        useChatStore.getState().createMatchGroupChat(match);
        await router.invalidate();
      } catch (err) {
        console.error("Error joining match in Supabase:", err);
        setIsJoining(false);
        const { handleWalletError } = await import("@/services/walletService");
        const handled = handleWalletError(err);
        if (!handled) {
          toast.error("Error al unirse al partido. Por favor intenta de nuevo.");
        }
      }
    }, 600);
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error(t("game_day.checkin_error"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const courtLat = match.court?.lat || -12.1221;
        const courtLng = match.court?.lng || -77.0298;

        const distance = calculateDistance(userLat, userLng, courtLat, courtLng);
        const threshold = 0.1; // 100m

        if (distance <= threshold) {
          try {
            if (!useAuthStore.getState().isDemoMode) {
              await withTimeout(
                supabase.from("matches").update({ status: "IN_PROGRESS" }).eq("id", match.id),
              );

              await withTimeout(
                supabase
                  .from("match_participants")
                  .update({ status: "ATTENDED" })
                  .eq("match_id", match.id)
                  .eq("user_id", user?.id),
              );
            } else {
              match.status = "IN_PROGRESS";
              localStorage.setItem(`sportmatch_demo_checkin_${match.id}`, "true");

              // Local update for contribution graph in demo mode
              if (user) {
                const todayStr = new Date().toISOString().split("T")[0];
                const storedAttendance = localStorage.getItem(
                  `sportmatch_demo_attendance_${user.id}`,
                );
                const days = storedAttendance ? JSON.parse(storedAttendance) : [];
                if (!days.includes(todayStr)) {
                  days.push(todayStr);
                  localStorage.setItem(
                    `sportmatch_demo_attendance_${user.id}`,
                    JSON.stringify(days),
                  );
                }

                const storedStreak = localStorage.getItem(`sportmatch_demo_streak_${user.id}`);
                const streakObj = storedStreak
                  ? JSON.parse(storedStreak)
                  : { current_streak: 0, max_streak: 0 };
                streakObj.current_streak += 1;
                if (streakObj.current_streak > streakObj.max_streak) {
                  streakObj.max_streak = streakObj.current_streak;
                }
                localStorage.setItem(
                  `sportmatch_demo_streak_${user.id}`,
                  JSON.stringify(streakObj),
                );
              }
            }

            setCheckedIn(true);
            toast.success(t("game_day.checkin_success"));
            await router.invalidate();
            if (useAuthStore.getState().isDemoMode) {
              window.location.reload();
            }
          } catch {
            toast.error("Error al registrar asistencia.");
          }
        } else {
          toast.error(t("game_day.checkin_too_far", { distance: distance.toFixed(2) }));
        }
      },
      () => {
        toast.error(t("game_day.checkin_error"));
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card hover:ring-glow transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-violet/20 text-violet-foreground border border-violet/30">
            {match.sport}
          </span>
          {(match.status as string) === "Finished" ||
          (match.status as string) === "COMPLETED" ||
          match.status === "Cancelled" ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#B2B8C2] border border-white/10 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B2B8C2]" />
              Finalizado
            </span>
          ) : match.status === "IN_PROGRESS" ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD60A] animate-pulse" />
              En Curso
            </span>
          ) : isFull ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30]" />
              Lleno
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14]" />
              Buscando
            </span>
          )}
        </div>
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

        {showCheckIn && !checkedIn ? (
          <button
            onClick={handleCheckIn}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 hover:shadow-glow transition-all active:scale-95 cursor-pointer"
          >
            {t("game_day.confirm_attendance")}
          </button>
        ) : checkedIn || match.status === "IN_PROGRESS" ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Asistiendo 🟢
          </span>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isParticipant || isFull || isJoining}
            className="px-3 py-1.5 rounded-lg bg-gradient-neon text-neon-foreground text-sm font-semibold disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
          >
            {isJoining ? "..." : isParticipant ? "Unido" : isFull ? "Lleno" : "Unirme"}
          </button>
        )}
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

function PostMatchReviewForm({ match, onClose }: { match: Match; onClose: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [courtRating, setCourtRating] = useState<number>(5);
  const [playerRatings, setPlayerRatings] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherPlayers = useMemo(() => {
    if (!match.current_players) return [];
    return match.current_players.filter((p) => p.id !== user?.id);
  }, [match.current_players, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      for (const player of otherPlayers) {
        const ratingTag = playerRatings[player.id];
        if (!ratingTag) continue;

        let trustAdjustment = 0;
        let fitcoinsAdjustment = 0;
        let tagDescription = "";

        switch (ratingTag) {
          case "good_level":
            trustAdjustment = 2;
            tagDescription = t("feedback.tag_good_level");
            break;
          case "punctual":
            trustAdjustment = 2;
            tagDescription = t("feedback.tag_punctual");
            break;
          case "good_teammate":
            trustAdjustment = 3;
            tagDescription = t("feedback.tag_good_teammate");
            break;
          case "disrespectful":
            trustAdjustment = -10;
            fitcoinsAdjustment = -50;
            tagDescription = t("feedback.tag_disrespectful");
            break;
          case "no_show":
            trustAdjustment = -15;
            fitcoinsAdjustment = -100;
            tagDescription = t("feedback.tag_no_show");
            break;
        }

        if (useAuthStore.getState().isDemoMode) {
          const { MOCK_USERS, MOCK_TRANSACTIONS } = await import("@/shared/api/apiClient");
          const target = MOCK_USERS.find((u) => u.id === player.id);
          if (target) {
            target.trust_score = Math.max(0, Math.min(100, target.trust_score + trustAdjustment));
            target.fitcoins_balance = Math.max(0, target.fitcoins_balance + fitcoinsAdjustment);
            if (fitcoinsAdjustment < 0) {
              MOCK_TRANSACTIONS.push({
                id: `tx-penalty-${Date.now()}-${Math.random()}`,
                created_at: new Date().toISOString(),
                user_id: player.id,
                amount: fitcoinsAdjustment,
                description: `Penalización: ${tagDescription}`,
                type: "PENALTY",
              });
            }
          }
        } else {
          const { data: profile } = await withTimeout(
            supabase
              .from("profiles")
              .select("trust_score, fitcoins_balance")
              .eq("id", player.id)
              .single(),
          );

          if (profile) {
            const newTrustScore = Math.max(
              0,
              Math.min(100, (profile.trust_score || 100) + trustAdjustment),
            );
            const newFitcoins = Math.max(0, (profile.fitcoins_balance || 0) + fitcoinsAdjustment);

            await withTimeout(
              supabase
                .from("profiles")
                .update({
                  trust_score: newTrustScore,
                  fitcoins_balance: newFitcoins,
                })
                .eq("id", player.id),
            );

            if (fitcoinsAdjustment < 0) {
              await withTimeout(
                supabase.from("wallet_transactions").insert({
                  user_id: player.id,
                  amount: fitcoinsAdjustment,
                  description: `Penalización: ${tagDescription}`,
                  type: "PENALTY",
                }),
              );
            }
          }
        }
      }

      toast.success(t("feedback.feedback_success"));
      onClose();
    } catch {
      toast.error("Error al enviar calificaciones.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      {match.court && (
        <div className="space-y-2 border-b border-border/50 pb-4">
          <label className="text-sm font-semibold text-foreground block">
            {t("feedback.rate_court")}: <span className="text-neon">{match.court.name}</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCourtRating(star)}
                className="focus:outline-none cursor-pointer"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= courtRating ? "fill-warning text-warning" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        <label className="text-sm font-semibold text-foreground block">
          {t("feedback.rate_players")}
        </label>
        {otherPlayers.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            No hay otros participantes para calificar en este partido.
          </div>
        ) : (
          otherPlayers.map((player) => (
            <div
              key={player.id}
              className="p-3 bg-accent/20 rounded-2xl border border-border/50 space-y-3"
            >
              <div className="flex items-center gap-2">
                <img
                  src={player.avatar_url}
                  alt={player.name}
                  className="h-8 w-8 rounded-full bg-muted object-cover"
                />
                <span className="text-sm font-medium">{player.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    tag: "good_level",
                    label: t("feedback.tag_good_level"),
                    color: "hover:bg-violet/20 hover:text-violet-foreground",
                  },
                  {
                    tag: "punctual",
                    label: t("feedback.tag_punctual"),
                    color: "hover:bg-blue-500/20 hover:text-blue-400",
                  },
                  {
                    tag: "good_teammate",
                    label: t("feedback.tag_good_teammate"),
                    color: "hover:bg-emerald-500/20 hover:text-emerald-400",
                  },
                  {
                    tag: "disrespectful",
                    label: t("feedback.tag_disrespectful"),
                    color: "hover:bg-red-500/20 hover:text-red-400",
                  },
                  {
                    tag: "no_show",
                    label: t("feedback.tag_no_show"),
                    color: "hover:bg-orange-500/20 hover:text-orange-400",
                  },
                ].map((item) => {
                  const isSelected = playerRatings[player.id] === item.tag;
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setPlayerRatings({ ...playerRatings, [player.id]: item.tag })}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground font-semibold"
                          : `bg-background border-border/60 text-muted-foreground ${item.color}`
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-xl bg-neon text-neon-foreground font-bold hover:shadow-neon transition-shadow disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? "Enviando..." : t("feedback.submit_feedback")}
      </button>
    </form>
  );
}

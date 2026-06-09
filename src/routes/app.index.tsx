import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";

import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
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
    const timeout = (ms: number) =>
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
      );

    const fetchWithTimeout = async <T,>(fn: () => Promise<T>, ms = 8000): Promise<T | null> => {
      try {
        return await Promise.race([fn(), timeout(ms)]);
      } catch {
        return null;
      }
    };

    const backendMatches = await fetchWithTimeout(() => backendApi.matches.getAll());
    const backendCourts = await fetchWithTimeout(() => backendApi.courts.getAll());
    const backendUsers = await fetchWithTimeout(() => backendApi.users.getAll());
    const backendSports = await fetchWithTimeout(() => backendApi.sports.getAll());

    const matches =
      backendMatches && typeof backendMatches === "object" && "data" in backendMatches
        ? (backendMatches as { data: Match[] }).data
        : [];
    const users =
      backendUsers && typeof backendUsers === "object" && "data" in backendUsers
        ? (backendUsers as { data: User[] }).data
        : [];
    const courts =
      backendCourts && typeof backendCourts === "object" && "data" in backendCourts
        ? (backendCourts as { data: Court[] }).data
        : [];
    const sports =
      backendSports && typeof backendSports === "object" && "data" in backendSports
        ? (backendSports as { data: SportCatalog[] }).data
        : [];

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

    // Try backend first for courts, fallback to Supabase
    backendApi.courts
      .getAll(matchSport || undefined)
      .then((res) => {
        if (active) {
          setFilteredCourts(res as Court[]);
        }
      })
      .catch(() => {
        apiClient.courts
          .getAll(matchSport || undefined)
          .then((res) => {
            if (active) {
              setFilteredCourts(res);
            }
          })
          .catch((err) => {
            console.error("Error loading filtered courts:", err);
          });
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
      let newMatch: Match;

      // Try backend first, fallback to Supabase
      const token = user.id;
      const backendResult = await backendApi.matches
        .create(token, {
          title: matchTitle,
          sport: matchSport,
          court_id: matchCourtId || undefined,
          date: matchDate,
          time: matchTime,
          max_players: Number(matchMaxPlayers),
          required_level: matchLevel,
        })
        .catch(() => null);

      if (backendResult?.data) {
        newMatch = backendResult.data as Match;
      } else {
        newMatch = await apiClient.matches.create({
          title: matchTitle,
          sport: matchSport,
          court_id: matchCourtId || null,
          date: matchDate,
          time: matchTime,
          max_players: Number(matchMaxPlayers),
          required_level: matchLevel,
          creator_id: user.id,
        });
      }

      if (!useAuthStore.getState().isDemoMode) {
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
      <div className="rounded-3xl bg-gradient-card border border-border/60 p-6 md:p-8 shadow-card relative overflow-hidden mb-8 group">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-gradient-primary opacity-15 blur-3xl group-hover:opacity-25 transition-opacity duration-700" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-neon/5 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative">
          <div>
            <div className="text-sm text-muted-foreground/70 font-medium mb-1">Hola,</div>
            <h1 className="font-heading text-4xl md:text-5xl tracking-wide text-white">
              {user.name.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Tenés <span className="text-neon font-semibold">{matches.length}</span> partidos
              compatibles cerca tuyo hoy.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/app/match"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Sparkles className="h-4 w-4" /> Encontrar partido
              </Link>
              <Link
                to="/app/courts"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-semibold hover:bg-white/10 transition-all duration-200"
              >
                <Calendar className="h-4 w-4" /> Reservar cancha
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[260px]">
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
            <div className="animate-slide-up">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neon animate-pulse-ring" />
                {t("dashboard.next_match", "Próximo Partido")}
              </h3>
              <div className="bg-gradient-card border border-primary/20 rounded-2xl p-5 shadow-neon relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-lift">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-neon/5 blur-2xl pointer-events-none" />
                <div className="flex gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-neon shrink-0 grid place-items-center shadow-neon">
                    <Calendar className="h-5 w-5 text-neon-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] bg-neon/20 text-neon font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {nextMatch.sport}
                    </span>
                    <h4 className="font-heading text-xl tracking-wide text-white mt-1">
                      {nextMatch.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
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
                    className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 w-full sm:w-auto text-center"
                  >
                    Ver Detalles
                  </Link>
                ) : (
                  <Link
                    to="/app/map"
                    className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold text-xs shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 w-full sm:w-auto text-center"
                  >
                    Ver Mapa
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gradient-card border border-border/60 rounded-2xl flex items-center justify-between gap-4 card-lift">
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  {t("dashboard.no_next_match", "No tienes partidos programados")}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organiza una pichanga o únete a una hoy.
                </p>
              </div>
              <Link
                to="/app/match"
                className="px-4 py-2 rounded-xl bg-accent text-foreground hover:bg-accent/80 font-bold text-xs transition-colors shrink-0"
              >
                {t("dashboard.find_one", "Encontrar")}
              </Link>
            </div>
          )}

          {/* Recommended Matches List */}
          <div className="space-y-4">
            <div className="flex items-end justify-between mb-1">
              <div>
                <h2 className="font-heading text-2xl tracking-wide text-white">
                  Partidos recomendados
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curado por IA según tu nivel y horarios
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-xs shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Crear Partido
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((m) => <MatchCard key={m.id} match={m} />)
              ) : (
                <div className="col-span-2 p-10 text-center text-muted-foreground/60 glass rounded-2xl border border-border/40">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium">
                    No hay partidos recomendados para este deporte.
                  </p>
                  <p className="text-xs text-muted-foreground/40 mt-1">
                    Prueba con otro deporte o crea uno nuevo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side */}
        <div className="space-y-6">
          {/* Weekly Streak & Contribution Graph Widget */}
          <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neon/10">
                  <Flame className="h-4 w-4 text-neon" />
                </div>
                <h3 className="font-heading text-lg tracking-wide text-white">
                  {t("onboarding.streak_title", "Racha Deportiva")}
                </h3>
              </div>
              {streak && (
                <div className="text-[9px] text-muted-foreground flex items-center gap-1.5 font-mono">
                  <span>
                    <strong className="text-neon">{streak.current_streak}</strong>
                    {streak.current_streak === 1
                      ? t("onboarding.streak_unit_sing", "sem")
                      : t("onboarding.streak_unit_plur", "sems")}
                  </span>
                  <span className="text-white/20">·</span>
                  <span>
                    <span className="text-muted-foreground">max</span>{" "}
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
                  className="text-muted-foreground/50"
                >
                  <text x="5" y="18" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_mon", "Lun")}
                  </text>
                  <text x="5" y="46" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_wed", "Mié")}
                  </text>
                  <text x="5" y="74" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_fri", "Vie")}
                  </text>
                  <text x="5" y="102" fontSize="7" fill="currentColor" className="font-mono">
                    {t("onboarding.day_sun", "Dom")}
                  </text>

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
                        fill={isAttended ? "#39FF14" : "rgba(255,255,255,0.04)"}
                        stroke={isAttended ? "#39FF14" : "rgba(255,255,255,0.06)"}
                        strokeWidth="0.5"
                        className={`transition-all duration-300 hover:stroke-white hover:stroke-[1.5px] ${isAttended ? "shadow-neon" : ""}`}
                      >
                        <title>{cell.date}</title>
                      </rect>
                    );
                  })}
                </svg>
              </div>
              <p className="text-[9px] text-muted-foreground/70 text-center leading-relaxed">
                Los días con asistencia se iluminan en{" "}
                <span className="text-neon font-bold">Verde Neón</span>.
              </p>
            </div>
          </div>

          <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg tracking-wide text-white">Jugadores cerca</h3>
              <Link
                to="/app/match"
                className="text-[10px] text-neon hover:text-neon/80 flex items-center gap-1 font-semibold transition-colors"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {users.slice(0, 4).map((p) => {
                const isMe = p.id === user?.id;
                return (
                  <Link
                    key={p.id}
                    to={isMe ? "/app/profile" : "/app/profile/$userId"}
                    params={isMe ? undefined : { userId: p.id }}
                    className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer text-left w-full group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full bg-muted object-cover border border-border/30 group-hover:border-neon/30 transition-colors"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-neon border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-foreground/90 group-hover:text-foreground transition-colors">
                        {p.name}
                        {isMe && (
                          <span className="text-[9px] text-muted-foreground ml-1">(tú)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground/70 truncate">
                        {p.preferred_sports?.[0] || "Sin deporte"} ·{" "}
                        {baseLocation && p.last_location_lat && p.last_location_lng
                          ? `${calculateDistance(baseLocation.lat, baseLocation.lng, p.last_location_lat, p.last_location_lng).toFixed(1)} km`
                          : `${p.distance_km || 0} km`}
                      </div>
                    </div>
                    <span className="text-[11px] text-neon flex items-center gap-1 shrink-0 font-semibold">
                      <Star className="h-3 w-3 fill-neon" /> {p.trust_score}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
            <h3 className="font-heading text-lg tracking-wide text-white mb-4">Canchas cercanas</h3>
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
        <DialogContent className="max-w-md bg-background border border-border/60 rounded-3xl p-6 shadow-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide text-white">
              Crear nuevo partido
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/70">
              Completa los detalles para invitar a otros jugadores.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMatch} className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                Título del partido
              </label>
              <input
                type="text"
                required
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                placeholder="Ej. Dobles de Pádel"
                className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Deporte
                </label>
                <select
                  required
                  value={matchSport}
                  onChange={(e) => {
                    setMatchSport(e.target.value);
                    setMatchCourtId("");
                  }}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Nivel requerido
                </label>
                <select
                  required
                  value={matchLevel}
                  onChange={(e) => setMatchLevel(e.target.value as Level)}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                Cancha (Opcional)
              </label>
              <select
                value={matchCourtId}
                onChange={(e) => setMatchCourtId(e.target.value)}
                disabled={!matchSport}
                className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all disabled:opacity-40"
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1.5">
                Máx. Jugadores
              </label>
              <input
                type="number"
                required
                min="1"
                value={matchMaxPlayers}
                onChange={(e) => setMatchMaxPlayers(Number(e.target.value))}
                className="w-full bg-accent/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neon/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingMatch}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] text-sm tracking-wide"
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
        <DialogContent className="max-w-md bg-background border border-border/60 rounded-3xl p-6 shadow-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-wide text-white">
              {t("feedback.modal_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/70">
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
    <div className="glass rounded-xl p-3 text-center hover:bg-white/5 transition-all duration-200">
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="text-xl font-bold mt-1 font-mono text-foreground">{value}</div>
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
    <div className="bg-gradient-card border border-border/60 rounded-2xl p-5 shadow-card card-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-violet/15 text-violet-foreground border border-violet/30 font-extrabold uppercase tracking-wider">
            {match.sport}
          </span>
          {(match.status as string) === "Finished" ||
          (match.status as string) === "COMPLETED" ||
          match.status === "Cancelled" ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-[#B2B8C2] border border-white/10 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B2B8C2]" />
              Finalizado
            </span>
          ) : match.status === "IN_PROGRESS" ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD60A] animate-pulse" />
              En Curso
            </span>
          ) : isFull ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30]" />
              Lleno
            </span>
          ) : (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14]" />
              Buscando
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {new Date(match.date).toLocaleDateString()}
        </span>
      </div>
      <h3 className="font-heading text-xl tracking-wide text-white leading-tight">{match.title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
        <MapPin className="h-3 w-3 shrink-0" /> {match.court?.name || "Sin cancha asignada"}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Cupos
          </div>
          <div className="text-sm font-bold font-mono text-foreground">
            {spotsTaken}
            <span className="text-muted-foreground/50">/{match.max_players}</span>
          </div>
        </div>

        {showCheckIn && !checkedIn ? (
          <button
            onClick={handleCheckIn}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 hover:shadow-glow transition-all active:scale-95 cursor-pointer"
          >
            {t("game_day.confirm_attendance")}
          </button>
        ) : checkedIn || match.status === "IN_PROGRESS" ? (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Asistiendo
          </span>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isParticipant || isFull || isJoining}
            className="px-4 py-2 rounded-lg bg-gradient-neon text-neon-foreground text-sm font-bold disabled:opacity-50 transition-all active:scale-95 cursor-pointer shadow-neon hover:scale-105"
          >
            {isJoining ? "..." : isParticipant ? "Unido" : isFull ? "Lleno" : "Unirme"}
          </button>
        )}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out"
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

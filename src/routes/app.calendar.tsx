import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/shared/api/apiClient";
import { Match, User } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Trophy,
  MessageSquare,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [{ title: "Mi Calendario — SportMatch" }] }),
  loader: async () => {
    const matches = await apiClient.matches.getAll();
    return { matches };
  },
  component: CalendarPage,
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

function getSportColorClass(sport: string) {
  switch (sport.toLowerCase()) {
    case "padel":
    case "pádel":
      return "bg-[#39FF14] shadow-[0_0_8px_#39FF14]";
    case "futbol":
    case "fútbol":
      return "bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]";
    case "tenis":
      return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]";
    case "running":
      return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
    case "basquet":
    case "básquet":
      return "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]";
    case "voley":
    case "vóley":
      return "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]";
    default:
      return "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.8)]";
  }
}

function CalendarPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { matches } = Route.useLoaderData() as { matches: Match[] };

  const [activeTab, setActiveTab] = useState<"mensual" | "semanal" | "proximos">("mensual");
  const [filterType, setFilterType] = useState<"todos" | "organizados" | "inscritos">("todos");

  // today reference wrapped in useMemo to prevent unnecessary dependency changes
  const today = useMemo(() => new Date(), []);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(() => today.toISOString().split("T")[0]);

  const userId = user?.id || "";

  // Filter matches that are relevant to this user (either created by them or joined by them)
  const userRelatedMatches = useMemo(() => {
    return matches.filter((m) => {
      const isCreator = m.creator_id === userId;
      const isJoined = m.current_players?.some((p) => p.id === userId) || false;
      return isCreator || isJoined;
    });
  }, [matches, userId]);

  // Apply visual filter role (Todos / Organizados / Inscritos)
  const filteredMatches = useMemo(() => {
    return userRelatedMatches.filter((m) => {
      const isCreator = m.creator_id === userId;
      if (filterType === "organizados") return isCreator;
      if (filterType === "inscritos") return !isCreator;
      return true;
    });
  }, [userRelatedMatches, filterType, userId]);

  // Stats calculation
  const stats = useMemo(() => {
    const organizados = userRelatedMatches.filter((m) => m.creator_id === userId).length;
    const inscritos = userRelatedMatches.filter((m) => m.creator_id !== userId).length;
    return {
      total: userRelatedMatches.length,
      organizados,
      inscritos,
    };
  }, [userRelatedMatches, userId]);

  // --- Monthly View Generation Logic ---
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    const cells = [];

    // Previous month days padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const mm = String(prevMonth + 1).padStart(2, "0");
      const dd = String(prevDay).padStart(2, "0");
      cells.push({
        day: prevDay,
        dateString: `${prevYear}-${mm}-${dd}`,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(currentMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      cells.push({
        day: d,
        dateString: `${currentYear}-${mm}-${dd}`,
        isCurrentMonth: true,
      });
    }

    // Next month days padding to make full rows (multiples of 7)
    const totalCells = cells.length > 35 ? 42 : 35;
    const nextPadding = totalCells - cells.length;
    for (let n = 1; n <= nextPadding; n++) {
      const mm = String(nextMonth + 1).padStart(2, "0");
      const dd = String(n).padStart(2, "0");
      cells.push({
        day: n,
        dateString: `${nextYear}-${mm}-${dd}`,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Selected Day Matches
  const selectedDayMatches = useMemo(() => {
    return filteredMatches.filter((m) => m.date === selectedDate);
  }, [filteredMatches, selectedDate]);

  // --- Weekly View Generation Logic ---
  const weeklyDays = useMemo(() => {
    const list = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      list.push(`${yyyy}-${mm}-${dd}`);
    }
    return list;
  }, []);

  const getDayOfWeekLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayNum = d.getDate();
    const dayName = dayNames[d.getDay()];

    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (dateStr === todayStr) {
      return `Hoy (${dayName} ${dayNum})`;
    }
    if (dateStr === tomorrowStr) {
      return `Mañana (${dayName} ${dayNum})`;
    }
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${dayName} ${dayNum} de ${months[d.getMonth()]}`;
  };

  // --- Upcoming Matches List (Sorted) ---
  const sortedUpcomingMatches = useMemo(() => {
    return filteredMatches
      .filter((m) => {
        const matchStart = new Date(`${m.date}T${m.time}:00`);
        return matchStart.getTime() >= today.getTime();
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}:00`).getTime();
        const timeB = new Date(`${b.date}T${b.time}:00`).getTime();
        return timeA - timeB;
      });
  }, [filteredMatches, today]);

  // --- Historical Matches (Past) ---
  const sortedPastMatches = useMemo(() => {
    return filteredMatches
      .filter((m) => {
        const matchStart = new Date(`${m.date}T${m.time}:00`);
        return matchStart.getTime() < today.getTime();
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}:00`).getTime();
        const timeB = new Date(`${b.date}T${b.time}:00`).getTime();
        return timeB - timeA; // Descending (recent first)
      });
  }, [filteredMatches, today]);

  const handleRefresh = async () => {
    await router.invalidate();
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Page Header */}
      <PageHeader
        title="Calendario Deportivo"
        subtitle="Visualiza y organiza tus próximos encuentros"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass text-xs font-semibold hover:bg-accent cursor-pointer"
            >
              🔄 Recargar
            </button>
            <Link
              to="/app/match"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-xs shadow-glow"
            >
              <Plus className="h-3.5 w-3.5" /> Buscar Partido
            </Link>
          </div>
        }
      />

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-gradient-card border border-border p-4 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Partidos del Mes</div>
            <div className="text-2xl font-bold mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-card border border-border p-4 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Organizados por mí</div>
            <div className="text-2xl font-bold mt-0.5">{stats.organizados}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-card border border-border p-4 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Inscrito (Participante)</div>
            <div className="text-2xl font-bold mt-0.5">{stats.inscritos}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Calendar Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs and Filters Panel */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
            {/* View Tabs Selector */}
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("mensual")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
                  activeTab === "mensual"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Vista Mensual
              </button>
              <button
                onClick={() => setActiveTab("semanal")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
                  activeTab === "semanal"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Vista Semanal
              </button>
              <button
                onClick={() => setActiveTab("proximos")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
                  activeTab === "proximos"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Próximos Partidos
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("todos")}
                className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  filterType === "todos"
                    ? "bg-gradient-primary text-primary-foreground font-semibold shadow-glow"
                    : "glass hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType("organizados")}
                className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  filterType === "organizados"
                    ? "bg-gradient-primary text-primary-foreground font-semibold shadow-glow"
                    : "glass hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                Organizados
              </button>
              <button
                onClick={() => setFilterType("inscritos")}
                className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  filterType === "inscritos"
                    ? "bg-gradient-primary text-primary-foreground font-semibold shadow-glow"
                    : "glass hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                Inscritos
              </button>
            </div>
          </div>

          {/* 1. Monthly Calendar Grid */}
          {activeTab === "mensual" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-card border border-border rounded-3xl p-5 shadow-card">
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg md:text-xl">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="h-9 w-9 rounded-xl border border-border glass flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="h-9 w-9 rounded-xl border border-border glass flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Grid Headings */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
                    <div key={d} className="text-xs font-bold text-muted-foreground py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {calendarCells.map((cell) => {
                    const isSelected = selectedDate === cell.dateString;
                    const isToday = today.toISOString().split("T")[0] === cell.dateString;

                    // Get matches on this cell date
                    const dayMatches = filteredMatches.filter((m) => m.date === cell.dateString);

                    return (
                      <button
                        key={cell.dateString}
                        onClick={() => setSelectedDate(cell.dateString)}
                        className={`aspect-square rounded-2xl p-1.5 md:p-2 border flex flex-col justify-between items-center transition-all cursor-pointer select-none text-center ${
                          !cell.isCurrentMonth
                            ? "opacity-30 border-transparent hover:opacity-50"
                            : isSelected
                              ? "bg-gradient-primary text-primary-foreground border-primary shadow-glow font-bold scale-[1.03]"
                              : isToday
                                ? "bg-accent/40 border-neon text-foreground font-semibold"
                                : "bg-accent/10 border-border/50 hover:bg-accent hover:border-border hover:scale-[1.02]"
                        }`}
                      >
                        <span className="text-xs md:text-sm self-start">{cell.day}</span>

                        {/* Highlights Row */}
                        <div className="flex gap-1 flex-wrap justify-center max-w-full">
                          {dayMatches.slice(0, 3).map((m) => (
                            <div
                              key={m.id}
                              className={`h-1.5 w-1.5 rounded-full ${getSportColorClass(m.sport)}`}
                              title={`${m.sport}: ${m.title}`}
                            />
                          ))}
                          {dayMatches.length > 3 && (
                            <span className="text-[7px] leading-none font-bold text-muted-foreground select-none">
                              +{dayMatches.length - 3}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Agenda Panel for Selected Day */}
              <div className="space-y-4">
                <h4 className="font-bold text-base border-l-4 border-primary pl-3">
                  Agenda del {getDayOfWeekLabel(selectedDate)}
                </h4>

                <div className="space-y-3">
                  {selectedDayMatches.length > 0 ? (
                    selectedDayMatches.map((m) => <MatchRowCard key={m.id} match={m} user={user} />)
                  ) : (
                    <div className="p-8 text-center text-muted-foreground glass rounded-2xl border border-border">
                      No tienes partidos programados para este día.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Weekly Agenda View */}
          {activeTab === "semanal" && (
            <div className="space-y-6 animate-fadeIn">
              {weeklyDays.map((dateStr) => {
                const dayMatches = filteredMatches
                  .filter((m) => m.date === dateStr)
                  .sort((a, b) => a.time.localeCompare(b.time));

                return (
                  <div
                    key={dateStr}
                    className="p-5 rounded-2xl bg-gradient-card border border-border shadow-card flex flex-col md:flex-row md:items-start gap-4"
                  >
                    {/* Day label left */}
                    <div className="md:w-48 shrink-0">
                      <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                        {getDayOfWeekLabel(dateStr).split(" (")[0]}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getDayOfWeekLabel(dateStr).includes("(")
                          ? getDayOfWeekLabel(dateStr).split(" (")[1].replace(")", "")
                          : ""}
                      </p>
                    </div>

                    {/* Matches right */}
                    <div className="flex-1 space-y-3">
                      {dayMatches.length > 0 ? (
                        dayMatches.map((m) => <MatchRowCard key={m.id} match={m} user={user} />)
                      ) : (
                        <p className="text-xs text-muted-foreground py-1 italic">
                          Sin partidos programados para este día.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Upcoming Matches / Agenda Grid */}
          {activeTab === "proximos" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Upcoming List */}
              <div className="space-y-4">
                <h4 className="font-bold text-base border-l-4 border-primary pl-3">
                  Próximos Encuentros
                </h4>
                {sortedUpcomingMatches.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {sortedUpcomingMatches.map((m) => (
                      <MatchDetailCard key={m.id} match={m} user={user} />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground glass rounded-2xl border border-border">
                    No tienes próximos partidos agendados. ¡Únete a uno en el panel de Matchmaking!
                  </div>
                )}
              </div>

              {/* History List */}
              <div className="space-y-4">
                <h4 className="font-bold text-base border-l-4 border-border pl-3 text-muted-foreground">
                  Historial de Partidos
                </h4>
                {sortedPastMatches.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                    {sortedPastMatches.map((m) => (
                      <MatchDetailCard key={m.id} match={m} user={user} isPast />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground glass rounded-2xl border border-border">
                    Aún no tienes partidos en tu historial de juego.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Widget Column */}
        <div className="space-y-6">
          {/* Quick Info & Tips */}
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              💡 Recomendaciones
            </h3>
            <div className="space-y-4 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <div className="shrink-0 text-amber-400">⚡</div>
                <p>
                  <strong>¿Eres el creador?</strong> Recuerda coordinar la reserva de la cancha con
                  anticipación para asegurar que tu partido sea todo un éxito.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="shrink-0 text-sky-400">🛡️</div>
                <p>
                  <strong>Reputación y Check-in:</strong> Confirma tu asistencia en el dashboard
                  desde 15 minutos antes hasta 2 horas después de la hora programada para mantener
                  tu <strong>Trust Score</strong> al 100%.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="shrink-0 text-emerald-400">💰</div>
                <p>
                  <strong>Gana FitCoins:</strong> Completar tus partidos y recibir validación por
                  parte de tus compañeros de juego te premia con hasta 50 FitCoins.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Legend colors */}
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-3 text-sm">Leyenda de Deportes</h3>
            <div className="space-y-2">
              {[
                { name: "Pádel", color: "bg-[#39FF14] shadow-[0_0_8px_#39FF14]" },
                { name: "Fútbol", color: "bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]" },
                { name: "Tenis", color: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" },
                { name: "Running", color: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" },
                { name: "Básquet", color: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" },
                { name: "Vóley", color: "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.name}</span>
                  <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Row-style detailed match item card ---
function MatchRowCard({ match, user }: { match: Match; user: User }) {
  const isCreator = match.creator_id === user.id;
  const emoji = getSportEmoji(match.sport);

  return (
    <div className="flex items-center gap-4 p-4 glass rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/10 transition-all">
      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-card border border-border flex items-center justify-center text-lg">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <Clock className="h-3 w-3" /> {match.time}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs text-muted-foreground font-medium">{match.sport}</span>
          {isCreator ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Organizado
            </span>
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Inscrito
            </span>
          )}
        </div>

        <h5 className="font-bold text-sm text-foreground truncate mt-0.5">{match.title}</h5>

        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate mt-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span>
            {match.court
              ? `${match.court.name} · ${match.court.district || "Lima"}`
              : "Ubicación por confirmar"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/app/chat"
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
          title="Ver Chat"
        >
          <MessageSquare className="h-4 w-4" />
        </Link>
        <Link
          to="/app"
          className="h-8 w-8 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow"
          title="Ver en Dashboard"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// --- Detail style grid match card item ---
function MatchDetailCard({
  match,
  user,
  isPast = false,
}: {
  match: Match;
  user: User;
  isPast?: boolean;
}) {
  const isCreator = match.creator_id === user.id;
  const emoji = getSportEmoji(match.sport);

  const parsedDate = useMemo(() => {
    const d = new Date(match.date + "T00:00:00");
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  }, [match.date]);

  return (
    <div
      className={`rounded-2xl border bg-gradient-card p-5 shadow-card hover:scale-[1.01] transition-all flex flex-col justify-between h-48 ${
        isPast
          ? "border-border/40 bg-accent/5 opacity-80"
          : "border-border/80 hover:border-primary/50"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <span className="text-xs text-muted-foreground font-semibold">{match.sport}</span>
          </div>

          <div>
            {isCreator ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                👑 Creador
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4facfe]/20 text-[#00f2fe] border border-[#4facfe]/30 flex items-center gap-1 shadow-[0_0_8px_rgba(0,242,254,0.15)]">
                👥 Jugador
              </span>
            )}
          </div>
        </div>

        <h5 className="font-bold text-sm md:text-base text-foreground mt-3 line-clamp-1">
          {match.title}
        </h5>

        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <span>
              {parsedDate} · {match.time}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
            <span className="truncate flex-1">
              {match.court ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${match.court.lat},${match.court.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-sky-400 flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {match.court.name} ({match.court.district})
                </a>
              ) : (
                "Ubicación por confirmar"
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-auto">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>
            {match.current_players?.length || 0} / {match.max_players} jugadores
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to="/app/chat"
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border/80 hover:bg-accent transition-colors"
          >
            Chat
          </Link>
          <Link
            to="/app"
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95 transition-transform"
          >
            Detalles
          </Link>
        </div>
      </div>
    </div>
  );
}

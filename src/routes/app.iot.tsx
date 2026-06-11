import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Activity,
  HeartPulse,
  Zap,
  Watch,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  Flame,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "@/shared/api/supabase";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/app/iot")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Telemetría — SportMatch" }] }),
  component: IoT,
});

function IoT() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
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
          console.error("Error fetching user stats/attendance in IoT:", err);
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

  const [heartRate, setHeartRate] = useState(142);
  const [calories, setCalories] = useState(650);
  const [duration, setDuration] = useState(45);
  const [steps, setSteps] = useState(5120);
  const [distanceKm, setDistanceKm] = useState(2.4);
  const [history, setHistory] = useState([60, 80, 120, 145, 130, 160, 142]);

  const [appleHealthConnected, setAppleHealthConnected] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate((prevHr) => {
        // Smooth oscillation between 110 and 165 bpm
        const change = Math.floor(Math.random() * 7) - 3; // drift: -3 to +3
        const nextHr = Math.max(110, Math.min(165, prevHr + change));

        // Update dynamic graph history
        setHistory((prevHist) => [...prevHist.slice(1), nextHr]);
        return nextHr;
      });

      // Increment active calories slowly during ticks if connected
      setCalories((prevCal) => prevCal + (Math.random() > 0.5 ? 2 : 1));
      setSteps((prevSteps) => prevSteps + Math.floor(Math.random() * 5));
    }, 1500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleToggleAppleHealth = (checked: boolean) => {
    if (checked) {
      setIsSyncing(true);
      const toastId = toast.loading("Sincronizando Apple Health Kit...");
      setTimeout(() => {
        setAppleHealthConnected(true);
        setHeartRate(145);
        setCalories(580);
        setDuration(50);
        setSteps(6400);
        setDistanceKm(3.0);
        setHistory((prevHist) => [...prevHist.slice(1), 145]);
        setIsSyncing(false);
        toast.success("¡Apple Health sincronizado con éxito!", {
          id: toastId,
          description: "Métricas obtenidas: 50 mins, 580 Kcal, 6,400 pasos.",
        });
      }, 1500);
    } else {
      setAppleHealthConnected(false);
      toast.success("Apple Health Kit desconectado.");
    }
  };

  const handleSimulateWebhook = () => {
    setIsSyncing(true);
    const toastId = toast.loading("Esperando payload del Webhook (Strava)...");
    setTimeout(() => {
      // Replicates incoming webhook payload structure
      const mockPayload = {
        source: "Strava Webhook API",
        aspect_type: "create",
        activity: {
          name: "Match de Tenis en SportMatch",
          elapsed_time_min: 75,
          distance_km: 4.1,
          steps_count: 8200,
          average_heart_rate: 138,
          calories_burned: 720,
        },
      };

      setHeartRate(mockPayload.activity.average_heart_rate);
      setCalories(mockPayload.activity.calories_burned);
      setDuration(mockPayload.activity.elapsed_time_min);
      setSteps(mockPayload.activity.steps_count);
      setDistanceKm(mockPayload.activity.distance_km);
      setHistory((prevHist) => [...prevHist.slice(1), mockPayload.activity.average_heart_rate]);

      setIsSyncing(false);
      setStravaConnected(true);

      toast.success("¡Webhook de Strava procesado!", {
        id: toastId,
        description: `Actividad: ${mockPayload.activity.name} (${mockPayload.activity.elapsed_time_min} mins · ${mockPayload.activity.calories_burned} Kcal · ${mockPayload.activity.distance_km} km)`,
      });
    }, 1800);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Rendimiento en vivo" subtitle="Telemetría de Rendimiento Conectada" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Heart Rate Widget */}
          <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-destructive opacity-10 blur-3xl" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <HeartPulse className="h-5 w-5 animate-pulse" />
                  <span className="font-semibold uppercase tracking-wider text-sm">Heart Rate</span>
                </div>
                <div className="text-6xl font-black tracking-tighter">
                  {heartRate}{" "}
                  <span className="text-2xl text-muted-foreground font-medium">bpm</span>
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-destructive/20 grid place-items-center">
                <Watch className="h-8 w-8 text-destructive animate-pulse" />
              </div>
            </div>

            <div className="mt-8 flex items-end gap-2 h-32 relative z-10">
              {history.map((v: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-destructive/20 to-destructive transition-all duration-500 group-hover:opacity-80"
                    style={{ height: `${(v / 180) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Universal Performance Cards Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gradient-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-warning mb-4">
                <Zap className="h-5 w-5" />
                <span className="font-semibold uppercase text-sm">Calorías Activas</span>
              </div>
              <div className="text-4xl font-bold">
                {calories} <span className="text-lg text-muted-foreground">kcal</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-neon">
                <ArrowUpRight className="h-4 w-4" /> +15% vs promedio
              </div>
            </div>

            <div className="bg-gradient-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-electric mb-4">
                <Clock className="h-5 w-5" />
                <span className="font-semibold uppercase text-sm">Duración Activa</span>
              </div>
              <div className="text-4xl font-bold">
                {duration} <span className="text-lg text-muted-foreground">min</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-neon">
                <ArrowUpRight className="h-4 w-4" /> En zona de quema de grasa
              </div>
            </div>

            <div className="bg-gradient-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-teal-400 mb-4">
                <Activity className="h-5 w-5" />
                <span className="font-semibold uppercase text-sm">Pasos Totales</span>
              </div>
              <div className="text-4xl font-bold">
                {steps} <span className="text-lg text-muted-foreground">pasos</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-teal-400 text-xs">
                <ArrowUpRight className="h-4 w-4" /> Ritmo de match constante
              </div>
            </div>

            <div className="bg-gradient-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-neon mb-4">
                <Activity className="h-5 w-5" />
                <span className="font-semibold uppercase text-sm">Distancia Match</span>
              </div>
              <div className="text-4xl font-bold">
                {distanceKm.toFixed(1)} <span className="text-lg text-muted-foreground">km</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-destructive text-xs">
                <ArrowDownRight className="h-4 w-4" /> -2% vs promedio
              </div>
            </div>
          </div>
        </div>

        {/* Wearables / API Pipeline Integrations Panel */}
        <div className="space-y-6">
          {/* Weekly Streak & Contribution Graph Widget */}
          <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
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

          <div className="bg-gradient-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-neon animate-pulse" />
              Sincronización de Dispositivos (Health Kit)
            </h3>

            <div className="space-y-4">
              {/* Apple Health Card */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <Watch
                    className={`h-6 w-6 ${appleHealthConnected ? "text-neon" : "text-muted-foreground"}`}
                  />
                  <div>
                    <div className="font-medium text-sm">Apple Health Kit</div>
                    <div
                      className={`text-xs ${appleHealthConnected ? "text-neon font-semibold" : "text-muted-foreground"}`}
                    >
                      {appleHealthConnected ? "Conectado · Transmitiendo" : "Desconectado"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appleHealthConnected}
                  disabled={isSyncing}
                  onChange={(e) => handleToggleAppleHealth(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-neon"
                />
              </div>

              {/* Strava Webhook Card */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <Activity
                    className={`h-6 w-6 ${stravaConnected ? "text-orange-500" : "text-muted-foreground"}`}
                  />
                  <div>
                    <div className="font-medium text-sm">Strava Webhook API</div>
                    <div
                      className={`text-xs ${stravaConnected ? "text-orange-500 font-semibold" : "text-muted-foreground"}`}
                    >
                      {stravaConnected ? "Webhook Activado" : "Esperando Actividad"}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Webhook</div>
              </div>
            </div>

            {/* Simulated webhook button */}
            <button
              onClick={handleSimulateWebhook}
              disabled={isSyncing}
              className="w-full mt-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              Simular Webhook (Strava/Apple)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

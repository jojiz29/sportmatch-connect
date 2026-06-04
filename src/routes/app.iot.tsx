import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/iot")({
  head: () => ({ meta: [{ title: "Telemetría — SportMatch" }] }),
  component: IoT,
});

function IoT() {
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

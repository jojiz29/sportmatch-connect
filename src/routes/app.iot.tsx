import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Activity, HeartPulse, Zap, Watch, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect } from "react";
import { useIoTStore } from "@/features/iot/store";

export const Route = createFileRoute("/app/iot")({
  head: () => ({ meta: [{ title: "Telemetría — SportMatch" }] }),
  component: IoT,
});

const STATIC_SPEED = 12.4;

function IoT() {
  const { currentData, history: storeHistory } = useIoTStore();

  const heartRate = currentData?.heartRate ?? 142;
  const calories = currentData?.calories ?? 650;

  // Fallback beautiful initial points if store history is empty, otherwise map from telemetry history
  const chartHistory = storeHistory.length > 0
    ? storeHistory.map((d) => d.heartRate)
    : [60, 80, 120, 145, 130, 160, heartRate];

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useIoTStore.getState();
      const currentHr = state.currentData?.heartRate ?? 142;
      const currentCal = state.currentData?.calories ?? 650;

      // Smooth heart rate oscillation between 110 and 165 bpm
      const change = Math.floor(Math.random() * 7) - 3; // drift: -3 to +3
      const nextHr = Math.max(110, Math.min(165, currentHr + change));

      // Accumulate +1 or +2 active calories on every tick
      const calChange = Math.random() > 0.5 ? 2 : 1;
      const nextCal = currentCal + calChange;

      state.updateTelemetry({
        heartRate: nextHr,
        calories: nextCal,
        timestamp: new Date().toISOString(),
      });
    }, 1500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Rendimiento en vivo" subtitle="Telemetría conectada (Apple Watch)" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                <Watch className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="mt-8 flex items-end gap-2 h-32 relative z-10">
              {chartHistory.map((v: number, i: number) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-destructive/20 to-destructive transition-all duration-500 group-hover:opacity-80"
                    style={{ height: `${(v / 180) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

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
                <Activity className="h-5 w-5" />
                <span className="font-semibold uppercase text-sm">Velocidad Prom.</span>
              </div>
              <div className="text-4xl font-bold">
                {STATIC_SPEED} <span className="text-lg text-muted-foreground">km/h</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-destructive text-xs">
                <ArrowDownRight className="h-4 w-4" /> -2% vs promedio
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-neon animate-pulse" />
              Dispositivos Conectados
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-neon/30 bg-neon/5">
                <div className="flex items-center gap-3">
                  <Watch className="h-6 w-6 text-neon" />
                  <div>
                    <div className="font-medium text-sm">Apple Watch Series 8</div>
                    <div className="text-xs text-neon">Sincronizando...</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">100% 🔋</div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card opacity-50">
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">Banda Pecho Polar H10</div>
                    <div className="text-xs text-muted-foreground">Desconectado</div>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 rounded-xl glass border border-border text-sm font-semibold hover:bg-accent transition-colors">
              + Añadir dispositivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

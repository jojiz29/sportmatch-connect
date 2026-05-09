import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { IOT } from "@/lib/mock";
import { Heart, Flame, Footprints, Activity, Watch, Bluetooth } from "lucide-react";

export const Route = createFileRoute("/app/iot")({
  head: () => ({ meta: [{ title: "Telemetría — SportMatch" }] }),
  component: IoT,
});

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

function IoT() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader
        title="Telemetría deportiva"
        subtitle="Datos en vivo desde tus dispositivos conectados"
        action={
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
            <Bluetooth className="h-3 w-3 text-electric" /> Apple Watch · conectado
          </span>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tile icon={<Heart className="h-5 w-5" />} label="Ritmo cardíaco" value={`${IOT.heartRate}`} unit="bpm" color="text-destructive" />
            <Tile icon={<Flame className="h-5 w-5" />} label="Calorías" value={`${IOT.calories}`} unit="kcal" color="text-warning" />
            <Tile icon={<Footprints className="h-5 w-5" />} label="Distancia" value={`${IOT.distanceKm}`} unit="km" color="text-neon" />
            <Tile icon={<Activity className="h-5 w-5" />} label="Pace" value={IOT.pace} unit="/km" color="text-electric" />
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Carga semanal</h3>
            <div className="flex items-end justify-between gap-3 h-40">
              {IOT.weeklyLoad.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-gradient-primary transition-all hover:opacity-80"
                    style={{ height: `${v}%` }}
                  />
                  <div className="text-xs text-muted-foreground">{DAYS[i]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Pulso en vivo</h3>
            <div className="relative h-32">
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pulse" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.24 295)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="oklch(0.62 0.24 295)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 60 L 40 60 L 50 30 L 60 80 L 70 50 L 90 50 L 100 20 L 110 90 L 120 50 L 160 50 L 170 25 L 180 80 L 190 50 L 230 50 L 240 30 L 250 75 L 260 50 L 300 50 L 310 20 L 320 85 L 330 50 L 400 50"
                  fill="none"
                  stroke="oklch(0.62 0.24 295)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-3">Dispositivos</h3>
            <div className="space-y-3">
              {[
                { name: "Apple Watch S9", on: true, icon: Watch },
                { name: "Polar H10 Strap", on: true, icon: Heart },
                { name: "Garmin Forerunner", on: false, icon: Activity },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl grid place-items-center ${d.on ? "bg-gradient-primary" : "bg-muted"}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 text-sm">{d.name}</div>
                    <div className={`text-xs ${d.on ? "text-neon" : "text-muted-foreground"}`}>
                      {d.on ? "● Activo" : "○ Off"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-2">IA · Insight</h3>
            <p className="text-sm text-muted-foreground">
              Tu rendimiento sube <span className="text-neon font-semibold">12%</span> los días que jugás de noche.
              Te sugerimos reservar el martes 21:00.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit: string; color: string }) {
  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-4">
      <div className={`flex items-center gap-2 ${color}`}>{icon} <span className="text-xs text-muted-foreground">{label}</span></div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{unit}</div>
      </div>
    </div>
  );
}

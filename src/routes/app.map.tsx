import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { COURTS, PLAYERS, MATCHES } from "@/lib/mock";
import { MapPin, Star, Users, Activity } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/map")({
  head: () => ({ meta: [{ title: "Mapa — SportMatch" }] }),
  component: MapPage,
});

type Pin = { id: string; x: number; y: number; type: "court" | "player" | "match"; label: string; sub: string };

const PINS: Pin[] = [
  ...COURTS.map((c, i) => ({ id: c.id, x: 20 + i * 18, y: 30 + (i % 2) * 25, type: "court" as const, label: c.name, sub: `$${c.pricePerHour}/h` })),
  ...PLAYERS.slice(0, 4).map((p, i) => ({ id: p.id, x: 30 + i * 15, y: 60 + (i % 2) * 12, type: "player" as const, label: p.name, sub: `${p.sport} · ${p.distanceKm}km` })),
  ...MATCHES.slice(0, 2).map((m, i) => ({ id: m.id, x: 55 + i * 20, y: 20 + i * 30, type: "match" as const, label: m.title, sub: m.date })),
];

export default function MapPage() {
  const [selected, setSelected] = useState<Pin | null>(PINS[0]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Mapa en vivo" subtitle="Canchas, partidos y jugadores cerca tuyo" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-[560px] rounded-3xl overflow-hidden border border-border shadow-card">
          {/* Stylized map background */}
          <div className="absolute inset-0 bg-gradient-card">
            <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.62 0.24 295 / 0.15)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <path d="M 0 200 Q 200 150 400 250 T 800 200" stroke="oklch(0.7 0.21 240 / 0.4)" strokeWidth="3" fill="none" />
              <path d="M 100 0 Q 200 200 150 400 T 250 600" stroke="oklch(0.86 0.24 145 / 0.3)" strokeWidth="3" fill="none" />
            </svg>
          </div>

          {PINS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group ${selected?.id === p.id ? "z-20" : "z-10"}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className={`h-10 w-10 rounded-full grid place-items-center shadow-glow transition-all ${
                p.type === "court" ? "bg-gradient-primary" :
                p.type === "match" ? "bg-gradient-neon" : "bg-electric"
              } ${selected?.id === p.id ? "scale-125 animate-pulse-ring" : "group-hover:scale-110"}`}>
                {p.type === "court" && <MapPin className="h-5 w-5 text-white" />}
                {p.type === "match" && <Activity className="h-5 w-5 text-neon-foreground" />}
                {p.type === "player" && <Users className="h-5 w-5 text-white" />}
              </div>
            </button>
          ))}

          {/* Legend */}
          <div className="absolute top-4 left-4 glass rounded-xl p-3 space-y-2 text-xs">
            <Legend color="bg-gradient-primary" label="Canchas" />
            <Legend color="bg-gradient-neon" label="Partidos activos" />
            <Legend color="bg-electric" label="Jugadores" />
          </div>
        </div>

        <div className="space-y-4">
          {selected && (
            <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
              <div className="text-xs text-neon uppercase tracking-wide">{selected.type}</div>
              <h3 className="text-xl font-bold mt-1">{selected.label}</h3>
              <p className="text-sm text-muted-foreground">{selected.sub}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm">Ver detalle</button>
                <button className="px-3 py-2 rounded-xl glass text-sm">Ruta</button>
              </div>
            </div>
          )}

          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-3">Cerca tuyo</h3>
            <div className="space-y-3">
              {COURTS.map((c) => (
                <div key={c.id} className="flex gap-3 items-center">
                  <img src={c.image} alt={c.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.distanceKm} km · ${c.pricePerHour}/h</div>
                  </div>
                  <div className="text-xs text-warning flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning" />{c.rating}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${color}`} /> {label}
    </div>
  );
}

export { MapPage as component };

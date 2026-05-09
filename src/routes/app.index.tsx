import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ME, MATCHES, PLAYERS, COURTS, SPORTS } from "@/lib/mock";
import { Trophy, Flame, MapPin, Users, ArrowRight, Calendar, Star, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Inicio — SportMatch" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-card border border-border p-6 md:p-8 shadow-card relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative">
          <div>
            <div className="text-sm text-muted-foreground">Hola,</div>
            <h1 className="text-3xl md:text-4xl font-bold">{ME.name.split(" ")[0]} 👋</h1>
            <p className="text-muted-foreground mt-1">Tenés 3 partidos compatibles cerca tuyo hoy.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/app/match" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow">
                <Sparkles className="h-4 w-4" /> Encontrar partido
              </Link>
              <Link to="/app/courts" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass">
                <Calendar className="h-4 w-4" /> Reservar cancha
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[280px]">
            <Stat icon={<Trophy className="h-4 w-4 text-neon" />} label="FitCoins" value={ME.fitcoins} />
            <Stat icon={<Flame className="h-4 w-4 text-warning" />} label="Trust" value={`${ME.trustScore}%`} />
            <Stat icon={<Users className="h-4 w-4 text-electric" />} label="Partidos" value={ME.matches} />
          </div>
        </div>
      </div>

      {/* Sport chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4">
        {SPORTS.map((s) => (
          <button
            key={s.name}
            className="shrink-0 px-4 py-2 rounded-full glass text-sm hover:bg-accent flex items-center gap-2"
          >
            <span>{s.emoji}</span> {s.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommended matches */}
        <div className="lg:col-span-2 space-y-4">
          <PageHeader title="Partidos recomendados" subtitle="Curado por IA según tu nivel y horarios" />
          <div className="grid sm:grid-cols-2 gap-4">
            {MATCHES.map((m) => (
              <div key={m.id} className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card hover:ring-glow transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-violet/20 text-violet-foreground border border-violet/30">{m.sport}</span>
                  <span className="text-xs text-neon">{m.date}</span>
                </div>
                <h3 className="font-semibold">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {m.court}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Cupos</div>
                    <div className="text-sm font-semibold">{m.spots.taken}/{m.spots.total}</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-gradient-neon text-neon-foreground text-sm font-semibold">
                    Unirme
                  </button>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${(m.spots.taken / m.spots.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side */}
        <div className="space-y-6">
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Jugadores cerca</h3>
              <Link to="/app/match" className="text-xs text-neon flex items-center gap-1">Ver todos <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="space-y-3">
              {PLAYERS.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img src={p.avatar} alt="" className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sport} · {p.distanceKm} km</div>
                  </div>
                  <span className="text-xs text-neon flex items-center gap-1">
                    <Star className="h-3 w-3 fill-neon" /> {p.trustScore}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold mb-4">Canchas top</h3>
            <div className="space-y-3">
              {COURTS.slice(0, 3).map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.image} alt={c.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.sport} · ${c.pricePerHour}/h</div>
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
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

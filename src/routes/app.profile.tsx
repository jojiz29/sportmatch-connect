import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ME, MATCHES } from "@/lib/mock";
import { Edit3, MapPin, Trophy, Award, Shield, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Perfil — SportMatch" }] }),
  component: Profile,
});

function Profile() {
  const trustLevel = ME.trustScore >= 90 ? "Excelente" : ME.trustScore >= 70 ? "Bueno" : "Riesgoso";
  const trustColor = ME.trustScore >= 90 ? "text-neon" : ME.trustScore >= 70 ? "text-warning" : "text-destructive";

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Mi perfil" />

      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-primary opacity-15 blur-3xl" />
        <div className="flex flex-wrap items-center gap-6 relative">
          <div className="relative">
            <img src={ME.avatar} alt={ME.name} className="h-28 w-28 rounded-2xl bg-muted ring-4 ring-primary/30" />
            <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full bg-gradient-neon text-neon-foreground text-xs font-bold">{ME.level}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold">{ME.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ME.city} · {ME.age} años</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {ME.sports.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full bg-violet/20 text-sm border border-violet/30">{s}</span>
              ))}
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl glass flex items-center gap-2 text-sm">
            <Edit3 className="h-4 w-4" /> Editar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <Stat icon={<Trophy className="h-4 w-4 text-neon" />} label="FitCoins" value={ME.fitcoins} />
          <Stat icon={<TrendingUp className="h-4 w-4 text-electric" />} label="Partidos" value={ME.matches} />
          <Stat icon={<Award className="h-4 w-4 text-warning" />} label="Logros" value={ME.badges.length} />
          <Stat icon={<Shield className="h-4 w-4 text-neon" />} label="Trust Score" value={`${ME.trustScore}%`} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-neon" /> Trust Score</h3>
          <div className="mt-4 text-center">
            <div className="text-5xl font-bold text-gradient">{ME.trustScore}</div>
            <div className={`text-sm font-semibold mt-1 ${trustColor}`}>{trustLevel}</div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-neon" style={{ width: `${ME.trustScore}%` }} />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Metric label="Puntualidad" value={98} />
            <Metric label="Asistencia" value={94} />
            <Metric label="Cancelaciones" value={88} />
            <Metric label="Comportamiento" value={92} />
          </div>
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Logros desbloqueados</h3>
          <div className="grid grid-cols-2 gap-3">
            {ME.badges.map((b) => (
              <div key={b.id} className="text-center p-3 rounded-xl glass">
                <div className="text-3xl">{b.emoji}</div>
                <div className="text-xs mt-1 font-semibold">{b.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Historial reciente</h3>
          <div className="space-y-3">
            {MATCHES.map((m) => (
              <div key={m.id} className="flex items-center gap-3 text-sm">
                <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center text-xs font-bold">
                  {m.sport.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.date}</div>
                </div>
                <span className="text-xs text-neon">+{20 + Math.floor(Math.random() * 30)} FC</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

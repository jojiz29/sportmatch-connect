import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ME, LEADERBOARD } from "@/lib/mock";
import { Trophy, Gift, Zap, Crown } from "lucide-react";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({ meta: [{ title: "FitCoins — SportMatch" }] }),
  component: Wallet,
});

const REWARDS = [
  { id: "r1", name: "Hora gratis de pádel", cost: 500, emoji: "🏓" },
  { id: "r2", name: "Camiseta SportMatch", cost: 1200, emoji: "👕" },
  { id: "r3", name: "Sesión con entrenador", cost: 2000, emoji: "🏋️" },
  { id: "r4", name: "Pelota oficial", cost: 800, emoji: "⚽" },
];

const CHALLENGES = [
  { id: "ch1", name: "Jugá 3 partidos esta semana", progress: 2, total: 3, reward: 150 },
  { id: "ch2", name: "Mantené Trust Score > 90", progress: 93, total: 100, reward: 200 },
  { id: "ch3", name: "Invitá a 2 amigos", progress: 1, total: 2, reward: 300 },
];

function Wallet() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="FitCoins & Recompensas" subtitle="Tu economía deportiva gamificada" />

      <div className="bg-gradient-primary rounded-3xl p-8 shadow-glow relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-neon opacity-20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-sm text-white/80">Tu balance</div>
            <div className="text-6xl font-extrabold text-white flex items-center gap-3">
              {ME.fitcoins}
              <Trophy className="h-10 w-10 text-neon" />
            </div>
            <div className="text-sm text-white/80 mt-2">+185 esta semana ↗</div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm">Canjear</button>
            <button className="px-4 py-2 rounded-xl glass text-sm">Historial</button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-neon" /> Retos activos</h3>
            <div className="space-y-3">
              {CHALLENGES.map((c) => (
                <div key={c.id} className="bg-gradient-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-neon flex items-center gap-1"><Trophy className="h-3 w-3" /> +{c.reward}</div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-neon" style={{ width: `${(c.progress / c.total) * 100}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{c.progress} / {c.total}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Gift className="h-4 w-4 text-electric" /> Recompensas</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {REWARDS.map((r) => (
                <div key={r.id} className="bg-gradient-card border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="text-4xl">{r.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-neon">{r.cost} FC</div>
                  </div>
                  <button
                    disabled={ME.fitcoins < r.cost}
                    className="px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold disabled:opacity-40"
                  >
                    Canjear
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Crown className="h-4 w-4 text-warning" /> Ranking semanal</h3>
          <div className="bg-gradient-card border border-border rounded-2xl p-3 space-y-1">
            {LEADERBOARD.map((u) => {
              const me = u.name === ME.name;
              return (
                <div key={u.rank} className={`flex items-center gap-3 p-2 rounded-xl ${me ? "bg-gradient-primary/20 ring-1 ring-primary/40" : ""}`}>
                  <div className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold ${
                    u.rank === 1 ? "bg-warning text-black" : u.rank === 2 ? "bg-muted-foreground text-black" : u.rank === 3 ? "bg-amber-700 text-white" : "bg-muted"
                  }`}>{u.rank}</div>
                  <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{u.name}</div>
                  </div>
                  <div className="text-xs text-neon">{u.coins}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

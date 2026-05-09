import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { PLAYERS, type Player } from "@/lib/mock";
import { useState } from "react";
import { Heart, X, Star, MapPin, Sparkles, Filter } from "lucide-react";

export const Route = createFileRoute("/app/match")({
  head: () => ({ meta: [{ title: "Matchmaking — SportMatch" }] }),
  component: Match,
});

function Match() {
  const [stack, setStack] = useState<Player[]>(PLAYERS);
  const [liked, setLiked] = useState<Player[]>([]);

  const swipe = (dir: "like" | "pass") => {
    setStack((s) => {
      const [top, ...rest] = s;
      if (dir === "like" && top) setLiked((l) => [top, ...l]);
      return rest;
    });
  };

  const top = stack[0];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader
        title="Matchmaking IA"
        subtitle="Deslizá para encontrar tu próximo rival ideal"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex justify-center">
          <div className="relative w-full max-w-md h-[560px]">
            {stack.length === 0 ? (
              <div className="absolute inset-0 grid place-items-center bg-gradient-card border border-border rounded-3xl">
                <div className="text-center">
                  <Sparkles className="h-10 w-10 mx-auto text-neon mb-3" />
                  <div className="font-semibold">Sin más sugerencias</div>
                  <button onClick={() => setStack(PLAYERS)} className="mt-4 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">Recargar</button>
                </div>
              </div>
            ) : (
              stack.slice(0, 3).reverse().map((p, i, arr) => {
                const idx = arr.length - 1 - i;
                const isTop = idx === 0;
                return (
                  <div
                    key={p.id}
                    className="absolute inset-0 bg-gradient-card border border-border rounded-3xl shadow-card overflow-hidden transition-all"
                    style={{
                      transform: `translateY(${idx * 12}px) scale(${1 - idx * 0.03})`,
                      zIndex: 10 - idx,
                      opacity: 1 - idx * 0.1,
                    }}
                  >
                    <div className="relative h-2/3 bg-gradient-primary">
                      <img src={p.avatar} alt={p.name} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-2 py-1 rounded-full glass text-xs">{p.sport}</span>
                        <span className="px-2 py-1 rounded-full glass text-xs text-neon flex items-center gap-1"><Star className="h-3 w-3 fill-neon" /> {p.trustScore}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-2xl font-bold">{p.name}, {p.age}</h2>
                        <p className="text-xs text-white/80 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {p.distanceKm} km · {p.available}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-violet/20 text-violet-foreground border border-violet/30">{p.level}</span>
                        <span className="text-muted-foreground">{p.matches} partidos</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>
                      {isTop && (
                        <div className="mt-4 flex items-center justify-center gap-4">
                          <button onClick={() => swipe("pass")} className="h-14 w-14 rounded-full bg-card border border-border grid place-items-center hover:bg-destructive/20">
                            <X className="h-6 w-6 text-destructive" />
                          </button>
                          <button onClick={() => swipe("like")} className="h-16 w-16 rounded-full bg-gradient-neon grid place-items-center shadow-neon animate-pulse-ring">
                            <Heart className="h-7 w-7 text-neon-foreground fill-neon-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-neon" /> Compatibilidad IA</h3>
            {top && (
              <div className="mt-4 space-y-3">
                <Bar label="Nivel" value={88} />
                <Bar label="Horario" value={94} />
                <Bar label="Distancia" value={Math.max(40, 100 - top.distanceKm * 20)} />
                <Bar label="Reputación" value={top.trustScore} />
              </div>
            )}
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-3">Matches ({liked.length})</h3>
            {liked.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no diste like a nadie.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {liked.map((p) => (
                  <img key={p.id} src={p.avatar} alt={p.name} className="h-10 w-10 rounded-full ring-2 ring-neon" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

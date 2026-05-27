import { Link } from "@tanstack/react-router";
import { Heart, X, Star, MapPin, Sparkles } from "lucide-react";
import { useMatchmaking } from "./useMatchmaking";
import { User } from "@/entities/types";
import { motion, AnimatePresence } from "framer-motion";

export function MatchmakingFeature({ initialStack }: { initialStack: User[] }) {
  const { stack, isLoading, swipe } = useMatchmaking(initialStack);
  const top = stack[0];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex justify-center">
        <div className="relative w-full max-w-md h-[560px]">
          {isLoading ? (
            <div className="absolute inset-0 bg-muted animate-pulse rounded-3xl" />
          ) : stack.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center bg-gradient-card border border-border rounded-3xl">
              <div className="text-center">
                <Sparkles className="h-10 w-10 mx-auto text-neon mb-3" />
                <div className="font-semibold">Sin más sugerencias</div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {stack
                .slice(0, 3)
                .reverse()
                .map((p, i, arr) => {
                  const idx = arr.length - 1 - i;
                  const isTop = idx === 0;
                  return (
                    <motion.div
                      key={p.id}
                      drag={isTop ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={1}
                      onDragEnd={(e, info) => {
                        if (info.offset.x > 100) swipe(p.id, "like");
                        else if (info.offset.x < -100) swipe(p.id, "pass");
                      }}
                      className="absolute inset-0 bg-gradient-card border border-border rounded-3xl shadow-card overflow-hidden transition-all cursor-grab active:cursor-grabbing"
                      style={{
                        transform: `translateY(${idx * 12}px) scale(${1 - idx * 0.03})`,
                        zIndex: 10 - idx,
                        opacity: 1 - idx * 0.1,
                      }}
                      animate={isTop ? { x: 0, rotate: 0 } : undefined}
                      exit={{ x: isTop ? 200 : 0, opacity: 0, transition: { duration: 0.2 } }}
                      whileDrag={{ rotate: 5, scale: 1.05 }}
                    >
                      <div className="relative h-2/3 bg-gradient-primary">
                        <Link
                          to="/app/match/$userId"
                          params={{ userId: p.id }}
                          className="absolute inset-0 z-10"
                        >
                          <img
                            src={p.avatar_url}
                            alt={p.name}
                            className="w-full h-full object-cover opacity-90"
                          />
                        </Link>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-2 py-1 rounded-full glass text-xs">
                            {p.preferred_sports?.[0] || "Deporte"}
                          </span>
                          <span className="px-2 py-1 rounded-full glass text-xs text-neon flex items-center gap-1">
                            <Star className="h-3 w-3 fill-neon" /> {p.trust_score || 0}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h2 className="text-2xl font-bold">
                            {p.name || "Usuario"}, {p.age || "?"}
                          </h2>
                          <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {p.distance_km || 0} km
                          </p>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-violet/20 text-violet-foreground border border-violet/30">
                            {p.level}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>
                        {isTop && (
                          <div className="mt-4 flex items-center justify-center gap-4">
                            <button
                              onClick={() => swipe(p.id, "pass")}
                              className="h-14 w-14 rounded-full bg-card border border-border grid place-items-center hover:bg-destructive/20"
                            >
                              <X className="h-6 w-6 text-destructive" />
                            </button>
                            <button
                              onClick={() => swipe(p.id, "like")}
                              className="h-16 w-16 rounded-full bg-gradient-neon grid place-items-center shadow-neon animate-pulse-ring"
                            >
                              <Heart className="h-7 w-7 text-neon-foreground fill-neon-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neon" /> Compatibilidad IA
          </h3>
          {top && (
            <div className="mt-4 space-y-3">
              <Bar label="Nivel" value={88} />
              <Bar label="Horario" value={94} />
              <Bar label="Distancia" value={Math.max(40, 100 - (top.distance_km || 0) * 20)} />
              <Bar label="Reputación" value={top.trust_score} />
            </div>
          )}
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

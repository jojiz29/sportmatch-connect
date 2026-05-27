import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, MapPin, Users, Trophy, Activity, ArrowRight, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SportMatch — Encontrá con quién jugar, en minutos" },
      {
        name: "description",
        content:
          "Matchmaking inteligente, reservas, FitCoins y comunidad deportiva. Conectá con jugadores cerca tuyo.",
      },
      { property: "og:title", content: "SportMatch — Juega más, esperá menos" },
      {
        property: "og:description",
        content:
          "Encontrá rivales, reservá canchas y desbloqueá recompensas con tu nivel deportivo.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-gradient-hero overflow-x-hidden">
      <header className="container mx-auto flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">SportMatch</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how" className="hover:text-foreground">
            Cómo funciona
          </a>
          <a href="#stats" className="hover:text-foreground">
            Comunidad
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm px-3 py-2 rounded-lg hover:bg-accent">
            Ingresar
          </Link>
          <Link
            to="/app"
            className="text-sm px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground shadow-glow font-semibold"
          >
            Probar demo
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-4 pt-12 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-neon mb-6">
            <span className="h-2 w-2 rounded-full bg-neon animate-pulse-ring" /> Beta · 12.480
            jugadores
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Tu próximo <span className="text-gradient">partido</span>
            <br />
            está a un swipe.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Matchmaking inteligente para deportistas amateur. Encontrá gente compatible, reservá
            canchas y subí tu Trust Score con cada partido.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95"
            >
              Empezar a jugar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass font-semibold hover:bg-accent"
            >
              Crear cuenta
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" /> 4.9 · App Store
            </div>
            <div>· 200K+ partidos jugados</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
          <div className="relative grid grid-cols-2 gap-4">
            {[
              { icon: Users, t: "Matchmaking IA", d: "Compatibilidad por nivel y horario" },
              { icon: MapPin, t: "Mapa en vivo", d: "Canchas y partidos cerca tuyo" },
              { icon: Trophy, t: "FitCoins", d: "Ganá recompensas reales" },
              { icon: Activity, t: "Telemetría", d: "Conectá tu smartwatch" },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-gradient-card border border-border rounded-3xl p-5 shadow-card animate-float"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow mb-3">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="font-semibold">{f.t}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="stats" className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { k: "12.4K", l: "Jugadores activos" },
            { k: "850+", l: "Canchas conectadas" },
            { k: "200K", l: "Partidos jugados" },
            { k: "93%", l: "Match exitoso" },
          ].map((s) => (
            <div key={s.l} className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-gradient-neon">{s.k}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 SportMatch · Made for athletes
      </footer>
    </div>
  );
}

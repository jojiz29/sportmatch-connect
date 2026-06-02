import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap,
  MapPin,
  Users,
  Trophy,
  Activity,
  ArrowRight,
  Star,
  MessageSquare,
  DollarSign,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/api/supabase";
import { buttonVariants } from "@/shared/ui/button-variants";
import { WorldCupBackground } from "@/components/WorldCupBackground";

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
  const { t } = useTranslation();
  const [stats, setStats] = useState([
    { k: "12.4K", l: "Jugadores activos" },
    { k: "850+", l: "Canchas conectadas" },
    { k: "200K", l: "Partidos jugados" },
    { k: "93%", l: "Match exitoso" },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [playersRes, courtsRes, matchesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("user_role", "PLAYER"),
          supabase.from("courts").select("id", { count: "exact", head: true }),
          supabase.from("matches").select("id", { count: "exact", head: true }),
        ]);

        const playersCount = playersRes.count;
        const courtsCount = courtsRes.count;
        const matchesCount = matchesRes.count;

        setStats([
          {
            k: playersCount !== null && playersCount !== undefined ? `${playersCount}` : "12.4K",
            l: "Jugadores activos",
          },
          {
            k: courtsCount !== null && courtsCount !== undefined ? `${courtsCount}` : "850+",
            l: "Canchas conectadas",
          },
          {
            k: matchesCount !== null && matchesCount !== undefined ? `${matchesCount}` : "200K",
            l: "Partidos jugados",
          },
          { k: "93%", l: "Match exitoso" },
        ]);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Error loading landing stats:", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B132B] text-[#F5F7FA] overflow-x-hidden font-sans relative">
      {/* Premium World Cup Vector Curves & Glowing Waves */}
      <WorldCupBackground />

      {/* Header */}
      <header className="relative z-10 container mx-auto flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-5 w-5 text-[#0B132B]" />
          </div>
          <span className="font-extrabold text-xl tracking-wider text-white">SportMatch</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#B2B8C2]">
          <a href="#matchmaking" className="hover:text-[#39FF14] transition-colors">
            {t("landing.matchmaking_title")}
          </a>
          <a href="#squads" className="hover:text-[#39FF14] transition-colors">
            {t("landing.squads_title")}
          </a>
          <a href="#map" className="hover:text-[#39FF14] transition-colors">
            {t("landing.map_title")}
          </a>
          <a href="#challenges" className="hover:text-[#39FF14] transition-colors">
            {t("landing.challenges_title")}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " text-white border-white/10 hover:border-white/20"
            }
          >
            {t("login.title_signin")}
          </Link>
          <Link
            to="/demo"
            className={
              buttonVariants({ variant: "default", size: "sm" }) +
              " shadow-glow text-[#0B132B] font-bold"
            }
          >
            {t("login.btn_demo")}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#39FF14] mb-6 shadow-neon">
            <span className="h-2 w-2 rounded-full bg-[#39FF14] animate-pulse-ring" />
            Beta · Lima 2026 Active Venues Mapped
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
            Tu próximo <span className="text-gradient">partido</span>
            <br />
            está a un swipe.
          </h1>
          <p className="mt-6 text-lg text-[#B2B8C2] max-w-xl">
            Matchmaking inteligente para deportistas amateur. Encontrá gente compatible, reservá
            canchas y subí tu Trust Score con cada partido jugado en tu distrito.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            {/* Pulsing Electric Orange Action CTA Button */}
            <Link
              to="/demo"
              className="relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-primary text-[#0B132B] font-extrabold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span className="absolute -inset-1 rounded-2xl bg-[#FF6B35]/25 blur opacity-70 animate-pulse-ring pointer-events-none" />
              <span className="relative flex items-center gap-2">
                {t("landing.empezar")} <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold hover:bg-white/10 transition-all duration-300"
            >
              {t("landing.crear_cuenta")}
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-8 text-sm text-[#B2B8C2]">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-[#FFD60A] text-[#FFD60A]" />
              <span className="font-semibold text-white">4.9</span> · App Store
            </div>
            <div>
              <span className="font-semibold text-white">200K+</span> partidos jugados
            </div>
          </div>
        </div>

        {/* Feature Grid with hover motion */}
        <div className="relative">
          <div className="absolute -inset-10 bg-gradient-primary opacity-15 blur-3xl rounded-full" />
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
                  className="premium-card p-6 border border-white/10"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow mb-4">
                    <Icon className="h-5 w-5 text-[#0B132B]" />
                  </div>
                  <div className="font-bold text-white text-lg">{f.t}</div>
                  <div className="text-sm text-[#B2B8C2] mt-1.5 leading-relaxed">{f.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 1 (IA Matchmaking) */}
      <section
        id="matchmaking"
        className="relative z-10 py-24 bg-[#090F22]/80 border-y border-white/5"
      >
        <div className="container mx-auto px-4 text-center">
          <span className="text-sm font-extrabold text-[#39FF14] tracking-widest uppercase">
            {t("landing.features_title")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3">
            {t("landing.matchmaking_title")}
          </h2>
          <p className="mt-4 text-[#B2B8C2] max-w-2xl mx-auto text-lg">
            {t("landing.matchmaking_desc")}
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            {[
              {
                icon: MapPin,
                title: "Escaneo por Proximidad",
                desc: "Filtro georreferenciado integrado con PostGIS para listar complejos y retar a rivales en tu propio distrito.",
              },
              {
                icon: Activity,
                title: "Nivel Deportivo Justo",
                desc: "Algoritmo de nivelación que equilibra los partidos según tus estadísticas reales y telemetría de juego.",
              },
              {
                icon: Trophy,
                title: "Garantía de Trust Score",
                desc: "Sistema de confiabilidad para jugadores. Menos ausencias, más partidos de calidad garantizados.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="premium-card p-8 text-left hover:scale-[1.03] transition-all"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-6 shadow-neon">
                    <Icon className="h-6 w-6 text-[#39FF14]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-[#B2B8C2] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2 (Squads & Community) */}
      <section id="squads" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-extrabold text-[#39FF14] tracking-widest uppercase">
              {t("landing.squads_title")}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3">
              Pago Dividido y Chats de Squad
            </h2>
            <p className="mt-4 text-[#B2B8C2] text-lg">
              Coordina tus partidos grupales con herramientas integradas para automatizar cobros y
              comunicación.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card A: Split Billing Mockup */}
            <div className="premium-card p-8 flex flex-col justify-between hover:border-[#39FF14]/30 transition-all duration-300">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-6">
                  <DollarSign className="h-6 w-6 text-[#FF6B35]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t("landing.split_billing_title")}
                </h3>
                <p className="text-[#B2B8C2] text-sm leading-relaxed mb-6">
                  {t("landing.split_billing_desc")}
                </p>
              </div>

              {/* Receipt Visualizer mockup */}
              <div className="bg-[#0B132B]/80 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center text-xs text-[#B2B8C2] border-b border-white/5 pb-2">
                  <span>Alquiler Padel Center (1 Hr)</span>
                  <span className="text-white font-mono">60.00 FC</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      name: "Edwin Flores (Tú)",
                      cost: "-15.00 FC",
                      status: "Pago exitoso",
                      color: "text-[#39FF14]",
                    },
                    {
                      name: "Fabiola Rivas",
                      cost: "-15.00 FC",
                      status: "Pago exitoso",
                      color: "text-[#39FF14]",
                    },
                    {
                      name: "Erick Torres",
                      cost: "-15.00 FC",
                      status: "Pago exitoso",
                      color: "text-[#39FF14]",
                    },
                    {
                      name: "Juan Mendoza",
                      cost: "-15.00 FC",
                      status: "Pago exitoso",
                      color: "text-[#39FF14]",
                    },
                  ].map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-white/10 text-[9px] flex items-center justify-center font-bold text-white">
                          {p.name[0]}
                        </div>
                        <span className="text-white font-medium">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-white font-semibold block">{p.cost}</span>
                        <span className={`text-[9px] ${p.color} font-medium`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card B: Integrated Group Chat Mockup */}
            <div className="premium-card p-8 flex flex-col justify-between hover:border-[#39FF14]/30 transition-all duration-300">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-[#39FF14]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t("landing.group_chat_title")}
                </h3>
                <p className="text-[#B2B8C2] text-sm leading-relaxed mb-6">
                  {t("landing.group_chat_desc")}
                </p>
              </div>

              {/* Chat bubble mockup container */}
              <div className="bg-[#0B132B]/80 border border-white/10 rounded-2xl p-5 space-y-3 font-sans">
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-orange-500 text-[11px] font-bold text-white flex items-center justify-center">
                    F
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <span className="text-[10px] text-[#B2B8C2] font-semibold block mb-0.5">
                      Fabiola Rivas
                    </span>
                    <span className="text-xs text-white">
                      ¿Quién se anota para el jueves a las 8pm en Surco? 🎾
                    </span>
                  </div>
                </div>

                {/* Match proposal card trigger */}
                <div className="border border-[#FF6B35]/30 bg-[#FF6B35]/5 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                  <span className="text-[10px] font-extrabold text-[#FF6B35] uppercase tracking-wider">
                    Propuesta de Partido
                  </span>
                  <h4 className="text-xs font-bold text-white">Pádel Center Surco · 4 Jugadores</h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#B2B8C2]">
                    <Clock className="h-3.5 w-3.5" /> Jueves 18 Jun · 20:00
                  </div>
                  <button className="w-full mt-1.5 py-1.5 bg-[#FF6B35] text-[#0B132B] text-xs font-bold rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
                    UNIRSE AL PARTIDO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 (Map & PostGIS) */}
      <section id="map" className="relative z-10 py-24 bg-[#090F22]/80 border-y border-white/5">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-sm font-extrabold text-[#39FF14] tracking-widest uppercase">
                Ubicación Deportiva
              </span>
              <h2 className="text-4xl font-extrabold text-white mt-3 leading-tight">
                {t("landing.map_title")}
              </h2>
              <p className="mt-4 text-[#B2B8C2] text-sm leading-relaxed">{t("landing.map_desc")}</p>

              {/* District indicators pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["Santiago de Surco", "San Borja", "Miraflores", "Lince", "Magdalena"].map(
                  (d, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-medium"
                    >
                      {d}
                    </span>
                  ),
                )}
                <span className="text-xs px-3 py-1.5 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] font-bold">
                  +30 Distritos Mapeados
                </span>
              </div>
            </div>

            {/* Map Preview Grid */}
            <div className="lg:col-span-7">
              <div className="relative border border-white/10 rounded-3xl p-3 bg-[#0B132B] shadow-card overflow-hidden">
                <div className="absolute top-4 right-4 z-10 bg-[#0B132B]/90 border border-white/10 rounded-xl px-3 py-1 text-[11px] text-[#39FF14] font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] animate-ping" />
                  Visualizador Modo Noche
                </div>

                {/* Visual canvas representation of dark map */}
                <div className="h-64 rounded-2xl bg-[#090F22] relative flex items-center justify-center overflow-hidden border border-white/5">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

                  {/* Radial spotlight effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#39FF14]/5 rounded-full blur-3xl" />

                  {/* Mock map locations */}
                  {[
                    { name: "Pádel Center Surco", x: "35%", y: "45%" },
                    { name: "Tenis Club San Borja", x: "65%", y: "30%" },
                    { name: "Miraflores Complejo Sede 1", x: "48%", y: "70%" },
                  ].map((loc, idx) => (
                    <div
                      key={idx}
                      className="absolute flex flex-col items-center"
                      style={{ left: loc.x, top: loc.y }}
                    >
                      <div className="h-3 w-3 rounded-full bg-[#39FF14] animate-pulse relative">
                        <span className="absolute -inset-2 rounded-full bg-[#39FF14]/30 animate-ping" />
                      </div>
                      <span className="text-[9px] bg-[#0B132B] border border-white/10 px-1.5 py-0.5 rounded text-white mt-1 font-semibold whitespace-nowrap shadow">
                        {loc.name}
                      </span>
                    </div>
                  ))}
                  <div className="absolute text-center text-xs text-[#B2B8C2] bottom-4">
                    Visualización de Complejos Activos en Lima Metropolitana
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 (FitCoins & Health) */}
      <section id="challenges" className="relative z-10 py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-extrabold text-[#39FF14] tracking-widest uppercase">
              Gamificación
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3">
              {t("landing.challenges_title")}
            </h2>
            <p className="mt-4 text-[#B2B8C2] text-sm leading-relaxed">
              {t("landing.challenges_desc")}
            </p>
          </div>

          {/* Dashboard Panel Grid */}
          <div className="bg-[#121E3D]/50 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-card backdrop-blur-md">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <span className="text-xs text-[#B2B8C2] font-semibold uppercase tracking-wider block">
                  Panel de Retos
                </span>
                <span className="text-2xl font-bold text-white">Temporada Inicial 2026</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#B2B8C2]">Mi recompensa:</span>
                <span className="text-2xl font-extrabold text-[#FF6B35] font-mono">1,450 FC</span>
              </div>
            </div>

            {/* List of Challenges using the Status Colors */}
            <div className="space-y-4">
              {[
                {
                  title: t("landing.challenge_padel"),
                  points: "+300 FitCoins",
                  statusLabel: t("landing.status_seeking"),
                  statusColor: "bg-[#39FF14]/15 border-[#39FF14]/30 text-[#39FF14]", // Green seeking
                  progress: "2 / 3",
                  percent: "66%",
                },
                {
                  title: t("landing.challenge_squad"),
                  points: "+500 FitCoins",
                  statusLabel: t("landing.status_starting"),
                  statusColor: "bg-[#FFD60A]/15 border-[#FFD60A]/30 text-[#FFD60A]", // Yellow starting
                  progress: "0 / 1",
                  percent: "0%",
                },
                {
                  title: t("landing.challenge_cup"),
                  points: "+1,200 FitCoins",
                  statusLabel: t("landing.status_full"),
                  statusColor: "bg-[#FF3B30]/15 border-[#FF3B30]/30 text-[#FF3B30]", // Red full
                  progress: "1 / 1",
                  percent: "100%",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B132B] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${item.statusColor}`}
                      >
                        {item.statusLabel}
                      </span>
                      <h4 className="text-base font-bold text-white">{item.title}</h4>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${idx === 0 ? "bg-[#39FF14]" : idx === 1 ? "bg-[#FFD60A]/50" : "bg-[#FF3B30]"}`}
                        style={{ width: item.percent }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <span className="text-xs text-[#B2B8C2] font-semibold">
                      {item.progress} partidos
                    </span>
                    <span className="text-base font-mono font-bold text-[#FF6B35]">
                      {item.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="container mx-auto px-4 pb-20 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.l}
              className="glass rounded-2xl p-6 text-center border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="text-4xl font-extrabold text-gradient-neon font-mono">{s.k}</div>
              <div className="text-xs text-[#B2B8C2] mt-1.5 font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-sm text-[#B2B8C2]">
        <div className="flex justify-center gap-2 mb-4">
          <div className="h-6 w-6 rounded bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-3.5 w-3.5 text-[#0B132B]" />
          </div>
          <span className="font-bold text-white">SportMatch</span>
        </div>
        © 2026 SportMatch-Connect · Made for high-performance athletes
      </footer>
    </div>
  );
}

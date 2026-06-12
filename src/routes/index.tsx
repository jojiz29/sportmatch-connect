// === BLOQUE: IMPORTS — Dependencias de la landing page ===
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
  Check,
  ChevronRight,
  Coins,
  CheckCircle2,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/api/supabase";

import { useThemeStore } from "@/features/theme/store";

// === BLOQUE: Ruta raíz / — createFileRoute con meta tags SEO ===
// Incluye etiquetas head (title, description, Open Graph) para
// mejorar el SEO y la preview en redes sociales.
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

// === BLOQUE: Landing — Página principal con emulador de swipe interactivo ===
// Landing page con:
//   - Hero con emulador de swipe (Like/Dislike) y overlay de "It's a Match".
//   - Sección de features (Matchmaking IA, Mapa, FitCoins, Telemetría).
//   - Sección Squads con split billing interactivo y chat grupal mock.
//   - Sección Mapa con selector de distritos y venues geolocalizados.
//   - Sección Desafíos con retos gamificados y billetera FitCoins.
//   - Estadísticas en vivo desde Supabase (profiles, courts, matches).
function Landing() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const [stats, setStats] = useState([
    { k: "12.4K", l: "Jugadores activos" },
    { k: "850+", l: "Canchas conectadas" },
    { k: "200K", l: "Partidos jugados" },
    { k: "93%", l: "Match exitoso" },
  ]);

  const [fitcoins, setFitcoins] = useState(1450);

  // Estados del simulador de split billing
  const [totalBookingCost, setTotalBookingCost] = useState(60);
  const [squadMembers, setSquadMembers] = useState([
    { id: "edwin", name: "Edwin Flores (Tú)", initial: "E", checked: true },
    { id: "fabiola", name: "Fabiola Rivas", initial: "F", checked: true },
    { id: "erick", name: "Erick Torres", initial: "E", checked: true },
    { id: "juan", name: "Juan Mendoza", initial: "J", checked: true },
  ]);

  // Estados del selector de distritos y mapa
  const [selectedDistrict, setSelectedDistrict] = useState("Surco");
  const [bookingSuccessVenue, setBookingSuccessVenue] = useState<string | null>(null);

  // === BLOQUE: challenges — Retos gamificados de la landing ===
  const [challenges, setChallenges] = useState([
    {
      id: "padel",
      titleKey: "landing.challenge_padel",
      points: 300,
      statusKey: "landing.status_seeking",
      progress: 2,
      total: 3,
      claimed: false,
    },
    {
      id: "squad",
      titleKey: "landing.challenge_squad",
      points: 500,
      statusKey: "landing.status_starting",
      progress: 0,
      total: 1,
      claimed: false,
    },
    {
      id: "cup",
      titleKey: "landing.challenge_cup",
      points: 1200,
      statusKey: "landing.status_full",
      progress: 1,
      total: 1,
      claimed: false,
    },
  ]);

  // === BLOQUE: districtMapData — Datos mock de sedes por distrito ===
  // Cada distrito contiene venues con coordenadas relativas (x%, y%)
  // para posicionar marcadores en el mapa visual.
  const districtMapData: Record<
    string,
    {
      venues: { name: string; rating: number; courtsCount: number; x: string; y: string }[];
      centerLabel: string;
    }
  > = {
    Surco: {
      venues: [
        { name: "Pádel Center Surco", rating: 4.8, courtsCount: 2, x: "32%", y: "42%" },
        { name: "Complejo Deportivo El Polo", rating: 4.7, courtsCount: 1, x: "68%", y: "58%" },
        { name: "Planet Pádel Surco", rating: 4.6, courtsCount: 3, x: "42%", y: "24%" },
      ],
      centerLabel: "Santiago de Surco - Centro de Entrenamiento",
    },
    "San Borja": {
      venues: [
        { name: "Tenis Club San Borja", rating: 4.9, courtsCount: 3, x: "55%", y: "32%" },
        { name: "Polideportivo Limatambo", rating: 4.6, courtsCount: 4, x: "72%", y: "62%" },
        { name: "Complejo Deportivo San Borja", rating: 4.7, courtsCount: 2, x: "30%", y: "48%" },
      ],
      centerLabel: "San Borja - Hub Central",
    },
    Miraflores: {
      venues: [
        { name: "Miraflores Complejo Sede 1", rating: 4.8, courtsCount: 1, x: "48%", y: "68%" },
        { name: "Centro Promotor Miraflores", rating: 4.7, courtsCount: 2, x: "28%", y: "38%" },
        { name: "Club Las Terrazas Miraflores", rating: 4.9, courtsCount: 2, x: "62%", y: "50%" },
      ],
      centerLabel: "Miraflores - Costa Verde Sede",
    },
  };

  // === BLOQUE: handleAdvanceChallenge — Avanza el progreso de un reto ===
  const handleAdvanceChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id && c.progress < c.total) {
          return { ...c, progress: c.progress + 1 };
        }
        return c;
      }),
    );
  };

  // === BLOQUE: handleClaimChallenge — Reclama la recompensa de un reto completado ===
  // Suma los puntos a la billetera FitCoins y marca el reto como reclamado.
  const handleClaimChallenge = (id: string, points: number) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id && c.progress === c.total && !c.claimed) {
          setFitcoins((prevBalance) => prevBalance + points);
          return { ...c, claimed: true };
        }
        return c;
      }),
    );
  };

  // Cálculo del split billing: monto por miembro activo.
  const activeBillingCount = squadMembers.filter((m) => m.checked).length;
  const calculatedSplitShare = activeBillingCount > 0 ? totalBookingCost / activeBillingCount : 0;

  // === BLOQUE: useEffect — Fetch de estadísticas en vivo desde Supabase ===
  // Consulta los conteos reales de profiles (PLAYER), courts y matches.
  // Si falla o es null, mantiene los valores por defecto.
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

  // === BLOQUE: Renderizado — UI completa de la landing page ===
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative transition-colors duration-300">
      {/* === MONUMENTAL HERO: Fondo dinámico + CTA + Toggle de Tema === */}
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden w-full">
        {/* Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/sports/fondo_sportmatch.webp')" }}
        />
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background/95 backdrop-blur-[2px]" />

        {/* Dynamic Theme Toggle Button: Sleek, floating glassmorphic button in the top-right corner */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-foreground hover:bg-white/20 active:scale-95 transition-all text-xs font-bold cursor-pointer"
          >
            {theme === "world-cup" ? (
              <>
                <Moon className="h-4 w-4 text-primary" />
                <span>Cambiar Tema</span>
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 text-primary" />
                <span>Cambiar Tema</span>
              </>
            )}
          </button>
        </div>

        {/* Brand logo at top-left corner */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-2xl tracking-wide text-foreground">SportMatch</span>
        </div>

        {/* Content Container (z-10) */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center">
          {/* Main Title: Massive, bold font */}
          <h1 className="font-heading text-6xl sm:text-8xl md:text-9xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-white uppercase font-black drop-shadow-lg leading-none">
            SportMatch
          </h1>
          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Conecta con jugadores de tu nivel, reserva canchas en segundos, gana FitCoins y domina
            la cancha en tu distrito.
          </p>
          {/* Main CTA Button & Login link */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <Link
              to="/demo"
              className="bg-primary text-primary-foreground font-black px-10 py-4 rounded-full shadow-glow hover:scale-105 active:scale-95 transition-all text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <span>{t("landing.empezar")}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-full border border-border/40 bg-background/40 backdrop-blur-md text-foreground font-bold hover:bg-background/80 transition-all text-base text-center w-full sm:w-auto"
            >
              {t("login.title_signin")}
            </Link>
          </div>
        </div>
      </section>

      {/* === FEATURES: Grid de características principales === */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              t: "Matchmaking IA",
              d: "Algoritmo avanzado de compatibilidad por nivel deportivo, horarios y cercanía.",
            },
            {
              icon: MapPin,
              t: "Mapa de Reservas",
              d: "Sedes georreferenciadas mapeadas en tiempo real por proximidad.",
            },
            {
              icon: Trophy,
              t: "Recompensas FitCoins",
              d: "Superá desafíos y canjeá tus monedas por beneficios en complejos locales.",
            },
            {
              icon: Activity,
              t: "Telemetría Integrada",
              d: "Vinculá tus dispositivos wearables para registrar calorías y nivel de juego.",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="premium-card p-6 md:p-8 border border-white/10 flex flex-col justify-between hover:border-[#39FF14]/30 transition-all duration-300"
              >
                <div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow mb-6">
                    <Icon className="h-5 w-5 text-[#0B132B]" />
                  </div>
                  <h3 className="font-extrabold text-white text-lg sm:text-xl">{f.t}</h3>
                  <p className="text-sm text-[#B2B8C2] mt-3 leading-relaxed">{f.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* === SECCIÓN 1: Matchmaking IA === */}
      <section
        id="matchmaking"
        className="relative z-10 py-24 md:py-32 bg-[#090F22]/80 border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16 text-center">
          <span className="text-xs sm:text-sm font-extrabold text-[#39FF14] tracking-widest uppercase block mb-3">
            {t("landing.features_title")}
          </span>
          <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-white">
            {t("landing.matchmaking_title")}
          </h2>
          <p className="mt-6 text-[#B2B8C2] max-w-3xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed">
            {t("landing.matchmaking_desc")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-16 max-w-6xl mx-auto">
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
                  className="premium-card p-8 text-left hover:scale-[1.02] transition-all duration-300"
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

      {/* === SECCIÓN 2: Squads & Pago Dividido Interactivo === */}
      <section id="squads" className="relative z-10 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <span className="text-xs sm:text-sm font-extrabold text-[#39FF14] tracking-widest uppercase block mb-3">
              {t("landing.squads_title")}
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-white">
              Pago Dividido y Chats de Squad
            </h2>
            <p className="mt-6 text-[#B2B8C2] text-base sm:text-lg md:text-xl leading-relaxed">
              Coordina tus partidos grupales con herramientas integradas para automatizar cobros y
              comunicación.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Tarjeta A: Simulador interactivo de split billing */}
            <div className="lg:col-span-7 premium-card p-6 sm:p-8 flex flex-col justify-between border-2 border-white/5 hover:border-[#39FF14]/20 transition-all duration-300">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B35]/15 border border-[#FF6B35]/30 mb-6">
                  <DollarSign className="h-6 w-6 text-[#FF6B35]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t("landing.split_billing_title")}
                </h3>
                <p className="text-[#B2B8C2] text-sm leading-relaxed mb-6">
                  {t("landing.split_billing_desc")}
                </p>

                {/* Controles interactivos del split billing */}
                <div className="grid sm:grid-cols-2 gap-6 mb-6 pt-4 border-t border-white/5">
                  <div>
                    <label className="text-xs text-[#B2B8C2] font-bold uppercase tracking-wider block mb-2.5">
                      Costo Total de la Cancha
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[40, 60, 80, 100].map((val) => (
                        <button
                          key={val}
                          onClick={() => setTotalBookingCost(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                            totalBookingCost === val
                              ? "bg-[#FF6B35] text-[#0B132B] font-black shadow-glow"
                              : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {val} FC
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#B2B8C2] font-bold uppercase tracking-wider block mb-2.5">
                      Toggla Miembros Activos
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {squadMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => {
                            setSquadMembers((prev) =>
                              prev.map((m) =>
                                m.id === member.id ? { ...m, checked: !m.checked } : m,
                              ),
                            );
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border text-left truncate transition-all duration-200 ${
                            member.checked
                              ? "bg-[#39FF14]/15 border-[#39FF14]/40 text-[#39FF14]"
                              : "bg-white/5 border-white/5 text-white/55 hover:bg-white/10"
                          }`}
                        >
                          {member.checked ? "✓ " : "+ "}
                          {member.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visualizador de recibo simulado */}
              <div className="bg-[#0B132B]/90 border border-white/10 rounded-2xl p-5 space-y-4 shadow-inner mt-4">
                <div className="flex justify-between items-center text-xs text-[#B2B8C2] border-b border-white/5 pb-2">
                  <span className="font-semibold text-white">Alquiler de Cancha (Pádel Surco)</span>
                  <span className="text-[#FF6B35] font-mono font-bold">
                    {totalBookingCost.toFixed(2)} FC
                  </span>
                </div>
                <div className="space-y-3">
                  {squadMembers.map((p) => {
                    const share = p.checked ? calculatedSplitShare : 0;
                    return (
                      <div
                        key={p.id}
                        className={`flex justify-between items-center text-xs transition-all duration-300 ${
                          p.checked ? "opacity-100" : "opacity-35"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-6 w-6 rounded-full text-[10px] flex items-center justify-center font-bold text-[#0B132B] ${
                              p.checked ? "bg-[#39FF14]" : "bg-white/10 text-white"
                            }`}
                          >
                            {p.initial}
                          </div>
                          <span className="text-white font-medium">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold block ${p.checked ? "text-[#39FF14]" : "text-white/20"}`}
                          >
                            {p.checked ? `-${share.toFixed(2)} FC` : "0.00 FC"}
                          </span>
                          <span
                            className={`text-[9px] font-semibold tracking-wider uppercase ${p.checked ? "text-[#39FF14]" : "text-white/30"}`}
                          >
                            {p.checked ? "Pago exitoso" : "No incluido"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tarjeta B: Mockup de chat grupal */}
            <div className="lg:col-span-5 premium-card p-6 sm:p-8 flex flex-col justify-between border-2 border-white/5 hover:border-[#39FF14]/20 transition-all duration-300">
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

              {/* Burbujas de chat simuladas */}
              <div className="bg-[#0B132B]/80 border border-white/10 rounded-2xl p-5 space-y-3 font-sans mt-4">
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

                {/* Tarjeta de propuesta de partido */}
                <div className="border border-[#FF6B35]/30 bg-[#FF6B35]/5 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                  <span className="text-[10px] font-extrabold text-[#FF6B35] uppercase tracking-wider">
                    Propuesta de Partido
                  </span>
                  <h4 className="text-xs font-bold text-white">Pádel Center Surco · 4 Jugadores</h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#B2B8C2]">
                    <Clock className="h-3.5 w-3.5" /> Jueves 18 Jun · 20:00
                  </div>
                  <Link
                    to="/demo"
                    className="w-full mt-1.5 py-2 bg-[#FF6B35] text-[#0B132B] text-xs font-black rounded-lg text-center hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    UNIRSE AL PARTIDO
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === SECCIÓN 3: Mapa interactivo con distritos y venues === */}
      <section
        id="map"
        className="relative z-10 py-24 md:py-32 bg-[#090F22]/80 border-y border-y-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Columna de título y controles */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-xs sm:text-sm font-extrabold text-[#39FF14] tracking-widest uppercase block mb-3">
                Ubicación Deportiva
              </span>
              <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-white">
                {t("landing.map_title")}
              </h2>
              <p className="mt-6 text-[#B2B8C2] text-sm sm:text-base leading-relaxed">
                {t("landing.map_desc")}
              </p>

              {/* Píldoras interactivas de selección de distrito */}
              <div className="mt-8">
                <span className="text-xs text-white/50 uppercase tracking-widest font-black block mb-3">
                  Selecciona tu Hub Activo:
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Surco", "San Borja", "Miraflores"].map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setSelectedDistrict(dist)}
                      className={`text-xs px-4 py-2.5 rounded-xl font-bold border transition-all duration-200 cursor-pointer ${
                        selectedDistrict === dist
                          ? "bg-[#39FF14] text-[#0B132B] font-black border-[#39FF14] shadow-glow"
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      }`}
                    >
                      {dist === "Surco" ? "Santiago de Surco" : dist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de complejos en el distrito activo */}
              <div className="mt-8 space-y-3">
                <span className="text-xs text-[#B2B8C2] font-semibold uppercase tracking-wider block border-b border-white/5 pb-2">
                  Complejos en{" "}
                  {selectedDistrict === "Surco" ? "Santiago de Surco" : selectedDistrict} Mapeados:
                </span>
                <div className="space-y-2">
                  {districtMapData[selectedDistrict]?.venues.map((venue, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-200"
                    >
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white block">
                          {venue.name}
                        </span>
                        <span className="text-[10px] text-[#B2B8C2] flex items-center gap-1.5 mt-0.5">
                          <Star className="h-3 w-3 fill-[#FFD60A] text-[#FFD60A]" />
                          <span className="text-white font-semibold">{venue.rating}</span> ·{" "}
                          {venue.courtsCount} canchas disponibles
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setBookingSuccessVenue(venue.name);
                          setTimeout(() => setBookingSuccessVenue(null), 3000);
                        }}
                        className="px-3 py-1.5 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-bold rounded-lg hover:bg-[#39FF14] hover:text-[#0B132B] transition-all"
                      >
                        Reservar
                      </button>
                    </div>
                  ))}
                </div>

                {/* Feedback visual de reserva exitosa */}
                {bookingSuccessVenue && (
                  <div className="p-3 rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] text-xs font-bold flex items-center gap-2 animate-pulse mt-4">
                    <Check className="h-4 w-4" />
                    <span>
                      ¡Reserva simulada con éxito en <strong>{bookingSuccessVenue}</strong>!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* === Columna del mapa visual === */}
            <div className="lg:col-span-7 flex justify-center items-center w-full">
              <div className="w-full max-w-[550px] aspect-[4/3] relative border border-white/10 rounded-3xl p-3 bg-[#0B132B] shadow-card overflow-hidden">
                {/* Indicador GPS activo */}
                <div className="absolute top-4 right-4 z-10 bg-[#0B132B]/95 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-[#39FF14] font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#39FF14] animate-ping" />
                  Visualizador GPS Activo
                </div>

                {/* Mapa simulado con cuadrícula y radial spotlight */}
                <div className="w-full h-full rounded-2xl bg-[#090F22] relative flex items-center justify-center overflow-hidden border border-white/5">
                  {/* Cuadrícula de fondo */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

                  {/* Radial spotlight del distrito seleccionado */}
                  <div className="absolute w-[350px] h-[350px] bg-[#39FF14]/5 rounded-full blur-3xl transition-all duration-700 pointer-events-none" />

                  {/* Marcadores de venues posicionados según coordenadas del distrito */}
                  {districtMapData[selectedDistrict]?.venues.map((loc, idx) => (
                    <div
                      key={idx}
                      className="absolute flex flex-col items-center transition-all duration-700 ease-in-out"
                      style={{ left: loc.x, top: loc.y }}
                    >
                      {/* Pin de marcador con pulso */}
                      <div className="h-4.5 w-4.5 rounded-full bg-[#39FF14] border-2 border-[#090F22] flex items-center justify-center relative shadow-glow-neon">
                        <span className="absolute -inset-2.5 rounded-full bg-[#39FF14]/35 animate-ping" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                      <span className="text-[9px] bg-[#0B132B]/95 border border-white/10 px-2 py-0.5 rounded text-white mt-1.5 font-bold tracking-tight whitespace-nowrap shadow-lg">
                        {loc.name.split(" ")[0]} {loc.name.split(" ")[1] || ""}
                      </span>
                    </div>
                  ))}

                  {/* Info del centro del distrito */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#0B132B]/90 border border-white/5 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-[#B2B8C2] block uppercase tracking-widest font-bold">
                      {districtMapData[selectedDistrict]?.centerLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === SECCIÓN 4: FitCoins y Desafíos Gamificados === */}
      <section id="challenges" className="relative z-10 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <span className="text-xs sm:text-sm font-extrabold text-[#39FF14] tracking-widest uppercase block mb-3">
              Gamificación
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-white">
              {t("landing.challenges_title")}
            </h2>
            <p className="mt-6 text-[#B2B8C2] text-sm sm:text-base md:text-lg leading-relaxed">
              {t("landing.challenges_desc")}
            </p>
          </div>

          {/* Panel interactivo de retos */}
          <div className="bg-[#121E3D]/50 border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 max-w-4xl mx-auto shadow-card backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <span className="text-xs text-[#B2B8C2] font-semibold uppercase tracking-wider block">
                  Panel de Retos Activos
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
                  Temporada Inicial 2026
                </span>
              </div>
              {/* Billetera FitCoins */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#B2B8C2]">Mi Billetera:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#FF6B35] font-mono flex items-center gap-1.5 shadow-neon-amber/10">
                  <Coins className="h-6 w-6 text-[#FF6B35] animate-pulse" />
                  {fitcoins.toLocaleString()} FC
                </span>
              </div>
            </div>

            {/* Lista de retos */}
            <div className="space-y-4">
              {challenges.map((item) => {
                const isCompleted = item.progress === item.total;
                return (
                  <div
                    key={item.id}
                    className="bg-[#0B132B]/80 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 hover:border-white/10 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Badge de estado del reto */}
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            item.claimed
                              ? "bg-white/5 border-white/10 text-white/50"
                              : isCompleted
                                ? "bg-[#39FF14]/15 border-[#39FF14]/40 text-[#39FF14] animate-pulse"
                                : "bg-[#FFD60A]/15 border-[#FFD60A]/40 text-[#FFD60A]"
                          }`}
                        >
                          {item.claimed
                            ? t("landing.challenge_claimed")
                            : isCompleted
                              ? t("landing.challenge_ready")
                              : t("landing.challenge_progress")}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white">
                          {t(item.titleKey)}
                        </h4>
                      </div>

                      {/* Barra de progreso personalizada */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all duration-500 ${
                              item.claimed
                                ? "bg-white/20"
                                : isCompleted
                                  ? "bg-[#39FF14] shadow-glow"
                                  : "bg-[#FFD60A]"
                            }`}
                            style={{ width: `${(item.progress / item.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#B2B8C2] font-mono font-bold whitespace-nowrap">
                          {item.progress} / {item.total}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 md:border-none">
                      {/* Puntos del reto */}
                      <span className="text-base font-mono font-black text-[#FF6B35]">
                        +{item.points} FC
                      </span>

                      {/* Botones: Reclamar, Avanzar o Reclamado */}
                      {!item.claimed ? (
                        isCompleted ? (
                          <button
                            onClick={() => handleClaimChallenge(item.id, item.points)}
                            className="px-4 py-2 bg-[#39FF14] hover:bg-[#2bff00] text-[#0B132B] font-black text-xs rounded-xl shadow-glow transition-all active:scale-95 cursor-pointer"
                          >
                            Reclamar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdvanceChallenge(item.id)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <span>Avanzar</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )
                      ) : (
                        <span className="px-4 py-2 bg-white/5 border border-white/5 text-white/30 font-bold text-xs rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white/30" />
                          <span>Reclamado</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* === SECCIÓN DE ESTADÍSTICAS === */}
      <section id="stats" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s) => (
            <div
              key={s.l}
              className="glass rounded-2xl p-6 text-center border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-gradient-neon font-mono">
                {s.k}
              </div>
              <div className="text-[10px] sm:text-xs text-[#B2B8C2] mt-1.5 font-bold uppercase tracking-wider">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-white/5 py-12 text-center text-xs sm:text-sm text-[#B2B8C2] relative z-10">
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

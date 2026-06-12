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
  Sun,
  Heart,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/api/supabase";

import { useThemeStore } from "@/features/theme/store";
import { WorldCupBackground } from "@/components/WorldCupBackground";
import { buttonVariants } from "@/shared/ui/button-variants";

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

  // Estados de compatibilidad/swipe en hero
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const mockProfiles = [
    {
      name: "Fabiola Rivas",
      age: 24,
      sport: "Pádel",
      level: "Intermedio",
      district: "Surco",
      matchRate: "98% Match",
      imageColor: "from-primary to-primary/40",
      avatarText: "FR",
      bio: "Buscando dupla competitiva para el torneo de este fin de semana en Pádel Center. ¡Tengo buena volea!",
      trustScore: "99% Trust Score",
      tags: ["Puntual", "Buen nivel", "Gran compañera"],
      avatarUrl:
        "https://api.dicebear.com/7.x/adventurer/svg?seed=Fabiola&skinColor=f8d9b5&hair=long19&hairColor=2c2c2c",
    },
    {
      name: "Erick Torres",
      age: 28,
      sport: "Tenis",
      level: "Avanzado",
      district: "San Borja",
      matchRate: "95% Match",
      imageColor: "from-[#00E5FF] to-[#005F9E]",
      avatarText: "ET",
      bio: "Singles los martes y jueves por la noche. Busco peloteo intenso. Llevo bolas nuevas.",
      trustScore: "97% Trust Score",
      tags: ["Competitivo", "Bolas nuevas", "Puntual"],
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Erick",
    },
    {
      name: "Juan Mendoza",
      age: 31,
      sport: "Fútbol",
      level: "Medio",
      district: "Miraflores",
      matchRate: "92% Match",
      imageColor: "from-[#39FF14] to-[#007F5F]",
      avatarText: "JM",
      bio: "Falta un arquero o defensa para pichanga de 8 hoy a las 9pm en Sede 1. ¡Tercer tiempo asegurado!",
      trustScore: "95% Trust Score",
      tags: ["Recreativo", "Tercer tiempo", "Comprometido"],
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Juan",
    },
  ];

  const handleLike = () => {
    if (isTransitioning) return;
    setSwipeDirection("right");
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev + 1) % mockProfiles.length);
      setSwipeDirection(null);
      setIsTransitioning(false);
    }, 300);
  };

  const handleDislike = () => {
    if (isTransitioning) return;
    setSwipeDirection("left");
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveCardIndex((prev) => (prev + 1) % mockProfiles.length);
      setSwipeDirection(null);
      setIsTransitioning(false);
    }, 300);
  };

  const currentProfile = mockProfiles[activeCardIndex];

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
      <WorldCupBackground />

      {/* Header */}
      <header className="relative z-20 w-full bg-background/60 backdrop-blur-md border-b border-border/40 py-4 sm:py-6 px-4 md:px-8 xl:px-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-2xl sm:text-3xl tracking-wide text-foreground">
              SportMatch
            </span>
          </div>
          <nav className="hidden lg:flex items-center gap-6 xl:gap-10 text-xs xl:text-sm font-medium text-muted-foreground">
            <a
              href="#matchmaking"
              className="hover:text-primary transition-colors duration-200 relative text-center leading-tight max-w-[140px] flex items-center justify-center after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t("landing.matchmaking_title")}
            </a>
            <a
              href="#squads"
              className="hover:text-primary transition-colors duration-200 relative text-center leading-tight max-w-[140px] flex items-center justify-center after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t("landing.squads_title")}
            </a>
            <a
              href="#map"
              className="hover:text-primary transition-colors duration-200 relative text-center leading-tight max-w-[150px] flex items-center justify-center after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t("landing.map_title")}
            </a>
            <a
              href="#challenges"
              className="hover:text-primary transition-colors duration-200 relative text-center leading-tight max-w-[140px] flex items-center justify-center after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t("landing.challenges_title")}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) +
                " text-foreground border-border hover:border-primary/50 text-xs sm:text-sm"
              }
            >
              {t("login.title_signin")}
            </Link>
            <Link
              to="/demo"
              className={
                buttonVariants({ variant: "default", size: "sm" }) +
                " shadow-glow text-primary-foreground font-bold text-xs sm:text-sm"
              }
            >
              {t("login.btn_demo")}
            </Link>
            {/* Compact round theme toggle button in the header */}
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full border border-border/40 bg-background/50 hover:bg-accent/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-primary shrink-0"
              title={theme === "world-cup" ? "Cambiar a Neón Urbano" : "Cambiar a Copa del Mundo"}
            >
              {theme === "world-cup" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full pt-16 md:pt-24 lg:pt-32 pb-24 lg:pb-36 border-b border-border/20 overflow-hidden">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: "url('/images/sports/fondo_sportmatch.webp')" }}
        />
        {/* Glassmorphic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background/95 backdrop-blur-[2px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/50 border border-border/40 text-xs text-primary mb-8 w-fit shadow-glow">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              Beta · Lima 2026 Active Venues Mapped
            </span>
            <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl xl:text-9xl leading-[0.9] tracking-wide text-foreground animate-fade-in-up">
              Tu próximo
              <br />
              <span className="text-gradient text-glow">partido</span>
              <br />
              está a un swipe.
            </h1>
            <p className="mt-8 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Matchmaking inteligente para deportistas amateur. Encontrá gente compatible, reservá
              canchas y subí tu Trust Score con cada partido jugado en tu distrito.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 items-center">
              <Link
                to="/demo"
                className="relative inline-flex items-center gap-2 px-8 py-4.5 rounded-2xl bg-gradient-primary text-primary-foreground font-black text-base shadow-glow hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
              >
                <span className="absolute -inset-1 rounded-2xl bg-primary/25 blur opacity-75 animate-pulse pointer-events-none" />
                <span className="relative flex items-center gap-2">
                  {t("landing.empezar")} <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4.5 rounded-2xl border border-border/45 bg-background/50 backdrop-blur-md text-foreground font-bold text-base hover:bg-background/80 transition-all duration-300"
              >
                {t("landing.crear_cuenta")}
              </Link>
            </div>
            <div className="mt-14 flex items-center gap-8 text-sm sm:text-base text-muted-foreground animate-fade-in">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="font-bold text-foreground">4.9</span> · App Store
              </div>
              <div className="h-4 w-[1px] bg-border/30" />
              <div>
                <span className="font-bold text-foreground">200K+</span> partidos jugados
              </div>
            </div>
          </div>

          {/* Matchmaking Swipe Emulator inside Hero */}
          <div className="lg:col-span-5 xl:col-span-6 flex justify-center items-center w-full relative">
            <div className="absolute -inset-10 bg-gradient-primary opacity-15 blur-3xl rounded-full pointer-events-none" />

            {/* Main Phone Emulator Visual Frame */}
            <div className="relative w-full max-w-[380px] sm:max-w-[400px] aspect-[3/4.2] rounded-[36px] bg-gradient-to-b from-card/90 to-background/95 border-2 border-border/20 p-5 md:p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden">
              {/* Camera notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4.5 rounded-full bg-background border border-border/10 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2 animate-pulse" />
                <span className="w-10 h-1 rounded-full bg-white/10" />
              </div>

              {/* Profile Stack */}
              <div className="relative flex-1 mt-3 flex flex-col justify-between">
                {/* Back card decoration */}
                <div className="absolute inset-x-2 bottom-0 top-3 rounded-2xl bg-card/40 border border-border/10 transform translate-y-2.5 scale-95 pointer-events-none -z-10" />
                <div className="absolute inset-x-4 bottom-0 top-6 rounded-2xl bg-card/20 border border-border/10 transform translate-y-5 scale-90 pointer-events-none -z-20" />

                {/* Swipeable Card */}
                <div
                  className={`w-full h-full rounded-2xl bg-gradient-to-b from-card to-background border border-border/20 p-5 flex flex-col justify-between transition-all duration-300 transform shadow-xl relative overflow-hidden ${
                    isTransitioning
                      ? swipeDirection === "right"
                        ? "translate-x-full rotate-12 opacity-0"
                        : "-translate-x-full -rotate-12 opacity-0"
                      : "translate-x-0 rotate-0 opacity-100"
                  }`}
                >
                  {/* Compatibility Tag */}
                  <div className="flex justify-between items-center z-10">
                    <span className="px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider font-mono">
                      {currentProfile.matchRate}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-border/20 text-white text-[11px] font-semibold">
                      {currentProfile.trustScore}
                    </span>
                  </div>

                  {/* Avatar Area */}
                  <div className="flex justify-center items-center my-4 relative">
                    <div
                      className={`h-32 w-32 rounded-full bg-gradient-to-br ${currentProfile.imageColor} border-4 border-primary/20 p-1 flex items-center justify-center relative shadow-glow`}
                    >
                      {currentProfile.avatarUrl ? (
                        <img
                          src={currentProfile.avatarUrl}
                          alt={currentProfile.name}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-4xl font-black text-white">
                          {currentProfile.avatarText}
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-1 right-[35%] h-5 w-5 rounded-full bg-primary border-4 border-background flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Profile Info */}
                  <div className="space-y-2.5 z-10">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {currentProfile.name}
                      </h3>
                      <span className="text-sm font-bold text-muted-foreground">
                        {currentProfile.age} años
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-primary/15 border border-primary/30 text-primary text-xs font-extrabold uppercase">
                        {currentProfile.sport}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-border/20 text-white text-xs font-semibold">
                        {currentProfile.level}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-border/20 text-muted-foreground text-xs font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-white" />
                        {currentProfile.district}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic min-h-[40px]">
                      "{currentProfile.bio}"
                    </p>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentProfile.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-border/10 text-white/75 font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-center gap-6 mt-4 z-10">
                    <button
                      onClick={handleDislike}
                      disabled={isTransitioning}
                      className="h-12 w-12 rounded-full border border-border/40 bg-background/50 hover:bg-destructive/10 hover:border-destructive text-muted-foreground hover:text-destructive active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
                    >
                      <X className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleLike}
                      disabled={isTransitioning}
                      className="h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Heart className="h-7 w-7 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
                className="premium-card p-6 md:p-8 border border-border/40 flex flex-col justify-between hover:border-primary/30 transition-all duration-300"
              >
                <div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow mb-6">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-extrabold text-foreground text-lg sm:text-xl">{f.t}</h3>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* === SECCIÓN 1: Matchmaking IA === */}
      <section
        id="matchmaking"
        className="relative z-10 py-24 md:py-32 bg-card/80 border-y border-border/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16 text-center">
          <span className="text-xs sm:text-sm font-extrabold text-primary tracking-widest uppercase block mb-3">
            {t("landing.features_title")}
          </span>
          <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-foreground">
            {t("landing.matchmaking_title")}
          </h2>
          <p className="mt-6 text-muted-foreground max-w-3xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed">
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
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 border border-border/40 mb-6 shadow-glow">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
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
            <span className="text-xs sm:text-sm font-extrabold text-primary tracking-widest uppercase block mb-3">
              {t("landing.squads_title")}
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-foreground">
              Pago Dividido y Chats de Squad
            </h2>
            <p className="mt-6 text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed">
              Coordina tus partidos grupales con herramientas integradas para automatizar cobros y
              comunicación.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Tarjeta A: Simulador interactivo de split billing */}
            <div className="lg:col-span-7 premium-card p-6 sm:p-8 flex flex-col justify-between border-2 border-border/40 hover:border-primary/20 transition-all duration-300">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15 border border-secondary/30 mb-6">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {t("landing.split_billing_title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {t("landing.split_billing_desc")}
                </p>

                {/* Controles interactivos del split billing */}
                <div className="grid sm:grid-cols-2 gap-6 mb-6 pt-4 border-t border-border/40">
                  <div>
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider block mb-2.5">
                      Costo Total de la Cancha
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[40, 60, 80, 100].map((val) => (
                        <button
                          key={val}
                          onClick={() => setTotalBookingCost(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                            totalBookingCost === val
                              ? "bg-secondary text-secondary-foreground font-black shadow-glow"
                              : "bg-muted/40 border border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          {val} FC
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider block mb-2.5">
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
                              ? "bg-primary/15 border-primary/40 text-primary"
                              : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted"
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
              <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4 shadow-inner mt-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-border/40 pb-2">
                  <span className="font-semibold text-foreground">
                    Alquiler de Cancha (Pádel Surco)
                  </span>
                  <span className="text-secondary font-mono font-bold">
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
                            className={`h-6 w-6 rounded-full text-[10px] flex items-center justify-center font-bold text-primary-foreground ${
                              p.checked ? "bg-primary" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {p.initial}
                          </div>
                          <span className="text-foreground font-medium">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold block ${p.checked ? "text-primary" : "text-muted-foreground/30"}`}
                          >
                            {p.checked ? `-${share.toFixed(2)} FC` : "0.00 FC"}
                          </span>
                          <span
                            className={`text-[9px] font-semibold tracking-wider uppercase ${p.checked ? "text-primary" : "text-muted-foreground/35"}`}
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
            <div className="lg:col-span-5 premium-card p-6 sm:p-8 flex flex-col justify-between border-2 border-border/40 hover:border-primary/20 transition-all duration-300">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {t("landing.group_chat_title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {t("landing.group_chat_desc")}
                </p>
              </div>

              {/* Burbujas de chat simuladas */}
              <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3 font-sans mt-4">
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-orange-500 text-[11px] font-bold text-white flex items-center justify-center">
                    F
                  </div>
                  <div className="bg-muted/40 border border-border/20 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                      Fabiola Rivas
                    </span>
                    <span className="text-xs text-foreground">
                      ¿Quién se anota para el jueves a las 8pm en Surco? 🎾
                    </span>
                  </div>
                </div>

                {/* Tarjeta de propuesta de partido */}
                <div className="border border-secondary/30 bg-secondary/5 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                  <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">
                    Propuesta de Partido
                  </span>
                  <h4 className="text-xs font-bold text-foreground">
                    Pádel Center Surco · 4 Jugadores
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Jueves 18 Jun · 20:00
                  </div>
                  <Link
                    to="/demo"
                    className="w-full mt-1.5 py-2 bg-secondary text-secondary-foreground text-xs font-black rounded-lg text-center hover:scale-[1.02] active:scale-[0.98] transition-transform"
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
        className="relative z-10 py-24 md:py-32 bg-card/80 border-y border-border/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Columna de título y controles */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-xs sm:text-sm font-extrabold text-primary tracking-widest uppercase block mb-3">
                Ubicación Deportiva
              </span>
              <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-foreground">
                {t("landing.map_title")}
              </h2>
              <p className="mt-6 text-muted-foreground text-sm sm:text-base leading-relaxed">
                {t("landing.map_desc")}
              </p>

              {/* Píldoras interactivas de selección de distrito */}
              <div className="mt-8">
                <span className="text-xs text-foreground/50 uppercase tracking-widest font-black block mb-3">
                  Selecciona tu Hub Activo:
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Surco", "San Borja", "Miraflores"].map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setSelectedDistrict(dist)}
                      className={`text-xs px-4 py-2.5 rounded-xl font-bold border transition-all duration-200 cursor-pointer ${
                        selectedDistrict === dist
                          ? "bg-primary text-primary-foreground font-black border-primary shadow-glow"
                          : "bg-muted/40 border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {dist === "Surco" ? "Santiago de Surco" : dist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de complejos en el distrito activo */}
              <div className="mt-8 space-y-3">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block border-b border-border/40 pb-2">
                  Complejos en{" "}
                  {selectedDistrict === "Surco" ? "Santiago de Surco" : selectedDistrict} Mapeados:
                </span>
                <div className="space-y-2">
                  {districtMapData[selectedDistrict]?.venues.map((venue, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/20 hover:border-border/40 transition-all duration-200"
                    >
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-foreground block">
                          {venue.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="text-foreground font-semibold">
                            {venue.rating}
                          </span> · {venue.courtsCount} canchas disponibles
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setBookingSuccessVenue(venue.name);
                          setTimeout(() => setBookingSuccessVenue(null), 3000);
                        }}
                        className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        Reservar
                      </button>
                    </div>
                  ))}
                </div>

                {/* Feedback visual de reserva exitosa */}
                {bookingSuccessVenue && (
                  <div className="p-3 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-2 animate-pulse mt-4">
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
              <div className="w-full max-w-[550px] aspect-[4/3] relative border border-border/40 rounded-3xl p-3 bg-card shadow-card overflow-hidden">
                {/* Indicador GPS activo */}
                <div className="absolute top-4 right-4 z-10 bg-card/95 border border-border/40 rounded-xl px-3 py-1.5 text-[10px] text-primary font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  Visualizador GPS Activo
                </div>

                {/* Mapa simulado con cuadrícula y radial spotlight */}
                <div className="w-full h-full rounded-2xl bg-background relative flex items-center justify-center overflow-hidden border border-border/20">
                  {/* Cuadrícula de fondo */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

                  {/* Radial spotlight del distrito seleccionado */}
                  <div className="absolute w-[350px] h-[350px] bg-primary/5 rounded-full blur-3xl transition-all duration-700 pointer-events-none" />

                  {/* Marcadores de venues posicionados según coordenadas del distrito */}
                  {districtMapData[selectedDistrict]?.venues.map((loc, idx) => (
                    <div
                      key={idx}
                      className="absolute flex flex-col items-center transition-all duration-700 ease-in-out"
                      style={{ left: loc.x, top: loc.y }}
                    >
                      {/* Pin de marcador con pulso */}
                      <div className="h-4.5 w-4.5 rounded-full bg-primary border-2 border-background flex items-center justify-center relative shadow-glow">
                        <span className="absolute -inset-2.5 rounded-full bg-primary/35 animate-ping" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                      <span className="text-[9px] bg-card/95 border border-border/40 px-2 py-0.5 rounded text-foreground mt-1.5 font-bold tracking-tight whitespace-nowrap shadow-lg">
                        {loc.name.split(" ")[0]} {loc.name.split(" ")[1] || ""}
                      </span>
                    </div>
                  ))}

                  {/* Info del centro del distrito */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 bg-card/90 border border-border/20 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-muted-foreground block uppercase tracking-widest font-bold">
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
            <span className="text-xs sm:text-sm font-extrabold text-primary tracking-widest uppercase block mb-3">
              Gamificación
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-foreground">
              {t("landing.challenges_title")}
            </h2>
            <p className="mt-6 text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
              {t("landing.challenges_desc")}
            </p>
          </div>

          {/* Panel interactivo de retos */}
          <div className="bg-card/50 border border-border/40 rounded-3xl p-6 sm:p-8 md:p-10 max-w-4xl mx-auto shadow-card backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6 mb-6">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                  Panel de Retos Activos
                </span>
                <span className="text-xl sm:text-2xl font-bold text-foreground mt-1 block">
                  Temporada Inicial 2026
                </span>
              </div>
              {/* Billetera FitCoins */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Mi Billetera:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-secondary font-mono flex items-center gap-1.5 shadow-neon-amber/10">
                  <Coins className="h-6 w-6 text-secondary animate-pulse" />
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
                    className="bg-card/80 border border-border/20 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 hover:border-border/40 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Badge de estado del reto */}
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            item.claimed
                              ? "bg-muted border-border/20 text-muted-foreground/50"
                              : isCompleted
                                ? "bg-primary/15 border-primary/40 text-primary animate-pulse"
                                : "bg-warning/15 border-warning/40 text-warning"
                          }`}
                        >
                          {item.claimed
                            ? t("landing.challenge_claimed")
                            : isCompleted
                              ? t("landing.challenge_ready")
                              : t("landing.challenge_progress")}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-foreground">
                          {t(item.titleKey)}
                        </h4>
                      </div>

                      {/* Barra de progreso personalizada */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-muted h-2.5 rounded-full overflow-hidden border border-border/20">
                          <div
                            className={`h-full transition-all duration-500 ${
                              item.claimed
                                ? "bg-muted/40"
                                : isCompleted
                                  ? "bg-primary shadow-glow"
                                  : "bg-warning"
                            }`}
                            style={{ width: `${(item.progress / item.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono font-bold whitespace-nowrap">
                          {item.progress} / {item.total}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border/20 md:border-none">
                      {/* Puntos del reto */}
                      <span className="text-base font-mono font-black text-secondary">
                        +{item.points} FC
                      </span>

                      {/* Botones: Reclamar, Avanzar o Reclamado */}
                      {!item.claimed ? (
                        isCompleted ? (
                          <button
                            onClick={() => handleClaimChallenge(item.id, item.points)}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs rounded-xl shadow-glow transition-all active:scale-95 cursor-pointer"
                          >
                            Reclamar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdvanceChallenge(item.id)}
                            className="px-4 py-2 bg-muted/40 hover:bg-muted border border-border text-foreground font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <span>Avanzar</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )
                      ) : (
                        <span className="px-4 py-2 bg-muted border border-border/10 text-muted-foreground/30 font-bold text-xs rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/30" />
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
              className="glass rounded-2xl p-6 text-center border border-border/20 hover:border-border/40 transition-colors"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-gradient-neon font-mono">
                {s.k}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-border/40 py-12 text-center text-xs sm:text-sm text-muted-foreground relative z-10">
        <div className="flex justify-center gap-2 mb-4">
          <div className="h-6 w-6 rounded bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">SportMatch</span>
        </div>
        © 2026 SportMatch-Connect · Made for high-performance athletes
      </footer>
    </div>
  );
}

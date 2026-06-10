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
  Heart,
  X,
  Sparkles,
  Check,
  ChevronRight,
  Coins,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/shared/api/supabase";
import { buttonVariants } from "@/shared/ui/button-variants";
import { WorldCupBackground } from "@/components/WorldCupBackground";

interface SwipeProfile {
  name: string;
  age: number;
  sport: string;
  level: string;
  district: string;
  matchRate: string;
  imageColor: string;
  avatarText: string;
  bio: string;
  trustScore: string;
  tags: string[];
  avatarUrl: string;
}

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

  // Gamified states
  const [fitcoins, setFitcoins] = useState(1450);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<SwipeProfile | null>(null);

  // Split-billing states
  const [totalBookingCost, setTotalBookingCost] = useState(60);
  const [squadMembers, setSquadMembers] = useState([
    { id: "edwin", name: "Edwin Flores (Tú)", initial: "E", checked: true },
    { id: "fabiola", name: "Fabiola Rivas", initial: "F", checked: true },
    { id: "erick", name: "Erick Torres", initial: "E", checked: true },
    { id: "juan", name: "Juan Mendoza", initial: "J", checked: true },
  ]);

  // District selector / map states
  const [selectedDistrict, setSelectedDistrict] = useState("Surco");
  const [bookingSuccessVenue, setBookingSuccessVenue] = useState<string | null>(null);

  // Challenges states
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

  const mockProfiles = [
    {
      name: "Fabiola Rivas",
      age: 24,
      sport: "Pádel",
      level: "Intermedio",
      district: "Surco",
      matchRate: "98% Match",
      imageColor: "from-[#FF007F] to-[#7B2CBF]",
      avatarText: "FR",
      bio: "Buscando dupla competitiva para el torneo de este fin de semana en Pádel Center. ¡Tengo buena volea!",
      trustScore: "99% Trust Score",
      tags: ["Puntual", "Buen nivel", "Gran compañera"],
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Fabiola",
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

  const handleLike = () => {
    if (isTransitioning) return;
    setSwipeDirection("right");
    setIsTransitioning(true);
    setTimeout(() => {
      setMatchedProfile(mockProfiles[activeCardIndex]);
      setShowMatchOverlay(true);
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

  const activeBillingCount = squadMembers.filter((m) => m.checked).length;
  const calculatedSplitShare = activeBillingCount > 0 ? totalBookingCost / activeBillingCount : 0;

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

  const currentProfile = mockProfiles[activeCardIndex];

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
          <nav className="hidden lg:flex items-center gap-10 text-sm font-medium text-muted-foreground">
            <a
              href="#matchmaking"
              className="hover:text-primary transition-colors duration-200 relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t("landing.matchmaking_title")}
            </a>
            <a
              href="#squads"
              className="hover:text-primary transition-colors duration-200 relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t("landing.squads_title")}
            </a>
            <a
              href="#map"
              className="hover:text-primary transition-colors duration-200 relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {t("landing.map_title")}
            </a>
            <a
              href="#challenges"
              className="hover:text-primary transition-colors duration-200 relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16 pt-16 md:pt-24 lg:pt-32 pb-24 lg:pb-36 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background/50 border border-border/40 text-xs text-[#00e676] mb-8 w-fit shadow-neon">
            <span className="h-2 w-2 rounded-full bg-[#00e676] animate-ping" />
            Beta · Lima 2026 Active Venues Mapped
          </span>
          <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl xl:text-9xl leading-[0.9] tracking-wide text-foreground">
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
            {/* Pulsing Electric Orange Action CTA Button */}
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
          <div className="mt-14 flex items-center gap-8 text-sm sm:text-base text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-[#FFD60A] text-[#FFD60A]" />
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

          {/* Main Visual Frame representing a Phone Emulator */}
          <div className="relative w-full max-w-[380px] sm:max-w-[400px] aspect-[3/4.2] rounded-[36px] bg-gradient-to-b from-[#121E3D]/90 to-[#090F22]/95 border-2 border-white/10 p-5 md:p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden">
            {/* Camera speaker mock notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4.5 rounded-full bg-[#0B132B] border border-white/5 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500/80 mr-2" />
              <span className="w-10 h-1 rounded-full bg-white/10" />
            </div>

            {/* Profile Stack */}
            <div className="relative flex-1 mt-3 flex flex-col justify-between">
              {/* Back Card Decoration (Depth Factor) */}
              <div className="absolute inset-x-2 bottom-0 top-3 rounded-2xl bg-white/5 border border-white/5 transform translate-y-2.5 scale-95 pointer-events-none -z-10" />
              <div className="absolute inset-x-4 bottom-0 top-6 rounded-2xl bg-white/5 border border-white/5 transform translate-y-5 scale-90 pointer-events-none -z-20" />

              {/* Main Swipeable Card */}
              <div
                className={`w-full h-full rounded-2xl bg-gradient-to-b from-[#1A2544] to-[#0D152D] border border-white/10 p-5 flex flex-col justify-between transition-all duration-300 transform shadow-xl relative overflow-hidden ${
                  isTransitioning
                    ? swipeDirection === "right"
                      ? "translate-x-full rotate-12 opacity-0"
                      : "-translate-x-full -rotate-12 opacity-0"
                    : "translate-x-0 rotate-0 opacity-100"
                }`}
              >
                {/* Visual Compatibility Tag */}
                <div className="flex justify-between items-center z-10">
                  <span className="px-3 py-1 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] text-xs font-black uppercase tracking-wider font-mono">
                    {currentProfile.matchRate}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white text-[11px] font-semibold">
                    {currentProfile.trustScore}
                  </span>
                </div>

                {/* Avatar Visual Design */}
                <div className="flex justify-center items-center my-4 relative">
                  <div
                    className={`h-32 w-32 rounded-full bg-gradient-to-br ${currentProfile.imageColor} border-4 border-[#39FF14]/20 p-1 flex items-center justify-center relative shadow-glow-neon`}
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
                  {/* Small floating activity ring */}
                  <span className="absolute bottom-1 right-[35%] h-5 w-5 rounded-full bg-[#39FF14] border-4 border-[#0B132B] flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  </span>
                </div>

                {/* Profile Information */}
                <div className="space-y-2.5 z-10">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {currentProfile.name}
                    </h3>
                    <span className="text-sm font-bold text-[#B2B8C2]">
                      {currentProfile.age} años
                    </span>
                  </div>

                  {/* Sports details badge */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] text-xs font-extrabold uppercase">
                      {currentProfile.sport}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white text-xs font-semibold">
                      {currentProfile.level}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[#B2B8C2] text-xs font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-white" />
                      {currentProfile.district}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#B2B8C2] leading-relaxed italic min-h-[40px]">
                    "{currentProfile.bio}"
                  </p>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentProfile.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white/75 font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Control Buttons */}
            <div className="flex items-center justify-center gap-5 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={handleDislike}
                disabled={isTransitioning}
                className="h-14 w-14 rounded-full border border-red-500/30 bg-red-500/5 hover:bg-red-500/20 active:scale-90 text-red-500 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:shadow-red-500/10"
                aria-label="Dislike"
              >
                <X className="h-6 w-6" />
              </button>

              <Link
                to="/demo"
                className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-[#B2B8C2] flex items-center justify-center transition-all duration-200"
                title="Ver Perfil Detallado"
              >
                <Info className="h-5 w-5 text-white/80" />
              </Link>

              <button
                onClick={handleLike}
                disabled={isTransitioning}
                className="h-14 w-14 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/5 hover:bg-[#39FF14]/20 active:scale-90 text-[#39FF14] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[#39FF14]/10"
                aria-label="Like"
              >
                <Heart className="h-6 w-6 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature stats Grid */}
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

      {/* Section 1 (IA Matchmaking) */}
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

      {/* Section 2 (Squads & Community with Interactive Split Billing) */}
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
            {/* Card A: Interactive Split Billing Simulator */}
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

                {/* INTERACTIVE CONTROLS */}
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

              {/* Receipt Visualizer mockup */}
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

            {/* Card B: Integrated Group Chat Mockup */}
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

              {/* Chat bubble mockup container */}
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

                {/* Match proposal card trigger */}
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

      {/* Section 3 (Map & Interactive Districts Coord Mock) */}
      <section
        id="map"
        className="relative z-10 py-24 md:py-32 bg-[#090F22]/80 border-y border-y-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 xl:px-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Title Column */}
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

              {/* District indicators interactive pills */}
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

              {/* List of active complexes in active district */}
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

            {/* Map Preview Grid Column */}
            <div className="lg:col-span-7 flex justify-center items-center w-full">
              <div className="w-full max-w-[550px] aspect-[4/3] relative border border-white/10 rounded-3xl p-3 bg-[#0B132B] shadow-card overflow-hidden">
                <div className="absolute top-4 right-4 z-10 bg-[#0B132B]/95 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-[#39FF14] font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#39FF14] animate-ping" />
                  Visualizador GPS Activo
                </div>

                {/* Dark style mockup map */}
                <div className="w-full h-full rounded-2xl bg-[#090F22] relative flex items-center justify-center overflow-hidden border border-white/5">
                  {/* Grid overlay lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

                  {/* Radial Spotlight around selected district */}
                  <div className="absolute w-[350px] h-[350px] bg-[#39FF14]/5 rounded-full blur-3xl transition-all duration-700 pointer-events-none" />

                  {/* Markers rendering according to selected district coordinates */}
                  {districtMapData[selectedDistrict]?.venues.map((loc, idx) => (
                    <div
                      key={idx}
                      className="absolute flex flex-col items-center transition-all duration-700 ease-in-out"
                      style={{ left: loc.x, top: loc.y }}
                    >
                      {/* Pulsing spot mark */}
                      <div className="h-4.5 w-4.5 rounded-full bg-[#39FF14] border-2 border-[#090F22] flex items-center justify-center relative shadow-glow-neon">
                        <span className="absolute -inset-2.5 rounded-full bg-[#39FF14]/35 animate-ping" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                      <span className="text-[9px] bg-[#0B132B]/95 border border-white/10 px-2 py-0.5 rounded text-white mt-1.5 font-bold tracking-tight whitespace-nowrap shadow-lg">
                        {loc.name.split(" ")[0]} {loc.name.split(" ")[1] || ""}
                      </span>
                    </div>
                  ))}

                  {/* Centered locator info */}
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

      {/* Section 4 (FitCoins & Gamified Challenges) */}
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

          {/* Interactive challenges panel */}
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
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#B2B8C2]">Mi Billetera:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#FF6B35] font-mono flex items-center gap-1.5 shadow-neon-amber/10">
                  <Coins className="h-6 w-6 text-[#FF6B35] animate-pulse" />
                  {fitcoins.toLocaleString()} FC
                </span>
              </div>
            </div>

            {/* Challenges list */}
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

                      {/* Custom styled progress bars */}
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
                      <span className="text-base font-mono font-black text-[#FF6B35]">
                        +{item.points} FC
                      </span>

                      {/* Claim or Advance Buttons */}
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

      {/* Stats Section */}
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

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-xs sm:text-sm text-[#B2B8C2] relative z-10">
        <div className="flex justify-center gap-2 mb-4">
          <div className="h-6 w-6 rounded bg-gradient-primary grid place-items-center shadow-glow">
            <Zap className="h-3.5 w-3.5 text-[#0B132B]" />
          </div>
          <span className="font-bold text-white">SportMatch</span>
        </div>
        © 2026 SportMatch-Connect · Made for high-performance athletes
      </footer>

      {/* Match Notification Overlay Overlay Portal State */}
      {showMatchOverlay && matchedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/85 backdrop-blur-md p-4 transition-all duration-300">
          <div className="relative max-w-md w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#121E3D] to-[#090F22] border-2 border-[#39FF14]/50 shadow-neon-green text-center overflow-hidden">
            {/* Dynamic visual neon lights */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#39FF14]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#FF6B35]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 mb-5 animate-bounce">
                <Sparkles className="h-8 w-8 text-[#39FF14]" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {t("matchmaking.its_a_match", "¡Es un Match! 🎉")}
              </h3>
              <p className="mt-3 text-sm text-[#B2B8C2]">
                A ti y a <strong className="text-white">{matchedProfile.name}</strong> les interesa
                el <strong className="text-[#39FF14]">{matchedProfile.sport}</strong>. ¡Empiecen a
                chatear ahora!
              </p>

              {/* Match Face Off Avatars */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 my-8 relative">
                <div className="relative">
                  <div className="h-16 sm:h-20 w-16 sm:w-20 rounded-full border-4 border-[#39FF14] overflow-hidden bg-gradient-to-br from-[#FF6B35] to-[#FF8C00] flex items-center justify-center shadow-lg">
                    <span className="text-xl sm:text-2xl font-black text-white">EF</span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#39FF14] text-[#0B132B] text-[8px] font-black uppercase">
                    Tú
                  </span>
                </div>

                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="text-white font-extrabold text-xs">VS</span>
                </div>

                <div className="relative">
                  <div
                    className={`h-16 sm:h-20 w-16 sm:w-20 rounded-full border-4 border-[#39FF14] overflow-hidden bg-gradient-to-br ${matchedProfile.imageColor} flex items-center justify-center shadow-lg`}
                  >
                    {matchedProfile.avatarUrl ? (
                      <img
                        src={matchedProfile.avatarUrl}
                        alt={matchedProfile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {matchedProfile.avatarText}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#39FF14] text-[#0B132B] text-[8px] font-black uppercase">
                    {matchedProfile.level}
                  </span>
                </div>
              </div>

              {/* Form buttons */}
              <div className="space-y-3">
                <Link
                  to="/demo"
                  className="w-full py-3.5 bg-[#39FF14] hover:bg-[#2bff00] text-[#0B132B] font-black text-sm rounded-2xl shadow-glow transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  {t("matchmaking.send_message", "Enviar Mensaje")}
                </Link>
                <button
                  onClick={() => {
                    setShowMatchOverlay(false);
                    setMatchedProfile(null);
                  }}
                  className="w-full py-3.5 border border-white/10 hover:bg-white/5 text-white font-bold text-sm rounded-2xl transition-all duration-200"
                >
                  {t("matchmaking.keep_swiping", "Seguir Deslizando")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

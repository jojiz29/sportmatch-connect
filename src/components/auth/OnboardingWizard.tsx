// === BLOQUE: IMPORTACIONES ===
// Dependencias: estado local (useState), iconos Lucide, internacionalización (react-i18next) y tipos de preferencias deportivas
import { useState } from "react";
import { Check, Zap, Award, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SportPreferences } from "@/entities/types";

// === BLOQUE: INTERFAZ DE PROPS ===
// Recibe callbacks para completar el onboarding (con datos de preferencias) o retroceder al paso anterior
interface OnboardingWizardProps {
  onComplete: (data: SportPreferences) => void;
  onBack: () => void;
}

// === BLOQUE: INTERFAZ INTERNA DE TARJETA DE DEPORTE ===
// Define la estructura de datos para cada deporte en el catálogo local del wizard
interface SportCardData {
  id: string;
  name: string;
  emoji: string;
  category: "traditional" | "esports";
  styleClass: string;
  description: string;
  isExtra?: boolean;
}

// === BLOQUE: COMPONENTE PRINCIPAL DEL ONBOARDING WIZARD ===
// Flujo de 2 pasos: (1) selección de disciplinas deportivas con niveles, (2) ajuste de horas semanales de dedicación
// Incluye catálogo de 36 deportes (18 tradicionales + 18 e-sports) con selección por clics y acordeones expandibles
export function OnboardingWizard({ onComplete, onBack }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);

  // === BLOQUE: ESTADO DE MATRIZ DE DEPORTES ===
  // Almacena por cada deporte seleccionado su nivel (Amateur/Intermediate/Advanced/Pro) y peso numérico
  const [sportsMatrix, setSportsMatrix] = useState<
    Record<string, { level: "Amateur" | "Intermediate" | "Advanced" | "Pro"; weight: number }>
  >({});

  // Estados de expansión de acordeones para categorías "Ver más"
  const [isTraditionalExpanded, setIsTraditionalExpanded] = useState(false);
  const [isEsportsExpanded, setIsEsportsExpanded] = useState(false);

  // Estado del Paso 2: horas semanales de dedicación deportiva
  const [weeklyHours, setWeeklyHours] = useState<number>(6);

  // === BLOQUE: CATÁLOGO DE DEPORTES ===
  // 36 deportes divididos en 18 tradicionales y 18 e-sports, cada uno con 6 base + 12 extra (cola larga)
  const sportsData: SportCardData[] = [
    // --- DEPORTES TRADICIONALES ---
    // Base (6 tarjetas para cuadrícula 3x2)
    {
      id: "Fútbol",
      name: t("sports.futbol.name", "Fútbol"),
      emoji: "⚽🏃",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-emerald-800 via-emerald-950 to-green-950 border-emerald-500/30 relative",
      description: t("sports.futbol.desc", "Tradición y pasión en césped real o sintético."),
    },
    {
      id: "Vóley",
      name: t("sports.voley.name", "Vóley"),
      emoji: "🏐🏐",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-amber-700 via-yellow-800 to-amber-950 border-amber-500/30 relative",
      description: t("sports.voley.desc", "Juego de equipo y saltos en coliseo cerrado."),
    },
    {
      id: "Pádel",
      name: t("sports.padel.name", "Pádel"),
      emoji: "🎾🧱",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-950 border-cyan-500/30 relative",
      description: t("sports.padel.desc", "Paredes y malla metálica en la disciplina de moda."),
    },
    {
      id: "Básquet",
      name: t("sports.basquet.name", "Básquet"),
      emoji: "🏀🦘",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-orange-800 via-orange-950 to-red-950 border-orange-500/30 relative",
      description: t("sports.basquet.desc", "Aro y rebote rápido sobre el tabloncillo."),
    },
    {
      id: "Tenis",
      name: t("sports.tenis.name", "Tenis"),
      emoji: "🎾🎾",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-red-800 via-red-950 to-orange-950 border-red-500/30 relative",
      description: t("sports.tenis.desc", "Duelo estratégico en cancha clásica de arcilla."),
    },
    {
      id: "Running",
      name: t("sports.running.name", "Running / Atletismo"),
      emoji: "🏃💨",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-orange-700 via-red-800 to-amber-950 border-orange-500/30 relative",
      description: t("sports.running.desc", "Carreras, sprints y fondo en pista de atletismo."),
    },
    // Cola larga extra (12 tarjetas para completar 18 deportes tradicionales)
    {
      id: "Rugby",
      name: t("sports.rugby.name", "Rugby"),
      emoji: "🏉💪",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-lime-900 via-green-950 to-emerald-950 border-lime-500/30 relative",
      description: t("sports.rugby.desc", "Contacto, fuerza y juego en equipo."),
      isExtra: true,
    },
    {
      id: "Natación",
      name: t("sports.natacion.name", "Natación"),
      emoji: "🏊🌊",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-950 border-cyan-500/30 relative",
      description: t("sports.natacion.desc", "Resistencia y velocidad en piscina olímpica."),
      isExtra: true,
    },
    {
      id: "Gimnasio",
      name: t("sports.gimnasio.name", "Gimnasio / Crossfit"),
      emoji: "🏋️🏋️",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-zinc-800 via-stone-900 to-neutral-950 border-stone-500/30 relative",
      description: t("sports.gimnasio.desc", "Entrenamiento funcional de alta intensidad."),
      isExtra: true,
    },
    {
      id: "Calistenia",
      name: t("sports.calistenia.name", "Calistenia"),
      emoji: "🤸🤸",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-teal-900 via-emerald-950 to-green-950 border-teal-500/30 relative",
      description: t("sports.calistenia.desc", "Dominio corporal y fuerza estática al aire libre."),
      isExtra: true,
    },
    {
      id: "Tenis de Mesa",
      name: t("sports.tenis_mesa.name", "Tenis de Mesa"),
      emoji: "🏓⚪",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-emerald-800 via-teal-900 to-green-950 border-emerald-500/30 relative",
      description: t("sports.tenis_mesa.desc", "Velocidad, reflejos y precisión milimétrica."),
      isExtra: true,
    },
    {
      id: "Boxeo / MMA",
      name: t("sports.boxeo_mma.name", "Boxeo / MMA"),
      emoji: "🥊🥋",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-red-900 via-stone-900 to-neutral-950 border-red-500/30 relative",
      description: t(
        "sports.boxeo_mma.desc",
        "Combate de pie, sumisiones y acondicionamiento total.",
      ),
      isExtra: true,
    },
    {
      id: "Ciclismo",
      name: t("sports.ciclismo.name", "Ciclismo"),
      emoji: "🚴💨",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-teal-800 via-cyan-950 to-slate-950 border-teal-500/30 relative",
      description: t("sports.ciclismo.desc", "Rutas urbanas, de montaña o velocidad en pista."),
      isExtra: true,
    },
    {
      id: "Fútbol Americano",
      name: t("sports.futbol_americano.name", "Fútbol Americano"),
      emoji: "🏈🏟",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-emerald-900 via-stone-950 to-neutral-950 border-emerald-500/30 relative",
      description: t("sports.futbol_americano.desc", "Estrategia de yardas, pases y contacto."),
      isExtra: true,
    },
    {
      id: "Béisbol",
      name: t("sports.beisbol.name", "Béisbol"),
      emoji: "⚾🦇",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-slate-700 via-zinc-800 to-stone-950 border-zinc-500/30 relative",
      description: t(
        "sports.beisbol.desc",
        "Lanzamientos, bateos potentes y carreras por las bases.",
      ),
      isExtra: true,
    },
    {
      id: "Skateboarding",
      name: t("sports.skateboarding.name", "Skateboarding"),
      emoji: "🛹🛹",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-rose-900 via-neutral-900 to-zinc-950 border-rose-500/30 relative",
      description: t("sports.skateboarding.desc", "Trucos callejeros, rampas y freestyle urbano."),
      isExtra: true,
    },
    {
      id: "Golf",
      name: t("sports.golf.name", "Golf"),
      emoji: "⛳🏌️",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-green-800 via-emerald-900 to-slate-950 border-green-500/30 relative",
      description: t("sports.golf.desc", "Precisión, estrategia y concentración en el green."),
      isExtra: true,
    },
    {
      id: "Automovilismo",
      name: t("sports.automovilismo.name", "Automovilismo"),
      emoji: "🏎️🏁",
      category: "traditional",
      styleClass:
        "bg-gradient-to-br from-gray-800 via-stone-900 to-slate-950 border-gray-500/30 relative",
      description: t("sports.automovilismo.desc", "Velocidad sobre ruedas, karts y carreras."),
      isExtra: true,
    },
    // --- E-SPORTS & GAMING ---
    // Base (6 tarjetas)
    {
      id: "EA Sports FC",
      name: t("sports.ea_fc.name", "EA Sports FC"),
      emoji: "🎮⚽",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 border-yellow-500/30 shadow-[inset_0_0_10px_rgba(234,179,8,0.15)] relative",
      description: t("sports.ea_fc.desc", "Simulador virtual de fútbol de élite."),
    },
    {
      id: "League of Legends",
      name: t("sports.lol.name", "League of Legends"),
      emoji: "🧙⚔",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-purple-500/30 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)] relative",
      description: t("sports.lol.desc", "Batallas tácticas MOBA en la Grieta del Invocador."),
    },
    {
      id: "Valorant",
      name: t("sports.valorant.name", "Valorant"),
      emoji: "🎯🔫",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-rose-950 via-neutral-900 to-zinc-950 border-rose-500/30 shadow-[inset_0_0_10px_rgba(244,63,94,0.15)] relative",
      description: t("sports.valorant.desc", "Tactical shooter de precisión extrema de Riot."),
    },
    {
      id: "Clash Royale",
      name: t("sports.clash_royale.name", "Clash Royale"),
      emoji: "👑🏰",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 border-yellow-400/40 shadow-[inset_0_0_10px_rgba(250,204,21,0.2)] relative",
      description: t("sports.clash_royale.desc", "Estrategia de cartas y torres en tiempo real."),
    },
    {
      id: "Fortnite",
      name: t("sports.fortnite.name", "Fortnite"),
      emoji: "🪂⛏",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-fuchsia-900 via-purple-950 to-indigo-950 border-fuchsia-500/30 shadow-[inset_0_0_10px_rgba(217,70,239,0.15)] relative",
      description: t("sports.fortnite.desc", "Construcción y supervivencia Battle Royale."),
    },
    {
      id: "Brawl Stars",
      name: t("sports.brawl_stars.name", "Brawl Stars"),
      emoji: "🤠⭐",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-yellow-600 via-amber-900 to-red-950 border-yellow-500/50 shadow-[inset_0_0_15px_rgba(234,179,8,0.25)] relative",
      description: t("sports.brawl_stars.desc", "Batallas Arcade dinámicas multijugador."),
    },
    // Cola larga extra (12 tarjetas para completar 18 e-sports)
    {
      id: "Counter-Strike 2",
      name: t("sports.cs2.name", "Counter-Strike 2"),
      emoji: "🎯💣",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-amber-950 via-slate-900 to-zinc-950 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.15)] relative",
      description: t("sports.cs2.desc", "Shooter táctico en primera persona por equipos."),
      isExtra: true,
    },
    {
      id: "Dota 2",
      name: t("sports.dota2.name", "Dota 2"),
      emoji: "🛡️⚔",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-red-950 via-neutral-900 to-stone-950 border-red-500/30 shadow-[inset_0_0_12px_rgba(220,38,38,0.15)] relative",
      description: t("sports.dota2.desc", "Estrategia de arena de batalla multijugador clásica."),
      isExtra: true,
    },
    {
      id: "Rocket League",
      name: t("sports.rocket_league.name", "Rocket League"),
      emoji: "🚗⚽",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.15)] relative",
      description: t(
        "sports.rocket_league.desc",
        "Fútbol vehicular de alta velocidad y acrobacias.",
      ),
      isExtra: true,
    },
    {
      id: "Overwatch 2",
      name: t("sports.overwatch2.name", "Overwatch 2"),
      emoji: "🛡️🔫",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-orange-950 via-zinc-900 to-slate-950 border-orange-500/30 shadow-[inset_0_0_10px_rgba(249,115,22,0.15)] relative",
      description: t(
        "sports.overwatch2.desc",
        "Batallas por equipos de héroes con roles dinámicos.",
      ),
      isExtra: true,
    },
    {
      id: "Street Fighter / Tekken",
      name: t("sports.street_fighter_tekken.name", "Street Fighter / Tekken"),
      emoji: "🥊⚡",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-red-950 via-purple-950 to-neutral-950 border-red-500/30 shadow-[inset_0_0_10px_rgba(239,68,68,0.15)] relative",
      description: t("sports.street_fighter_tekken.desc", "Juegos de pelea tradicionales 1v1."),
      isExtra: true,
    },
    {
      id: "Apex Legends",
      name: t("sports.apex_legends.name", "Apex Legends"),
      emoji: "🚀🔫",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-red-950 via-zinc-900 to-slate-900 border-red-500/30 shadow-[inset_0_0_10px_rgba(239,68,68,0.15)] relative",
      description: t(
        "sports.apex_legends.desc",
        "Battle Royale frenético con héroes y habilidades.",
      ),
      isExtra: true,
    },
    {
      id: "PUBG Mobile",
      name: t("sports.pubg_mobile.name", "PUBG Mobile"),
      emoji: "🪂🍳",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-yellow-950 via-neutral-900 to-zinc-950 border-yellow-500/30 shadow-[inset_0_0_10px_rgba(234,179,8,0.15)] relative",
      description: t(
        "sports.pubg_mobile.desc",
        "Supervivencia y shooter táctico en dispositivos móviles.",
      ),
      isExtra: true,
    },
    {
      id: "Free Fire",
      name: t("sports.free_fire.name", "Free Fire"),
      emoji: "📱🔥",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-amber-950 via-red-950 to-neutral-950 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.15)] relative",
      description: t(
        "sports.free_fire.desc",
        "Rápidos combates Battle Royale optimizados para móviles.",
      ),
      isExtra: true,
    },
    {
      id: "Call of Duty: Warzone",
      name: t("sports.cod_warzone.name", "Call of Duty: Warzone"),
      emoji: "🎖️🔫",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950 border-stone-500/30 shadow-[inset_0_0_10px_rgba(120,113,108,0.15)] relative",
      description: t("sports.cod_warzone.desc", "Combates militares masivos de alta fidelidad."),
      isExtra: true,
    },
    {
      id: "Rainbow Six Siege",
      name: t("sports.rainbow_six.name", "Rainbow Six Siege"),
      emoji: "🛡️💥",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-blue-950 via-slate-900 to-neutral-950 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.15)] relative",
      description: t(
        "sports.rainbow_six.desc",
        "Shooter táctico en interiores y destrucción de entornos.",
      ),
      isExtra: true,
    },
    {
      id: "Hearthstone",
      name: t("sports.hearthstone.name", "Hearthstone"),
      emoji: "🃏🔮",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-amber-900 via-yellow-950 to-slate-950 border-yellow-500/30 shadow-[inset_0_0_10px_rgba(234,179,8,0.15)] relative",
      description: t(
        "sports.hearthstone.desc",
        "Duelos de cartas estratégicos en el universo Warcraft.",
      ),
      isExtra: true,
    },
    {
      id: "iRacing / F1 SimRacing",
      name: t("sports.iracing_simracing.name", "iRacing / F1 SimRacing"),
      emoji: "🏎️🎮",
      category: "esports",
      styleClass:
        "bg-gradient-to-br from-stone-800 via-slate-900 to-black border-red-500/30 shadow-[inset_0_0_12px_rgba(239,68,68,0.15)] relative",
      description: t(
        "sports.iracing_simracing.desc",
        "Simulación automotriz de alta precisión y licencias.",
      ),
      isExtra: true,
    },
  ];

  // === BLOQUE: MANEJADORES DE SELECCIÓN ===
  // Alterna la selección de un deporte (agrega con nivel predeterminado Intermediate o elimina)
  const handleToggleSport = (sportId: string) => {
    setSportsMatrix((prev) => {
      const next = { ...prev };
      if (next[sportId]) {
        delete next[sportId];
      } else {
        next[sportId] = { level: "Intermediate", weight: 2.0 };
      }
      return next;
    });
  };

  // Cambia el nivel de un deporte seleccionado (con propagación detenida para no alternar selección)
  const handleSetSportLevel = (
    sportId: string,
    level: "Amateur" | "Intermediate" | "Advanced" | "Pro",
    weight: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setSportsMatrix((prev) => ({ ...prev, [sportId]: { level, weight } }));
  };

  // === BLOQUE: NAVEGACIÓN ENTRE PASOS ===
  // Avanza al siguiente paso o completa el onboarding si está en el paso 2
  const handleNextStep = () => {
    if (step === 1 && Object.keys(sportsMatrix).length === 0) return;
    if (step < 2) {
      setStep((prev) => (prev + 1) as 1 | 2);
    } else {
      onComplete({
        sports_matrix: sportsMatrix,
        behavioral_intent: { weekly_hours: weeklyHours, intent: "Recreativo" },
      });
    }
  };

  // Retrocede al paso anterior o sale del wizard
  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    } else {
      onBack();
    }
  };

  // === BLOQUE: RENDERIZADOR DE TARJETA DE DEPORTE ===
  // Construye una tarjeta visual con emoji, nombre, descripción, decoraciones de fondo y controles de nivel
  const renderSportCard = (sport: SportCardData) => {
    const isSelected = !!sportsMatrix[sport.id];
    const selectedLevel = sportsMatrix[sport.id]?.level || "Intermediate";

    return (
      <div
        key={sport.id}
        onClick={() => handleToggleSport(sport.id)}
        className={`p-4 border rounded-2xl cursor-pointer select-none transition-all duration-150 group relative ${sport.styleClass} ${
          isSelected
            ? "border-primary scale-105 shadow-glow"
            : "hover:scale-[1.02] border-white/10 hover:border-white/20"
        }`}
        id={`sport-card-${sport.id.replace(/\s+/g, "-").replace(/\//g, "-")}`}
      >
        {/* Decoraciones de fondo específicas por deporte (líneas de cancha, redes, pistas) */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {sport.id === "Fútbol" && (
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
          )}
          {sport.id === "Vóley" && (
            <div className="absolute bottom-0 right-0 left-0 h-1/2 border-t border-dashed border-white/10" />
          )}
          {sport.id === "Pádel" && (
            <div className="absolute inset-2 border border-cyan-400/10 rounded-lg" />
          )}
          {sport.id === "Básquet" && (
            <div className="absolute inset-y-0 right-0 w-8 border-l border-amber-500/10 rounded-r-2xl" />
          )}
          {sport.id === "Running" && (
            <>
              <div className="absolute inset-x-0 bottom-4 h-0.5 bg-orange-500/15" />
              <div className="absolute inset-x-0 bottom-8 h-0.5 bg-orange-500/15" />
              <div className="absolute inset-x-0 bottom-12 h-0.5 bg-orange-500/15" />
            </>
          )}
          {sport.id === "Rugby" && (
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(90deg,transparent_45%,#fff_50%,transparent_55%)] bg-[size:40px_100%]" />
          )}
          {sport.id === "Natación" && (
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-cyan-500 to-blue-900" />
          )}
          {sport.id === "League of Legends" && (
            <div className="absolute inset-0.5 border border-purple-500/10 rounded-2xl" />
          )}
          {sport.id === "EA Sports FC" && (
            <div className="absolute inset-y-0 right-0 w-1 bg-yellow-400/20" />
          )}
        </div>

        {/* Contenido principal: emoji, check de selección, nombre y descripción */}
        <div className="flex justify-between items-start relative z-10">
          <span className="text-3xl">{sport.emoji}</span>
          {isSelected && (
            <div className="h-5 w-5 rounded-full bg-primary grid place-items-center">
              <Check className="h-3 w-3 text-black font-black" />
            </div>
          )}
        </div>
        <h4 className="font-extrabold text-sm mt-3 text-white relative z-10">{sport.name}</h4>
        <p className="text-[10px] text-white/60 mt-1 leading-normal relative z-10">
          {sport.description}
        </p>

        {/* Selector de nivel (visible solo cuando el deporte está seleccionado) */}
        {isSelected && (
          <div
            className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2 relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] text-white/50 uppercase tracking-wider font-extrabold">
              {t("onboarding.select_level", "Nivel:")}
            </div>
            <div className="flex gap-1.5 justify-between">
              {[
                {
                  label: "AM",
                  level: "Amateur",
                  weight: 1.0,
                  color: "bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                  hoverColor: "border-emerald-500 text-emerald-400 hover:bg-emerald-500/10",
                  tooltipKey: "onboarding.weight_disclosure_am",
                  defaultTooltip: "Amateur (Peso: 1.0) - Ideal para divertirse y socializar.",
                },
                {
                  label: "INT",
                  level: "Intermediate",
                  weight: 2.0,
                  color: "bg-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.4)]",
                  hoverColor: "border-yellow-500 text-yellow-400 hover:bg-yellow-500/10",
                  tooltipKey: "onboarding.weight_disclosure_int",
                  defaultTooltip: "Intermedio (Peso: 2.0) - Para partidos amistosos competitivos.",
                },
                {
                  label: "ADV",
                  level: "Advanced",
                  weight: 3.5,
                  color: "bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.4)]",
                  hoverColor: "border-orange-500 text-orange-400 hover:bg-orange-500/10",
                  tooltipKey: "onboarding.weight_disclosure_adv",
                  defaultTooltip:
                    "Avanzado (Peso: 3.5) - Diseñado para ligas competitivas regulares.",
                },
                {
                  label: "PRO",
                  level: "Pro",
                  weight: 5.0,
                  color: "bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                  hoverColor: "border-red-500 text-red-400 hover:bg-red-500/10",
                  tooltipKey: "onboarding.weight_disclosure_pro",
                  defaultTooltip:
                    "Pro (Peso: 5.0) - Destinado a ligas y torneos de alta intensidad.",
                },
              ].map((pill) => {
                const isPillSelected = selectedLevel === pill.level;
                return (
                  <div key={pill.level} className="relative group/pill flex-1">
                    <button
                      type="button"
                      onClick={(e) =>
                        handleSetSportLevel(
                          sport.id,
                          pill.level as "Amateur" | "Intermediate" | "Advanced" | "Pro",
                          pill.weight,
                          e,
                        )
                      }
                      className={`w-full py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${isPillSelected ? `${pill.color} border-transparent` : `bg-white/5 border-white/10 ${pill.hoverColor}`}`}
                      data-level={pill.level}
                    >
                      {pill.label}
                    </button>
                    {/* Tooltip informativo al hacer hover sobre el nivel */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/95 border border-white/10 text-white text-[9px] rounded-lg opacity-0 pointer-events-none group-hover/pill:opacity-100 transition-opacity duration-200 shadow-xl z-30 font-medium leading-normal text-center">
                      {t(pill.tooltipKey, pill.defaultTooltip)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const selectedCount = Object.keys(sportsMatrix).length;

  return (
    <div className="w-full space-y-6">
      {/* === BLOQUE: INDICADORES DE PASO === */}
      {/* Barra de progreso con dos segmentos y texto "Paso X de 2" */}
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">
          {t("onboarding.step_indicator", "Paso {{step}} de 2", { step })}
        </span>
        <div className="flex gap-1.5">
          <div
            className={`h-1.5 w-15 rounded-full transition-all duration-300 ${step >= 1 ? "bg-neon" : "bg-muted"}`}
          />
          <div
            className={`h-1.5 w-15 rounded-full transition-all duration-300 ${step >= 2 ? "bg-neon" : "bg-muted"}`}
          />
        </div>
      </div>

      {/* === BLOQUE: PASO 1 — SELECCIÓN DE DISCIPLINAS === */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          {/* Encabezado */}
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t("onboarding.step1_title", "Elige tus disciplinas")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "onboarding.step1_subtitle",
                "Selecciona los deportes tradicionales y títulos de e-sports que juegas.",
              )}
            </p>
          </div>

          {/* Categoría Deportes Tradicionales */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-500" />{" "}
              {t("onboarding.traditional_sports", "Deportes Tradicionales")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sportsData
                .filter((s) => s.category === "traditional" && !s.isExtra)
                .map((sport) => renderSportCard(sport))}
            </div>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsTraditionalExpanded(!isTraditionalExpanded)}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-neon hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 hover:border-neon/30 transition-all cursor-pointer shadow-sm hover:shadow-glow"
              >
                {isTraditionalExpanded
                  ? t("onboarding.ver_menos", "Ver menos ↑")
                  : t("onboarding.ver_mas", "Ver más ↓")}
              </button>
            </div>
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${isTraditionalExpanded ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {sportsData
                  .filter((s) => s.category === "traditional" && s.isExtra)
                  .map((sport) => renderSportCard(sport))}
              </div>
            </div>
          </div>

          {/* Categoría E-Sports */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />{" "}
              {t("onboarding.esports_gaming", "E-Sports & Gaming Core")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sportsData
                .filter((s) => s.category === "esports" && !s.isExtra)
                .map((sport) => renderSportCard(sport))}
            </div>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsEsportsExpanded(!isEsportsExpanded)}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-neon hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 hover:border-neon/30 transition-all cursor-pointer shadow-sm hover:shadow-glow"
              >
                {isEsportsExpanded
                  ? t("onboarding.ver_menos", "Ver menos ↑")
                  : t("onboarding.ver_mas", "Ver más ↓")}
              </button>
            </div>
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${isEsportsExpanded ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {sportsData
                  .filter((s) => s.category === "esports" && s.isExtra)
                  .map((sport) => renderSportCard(sport))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === BLOQUE: PASO 2 — DEDICACIÓN SEMANAL === */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t("onboarding.step3_title", "Matriz de Intención Deportiva")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "onboarding.step3_subtitle",
                "Ajusta los sliders interactivos para afinar tus emparejamientos semanales.",
              )}
            </p>
          </div>

          {/* Slider de horas semanales (1-20) */}
          <div className="bg-gradient-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <Award className="h-4 w-4 text-neon" />{" "}
                {t("onboarding.weekly_dedication", "Dedicación Semanal")}
              </span>
              <span className="text-xs font-extrabold text-neon">
                {weeklyHours}{" "}
                {weeklyHours === 1
                  ? t("onboarding.weekly_hour_sing", "hora")
                  : t("onboarding.weekly_hour_plur", "horas")}
              </span>
            </div>
            <div className="relative pt-2 pb-1">
              <input
                type="range"
                min="1"
                max="20"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted outline-none accent-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) ${((weeklyHours - 1) / 19) * 100}%, hsl(var(--muted)) ${((weeklyHours - 1) / 19) * 100}%)`,
                }}
                id="hours-slider"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold pt-1">
              <span>{t("onboarding.weekly_min", "Mínimo (1h)")}</span>
              <span>{t("onboarding.weekly_default", "Predeterminado (6h)")}</span>
              <span>{t("onboarding.weekly_max", "Intenso (20h+)")}</span>
            </div>
          </div>
        </div>
      )}

      {/* === BLOQUE: BOTONES DE NAVEGACIÓN === */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handlePrevStep}
          className="flex-1 py-3.5 bg-accent hover:bg-accent/80 text-foreground font-bold rounded-xl border border-border transition-all cursor-pointer text-sm"
        >
          {step > 1 ? t("onboarding.btn_back", "Atrás") : t("onboarding.btn_cancel", "Cancelar")}
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={step === 1 && selectedCount === 0}
          className="flex-1 py-3.5 bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm"
          id="onboarding-next-btn"
        >
          {step === 2
            ? t("onboarding.btn_finish", "Finalizar y Registrarse")
            : t("onboarding.btn_next", "Siguiente")}
        </button>
      </div>
    </div>
  );
}

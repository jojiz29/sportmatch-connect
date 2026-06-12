// === BLOQUE: IMPORTACIONES ===
// Dependencias: estado local, iconos Lucide, internacionalización y configuración de deportes del catálogo compartido
import { useState } from "react";
import { Check, Flame, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SPORTS_CATALOG, SportCardData } from "@/shared/config/sports";

// === BLOQUE: INTERFAZ DE PROPS ===
// Recibe el estado actual de la matriz de deportes (sportId -> nivel 1/2/3) y un callback para modificarlo
interface SportSelectionGridProps {
  sportsMatrix: Record<string, 1 | 2 | 3>;
  onSportChange: (sportId: string, level: 1 | 2 | 3 | undefined) => void;
}

// === BLOQUE: COMPONENTE DE CUADRÍCULA DE SELECCIÓN DE DEPORTES ===
// Grid de tarjetas de deportes con selección por clics progresivos (3 niveles: Aficionado/Experimentado/Competitivo)
// Organizado en dos categorías: Deportes Tradicionales y E-Sports, cada una con acordeón expandible "Ver más"
export function SportSelectionGrid({ sportsMatrix, onSportChange }: SportSelectionGridProps) {
  const { t } = useTranslation();

  // === BLOQUE: ESTADOS DE EXPANSIÓN DE ACORDEÓN ===
  // Controlan si las secciones "extra" (deportes de cola larga) están visibles
  const [isTraditionalExpanded, setIsTraditionalExpanded] = useState(false);
  const [isEsportsExpanded, setIsEsportsExpanded] = useState(false);

  // === BLOQUE: MANEJADOR DE CLIC EN TARJETA ===
  // Ciclo de 4 estados: no seleccionado -> Aficionado(1) -> Experimentado(2) -> Competitivo(3) -> no seleccionado
  const handleCardClick = (sportId: string) => {
    const current = sportsMatrix[sportId];
    if (!current) {
      onSportChange(sportId, 1); // No seleccionado -> Aficionado
    } else if (current === 1) {
      onSportChange(sportId, 2); // Aficionado -> Experimentado
    } else if (current === 2) {
      onSportChange(sportId, 3); // Experimentado -> Competitivo
    } else {
      onSportChange(sportId, undefined); // Competitivo -> no seleccionado
    }
  };

  // === BLOQUE: INSIGNIA DE NIVEL ===
  // Renderiza la etiqueta del nivel con estilo de color según el estado actual (verde/naranja/rojo)
  const getLevelBadge = (level: 1 | 2 | 3) => {
    if (level === 1) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#3CAC3B]/10 border border-[#3CAC3B]/30 text-[#3CAC3B] shadow-[0_0_8px_rgba(60,172,59,0.2)]">
          {t("skills.aficionado", "Aficionado")}
        </span>
      );
    }
    if (level === 2) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.2)]">
          {t("skills.experimentado", "Experimentado")}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E61D25]/10 border border-[#E61D25]/30 text-[#E61D25] shadow-[0_0_8px_rgba(230,29,37,0.2)]">
        {t("skills.competitivo", "Competitivo")}
      </span>
    );
  };

  // === BLOQUE: ESTILOS DE BORDE SEGÚN NIVEL ===
  // Define el borde y sombra de la tarjeta según el nivel de selección
  const getCardBorderClass = (level: 1 | 2 | 3 | undefined) => {
    if (level === 1) {
      return "border-[#3CAC3B] scale-105 shadow-[0_0_15px_rgba(60,172,59,0.4)]";
    }
    if (level === 2) {
      return "border-[#F97316] scale-105 shadow-[0_0_15px_rgba(249,115,22,0.4)]";
    }
    if (level === 3) {
      return "border-[#E61D25] scale-105 shadow-[0_0_15px_rgba(230,29,37,0.4)]";
    }
    return "border-white/10 hover:border-white/20 hover:scale-[1.02]";
  };

  // === BLOQUE: RENDERIZADOR DE TARJETA DE DEPORTE ===
  // Construye la tarjeta visual para un deporte con emoji, nombre, descripción y decoraciones de cancha de fondo
  const renderSportCard = (sport: SportCardData) => {
    const level = sportsMatrix[sport.id];
    const isSelected = level !== undefined;

    return (
      <div
        key={sport.id}
        onClick={() => handleCardClick(sport.id)}
        className={`p-4 border rounded-2xl cursor-pointer select-none transition-all duration-150 group relative ${sport.styleClass} ${getCardBorderClass(
          level,
        )}`}
        id={`sport-card-${sport.id.replace(/\s+/g, "-").replace(/\//g, "-")}`}
      >
        {/* === BLOQUE: DECORACIONES DE FONDO POR DEPORTE === */}
        {/* Overlays visuales que simulan el diseño de la cancha (líneas de campo, red, pista, etc.) */}
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
        </div>

        {/* === BLOQUE: CONTENIDO PRINCIPAL DE LA TARJETA === */}
        <div className="flex justify-between items-start relative z-10">
          <span className="text-3xl">{sport.emoji}</span>
          <div className="flex gap-1.5 items-center">
            {isSelected && getLevelBadge(level)}
            {isSelected && (
              <div
                className="h-5 w-5 rounded-full grid place-items-center"
                style={{
                  backgroundColor: level === 1 ? "#3CAC3B" : level === 2 ? "#F97316" : "#E61D25",
                }}
              >
                <Check className="h-3 w-3 text-white font-black" />
              </div>
            )}
          </div>
        </div>
        <h4 className="font-extrabold text-sm mt-3 text-white relative z-10">
          {t(sport.nameKey, sport.id)}
        </h4>
        <p className="text-[10px] text-white/60 mt-1 leading-normal relative z-10">
          {t(sport.descKey, "")}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* === BLOQUE: CATEGORÍA DEPORTES TRADICIONALES === */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />{" "}
          {t("onboarding.traditional_sports", "Deportes Tradicionales")}
        </h3>
        {/* Grid base 3x2 con los 6 deportes principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SPORTS_CATALOG.filter((s) => s.category === "traditional" && !s.isExtra).map((sport) =>
            renderSportCard(sport),
          )}
        </div>

        {/* Botón "Ver más" para expandir deportes de cola larga */}
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

        {/* Acordeón expandible con deportes extra (12 disciplinas adicionales) */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isTraditionalExpanded
              ? "max-h-[2000px] opacity-100 mt-2"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {SPORTS_CATALOG.filter((s) => s.category === "traditional" && s.isExtra).map((sport) =>
              renderSportCard(sport),
            )}
          </div>
        </div>
      </div>

      {/* === BLOQUE: CATEGORÍA E-SPORTS === */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />{" "}
          {t("onboarding.esports_gaming", "E-Sports & Gaming Core")}
        </h3>
        {/* Grid base 3x2 con los 6 esports principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SPORTS_CATALOG.filter((s) => s.category === "esports" && !s.isExtra).map((sport) =>
            renderSportCard(sport),
          )}
        </div>

        {/* Botón "Ver más" para expandir esports de cola larga */}
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

        {/* Acordeón expandible con esports extra (12 títulos adicionales) */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isEsportsExpanded
              ? "max-h-[2000px] opacity-100 mt-2"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {SPORTS_CATALOG.filter((s) => s.category === "esports" && s.isExtra).map((sport) =>
              renderSportCard(sport),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Check, Flame, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SPORTS_CATALOG, SportCardData } from "@/shared/config/sports";

interface SportSelectionGridProps {
  sportsMatrix: Record<string, 1 | 2 | 3>;
  onSportChange: (sportId: string, level: 1 | 2 | 3 | undefined) => void;
}

export function SportSelectionGrid({ sportsMatrix, onSportChange }: SportSelectionGridProps) {
  const { t } = useTranslation();

  // Accordion expansion states
  const [isTraditionalExpanded, setIsTraditionalExpanded] = useState(false);
  const [isEsportsExpanded, setIsEsportsExpanded] = useState(false);

  const handleCardClick = (sportId: string) => {
    const current = sportsMatrix[sportId];
    if (!current) {
      onSportChange(sportId, 1); // Unselected -> Aficionado (1)
    } else if (current === 1) {
      onSportChange(sportId, 2); // Aficionado -> Experimentado (2)
    } else if (current === 2) {
      onSportChange(sportId, 3); // Experimentado -> Competitivo (3)
    } else {
      onSportChange(sportId, undefined); // Competitivo -> Unselected
    }
  };

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
        {/* Visual court layouts overlay */}
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
      {/* Traditional Category */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />{" "}
          {t("onboarding.traditional_sports", "Deportes Tradicionales")}
        </h3>
        {/* Baseline 3x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SPORTS_CATALOG.filter((s) => s.category === "traditional" && !s.isExtra).map((sport) =>
            renderSportCard(sport),
          )}
        </div>

        {/* Ver más button */}
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

        {/* Expandable accordion */}
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

      {/* Esports Category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />{" "}
          {t("onboarding.esports_gaming", "E-Sports & Gaming Core")}
        </h3>
        {/* Baseline 3x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SPORTS_CATALOG.filter((s) => s.category === "esports" && !s.isExtra).map((sport) =>
            renderSportCard(sport),
          )}
        </div>

        {/* Ver más button */}
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

        {/* Expandable accordion */}
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

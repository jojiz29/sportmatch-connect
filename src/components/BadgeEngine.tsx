import React from "react";
import { Trophy, Dumbbell, Gamepad2, Award, Shield, Target, Flame, Activity } from "lucide-react";

export interface SportsMatrixItem {
  level: string;
  weight?: number;
}

export type SportsMatrix = Record<string, SportsMatrixItem>;

export interface SportBadgeData {
  sportName: string;
  level: "Amateur" | "Intermediate" | "Advanced" | "Pro" | "AM" | "INT" | "ADV" | "PRO" | string;
  weight?: number;
}

interface BadgeEngineProps {
  sports_matrix?: SportsMatrix | Record<string, unknown> | null;
  size?: "sm" | "md" | "lg";
}

// Maps sport names to relevant Lucide icons
const getSportIcon = (sportName: string, className: string) => {
  const name = sportName.toLowerCase();
  if (
    name.includes("fútbol") ||
    name.includes("futbol") ||
    name.includes("soccer") ||
    name.includes("béisbol") ||
    name.includes("rugby")
  ) {
    return <Trophy className={className} />;
  }
  if (
    name.includes("básquet") ||
    name.includes("basquet") ||
    name.includes("basketball") ||
    name.includes("golf")
  ) {
    return <Target className={className} />;
  }
  if (
    name.includes("tenis") ||
    name.includes("pádel") ||
    name.includes("padel") ||
    name.includes("vóley") ||
    name.includes("voley")
  ) {
    return <Activity className={className} />;
  }
  if (name.includes("running") || name.includes("ciclismo") || name.includes("automovilismo")) {
    return <Flame className={className} />;
  }
  if (name.includes("gimnasio") || name.includes("calistenia") || name.includes("fitness")) {
    return <Dumbbell className={className} />;
  }
  if (name.includes("boxeo") || name.includes("mma") || name.includes("fight")) {
    return <Shield className={className} />;
  }
  if (
    name.includes("legends") ||
    name.includes("fc") ||
    name.includes("valorant") ||
    name.includes("clash") ||
    name.includes("fortnite") ||
    name.includes("stars") ||
    name.includes("counter") ||
    name.includes("dota") ||
    name.includes("rocket") ||
    name.includes("overwatch") ||
    name.includes("apex") ||
    name.includes("pubg") ||
    name.includes("fire") ||
    name.includes("warzone") ||
    name.includes("siege") ||
    name.includes("hearthstone") ||
    name.includes("gaming")
  ) {
    return <Gamepad2 className={className} />;
  }
  return <Award className={className} />;
};

export function BadgeEngine({ sports_matrix, size = "md" }: BadgeEngineProps) {
  if (!sports_matrix || Object.keys(sports_matrix).length === 0) {
    return null;
  }

  // Parse sports matrix into normalized list of badges
  const badges: SportBadgeData[] = Object.entries(sports_matrix).map(([sportName, details]) => {
    const item = details as { level?: string; weight?: number } | null | undefined;
    const rawLevel = typeof details === "string" ? details : item?.level || "Amateur";
    return {
      sportName,
      level: rawLevel,
      weight: typeof details === "object" ? item?.weight : undefined,
    };
  });

  // Size configuration in em for relative scalability
  const sizeClasses = {
    sm: {
      container: "text-[10px] px-2 py-0.5 gap-1 rounded-md",
      icon: "w-3 h-3",
      levelTag: "text-[8px] font-bold px-1 rounded",
    },
    md: {
      container: "text-xs px-3 py-1 gap-1.5 rounded-lg",
      icon: "w-4 h-4",
      levelTag: "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
    },
    lg: {
      container: "text-sm px-4 py-1.5 gap-2 rounded-xl",
      icon: "w-5 h-5",
      levelTag: "text-xs font-bold px-2 py-1 rounded-lg",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex flex-wrap gap-2 animate-scale-in" id="badge-engine-tour">
      {badges.map((badge, idx) => {
        const rawLvl = badge.level.toUpperCase();

        let isAM =
          rawLvl.startsWith("AM") ||
          rawLvl.startsWith("PRINCIPIANTE") ||
          rawLvl.includes("BEGINNER");
        const isINT = rawLvl.startsWith("INT") || rawLvl.startsWith("INTERMEDIO");
        const isADV = rawLvl.startsWith("ADV") || rawLvl.startsWith("AVANZADO");
        const isPRO =
          rawLvl.startsWith("PRO") || rawLvl.startsWith("ELITE") || rawLvl.startsWith("EXPERT");

        // Fallback matching if none matches (default to Amateur)
        if (!isAM && !isINT && !isADV && !isPRO) {
          isAM = true;
        }

        // Programmatically choose color schemes and SVGs
        let style = {};
        let containerClass =
          "flex items-center font-semibold border backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] ";
        let badgeLevelText = "AM";
        let levelTagClass = "";

        if (isAM) {
          // Bronze UI - Warm coppers, subtle bronze border
          containerClass +=
            "bg-[#CD7F32]/10 border-[#CD7F32]/40 text-[#8C521F] dark:text-[#df9a65]";
          levelTagClass = "bg-[#CD7F32]/20 text-[#8C521F] dark:text-[#CD7F32]";
          badgeLevelText = "BRONCE";
        } else if (isINT) {
          // Silver/Steel UI - Metallic greys, clean steel border
          containerClass +=
            "bg-slate-400/10 border-slate-400/40 text-slate-700 dark:text-slate-300";
          levelTagClass = "bg-slate-400/20 text-slate-800 dark:text-slate-300";
          badgeLevelText = "PLATA";
        } else if (isADV) {
          // Gold UI - Glowing golds, drop shadow
          containerClass +=
            "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#856404] dark:text-[#F3E5AB] shadow-[0_0_12px_rgba(212,175,55,0.25)]";
          levelTagClass = "bg-[#D4AF37]/25 text-[#856404] dark:text-[#D4AF37]";
          badgeLevelText = "ORO";
        } else if (isPRO) {
          // Pro UI - Electric animated borders
          containerClass +=
            "bg-emerald-500/15 border-emerald-400/50 text-emerald-700 dark:text-emerald-400 relative overflow-hidden animate-pulse-ring";
          levelTagClass = "bg-emerald-400/30 text-emerald-800 dark:text-emerald-300 animate-pulse";
          badgeLevelText = "PRO";
          style = {
            animation: "border-pulse-neon 2s infinite alternate",
          };
        }

        return (
          <div
            key={`${badge.sportName}-${idx}`}
            className={`${containerClass} ${currentSize.container}`}
            style={style}
          >
            {/* SVG Shield shape inside badge */}
            <span className="relative flex items-center justify-center shrink-0">
              {getSportIcon(badge.sportName, currentSize.icon)}
            </span>
            <span className="font-bold tracking-wide truncate">{badge.sportName}</span>
            <span className={`${levelTagClass} ${currentSize.levelTag} tracking-widest uppercase`}>
              {badgeLevelText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default BadgeEngine;

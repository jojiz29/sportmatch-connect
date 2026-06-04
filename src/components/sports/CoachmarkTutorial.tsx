import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CoachmarkTutorialProps {
  onDismiss: () => void;
}

export function CoachmarkTutorial({ onDismiss }: CoachmarkTutorialProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);

  const handleCardClick = () => {
    setLevel((prev) => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
  };

  const getCardBorderClass = () => {
    if (level === 1) {
      return "border-[#3CAC3B] shadow-[0_0_20px_rgba(60,172,59,0.5)] scale-105";
    }
    if (level === 2) {
      return "border-[#F97316] shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-105";
    }
    if (level === 3) {
      return "border-[#E61D25] shadow-[0_0_20px_rgba(230,29,37,0.5)] scale-105";
    }
    return "border-white/20 hover:border-white/30";
  };

  const getLevelBadge = () => {
    if (level === 1) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#3CAC3B]/10 border border-[#3CAC3B]/30 text-[#3CAC3B]">
          {t("skills.aficionado", "Aficionado")}
        </span>
      );
    }
    if (level === 2) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316]">
          {t("skills.experimentado", "Experimentado")}
        </span>
      );
    }
    if (level === 3) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E61D25]/10 border border-[#E61D25]/30 text-[#E61D25]">
          {t("skills.competitivo", "Competitivo")}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white tracking-tight">
            {t("tutorial.title", "¡Elige tu nivel por deporte!")}
          </h2>
          <p className="text-sm text-white/70">
            {t(
              "tutorial.subtitle",
              "Haz click repetidas veces sobre una tarjeta para cambiar tu nivel.",
            )}
          </p>
        </div>

        {/* Interactive Sample Card container with animated pointer */}
        <div className="relative flex justify-center py-6">
          <div
            onClick={handleCardClick}
            className={`w-64 p-5 border rounded-3xl cursor-pointer select-none bg-gradient-to-br from-emerald-800 via-emerald-950 to-green-950 transition-all duration-300 relative ${getCardBorderClass()}`}
          >
            {/* Background design */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none opacity-10">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <span className="text-4xl">⚽🏃</span>
              <div className="flex gap-1.5 items-center">
                {level > 0 && getLevelBadge()}
                {level > 0 && (
                  <div
                    className="h-5 w-5 rounded-full grid place-items-center text-white"
                    style={{
                      backgroundColor:
                        level === 1 ? "#3CAC3B" : level === 2 ? "#F97316" : "#E61D25",
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>
            <h4 className="font-extrabold text-lg mt-4 text-white text-left">Fútbol</h4>
            <p className="text-xs text-white/60 mt-1 leading-normal text-left">
              ¡Haz click aquí para probar la demostración!
            </p>
          </div>

          {/* Animated Hand/Pointer Cursor */}
          <div className="absolute top-1/2 left-1/2 mt-4 ml-6 pointer-events-none animate-bounce">
            <svg
              className="h-10 w-10 text-white fill-neon drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]"
              viewBox="0 0 24 24"
            >
              <path d="M10 21.5c-1.38 0-2.5-1.12-2.5-2.5v-3.5H7c-1.1 0-2-.9-2-2V13c0-.55.45-1 1-1s1 .45 1 1v.5h.5c.28 0 .5-.22.5-.5V6c0-1.1.9-2 2-2s2 .9 2 2v5.5c0 .28.22.5.5.5s.5-.22.5-.5V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v3c0 .28.22.5.5.5s.5-.22.5-.5v-1c0-.55.45-1 1-1s1 .45 1 1v3.5c0 3.87-3.13 7-7 7z" />
            </svg>
          </div>
        </div>

        {/* Didactic steps */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3 font-semibold text-xs max-w-sm mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-[#3CAC3B] shadow-[0_0_6px_#3CAC3B]" />
            <span className="text-white/90">
              1 Click = {t("skills.aficionado", "Aficionado (Verde)")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-[#F97316] shadow-[0_0_6px_#F97316]" />
            <span className="text-white/90">
              2 Clicks = {t("skills.experimentado", "Experimentado (Naranja)")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-[#E61D25] shadow-[0_0_6px_#E61D25]" />
            <span className="text-white/90">
              3 Clicks = {t("skills.competitivo", "Competitivo (Rojo)")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/50 text-[10px]">
            <span className="h-4 w-4 rounded-full border border-white/20 inline-block text-center line-height-4">
              4
            </span>
            <span>Click 4 = Desmarca el deporte por completo</span>
          </div>
        </div>

        <button
          id="coachmark-dismiss-btn"
          onClick={onDismiss}
          className="w-full max-w-xs py-4 bg-gradient-primary text-primary-foreground font-black rounded-2xl shadow-glow hover:scale-105 active:scale-95 transition-transform text-sm cursor-pointer"
        >
          {t("tutorial.understand", "¡Entendido!")}
        </button>
      </div>
    </div>
  );
}

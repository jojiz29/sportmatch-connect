import { SportSelectionGrid } from "./SportSelectionGrid";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";

interface SportsMatrixStepProps {
  sportsMatrix: Record<string, 1 | 2 | 3>;
  onSportChange: (sportId: string, level: 1 | 2 | 3 | undefined) => void;
  onNext: () => void;
}

export function SportsMatrixStep({ sportsMatrix, onSportChange, onNext }: SportsMatrixStepProps) {
  const { t } = useTranslation();
  const selectedCount = Object.keys(sportsMatrix).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow mb-2">
          <Flame className="h-6 w-6 text-primary-foreground animate-pulse" />
        </div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
          {t("onboarding.step1_title", "Elige tus disciplinas")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t(
            "onboarding.step1_subtitle",
            "Haz click en los deportes que juegas para alternar tu nivel de habilidad.",
          )}
        </p>
      </div>

      {/* 3-Click State Selection Grid */}
      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card">
        <SportSelectionGrid sportsMatrix={sportsMatrix} onSportChange={onSportChange} />
      </div>

      {/* Next button */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={onNext}
          disabled={selectedCount === 0}
          className="w-full max-w-md py-4 bg-gradient-primary text-primary-foreground text-sm font-extrabold rounded-2xl shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          id="onboarding-next-btn"
        >
          {t("onboarding.btn_next", "Siguiente")}
        </button>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { useProfileStore } from "@/features/profile/useProfileStore";
import { CoachmarkTutorial } from "@/components/sports/CoachmarkTutorial";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { Sport, Level } from "@/entities/types";
import { SportsMatrixStep } from "@/components/sports/SportsMatrixStep";
import { IdentityStep } from "@/components/sports/IdentityStep";

export const Route = createFileRoute("/onboarding/sports")({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: OnboardingSports,
});

function OnboardingSports() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateProfile } = useProfileStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean>(true);
  const [sportsMatrix, setSportsMatrix] = useState<Record<string, 1 | 2 | 3>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 1. Check tutorial state in localStorage
    const hasSeen = localStorage.getItem("has_seen_sport_tutorial") === "true";
    setHasSeenTutorial(hasSeen);

    // 2. Pre-fill sports matrix from authenticated user's current preferences
    if (user?.user_sports) {
      const initial: Record<string, 1 | 2 | 3> = {};
      user.user_sports.forEach((us) => {
        initial[us.sport_id] = us.level;
      });
      setSportsMatrix(initial);
    }
  }, [user]);

  const handleSportChange = (sportId: string, level: 1 | 2 | 3 | undefined) => {
    setSportsMatrix((prev) => {
      const next = { ...prev };
      if (level === undefined) {
        delete next[sportId];
      } else {
        next[sportId] = level;
      }
      return next;
    });
  };

  const handleComplete = async (identityData: {
    avatar_url: string;
    bio: string;
    gender: "Masculino" | "Femenino" | "Mixto";
    weekly_hours: number;
    lat: number | null;
    lng: number | null;
  }) => {
    const sportsKeys = Object.keys(sportsMatrix);
    if (sportsKeys.length === 0) {
      toast.error(t("register.select_sports_error", "Por favor selecciona al menos un deporte."));
      setStep(1);
      return;
    }

    try {
      setIsSaving(true);

      // --- Pre-flight: Validate auth session before touching Supabase ---
      const isDemoMode = useAuthStore.getState().isDemoMode;
      if (!isDemoMode) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          throw new Error(
            t("auth.session_expired", "Tu sesión ha expirado. Por favor inicia sesión de nuevo."),
          );
        }
      }

      // Structure user_sports array of objects containing sport_id AND specific level
      const userSports = sportsKeys.map((key) => ({
        sport_id: key,
        level: sportsMatrix[key] as 1 | 2 | 3,
      }));

      // Structure legacy sport_preferences mapping for backward compatibility
      const legacyMatrix: Record<
        string,
        { level: "Amateur" | "Intermediate" | "Advanced" | "Pro"; weight: number }
      > = {};
      sportsKeys.forEach((key) => {
        const lvl = sportsMatrix[key];
        const stringLevel = lvl === 1 ? "Amateur" : lvl === 2 ? "Intermediate" : "Advanced";
        const weight = lvl === 1 ? 1.0 : lvl === 2 ? 2.0 : 3.5;
        legacyMatrix[key] = { level: stringLevel, weight };
      });

      const firstSportKey = sportsKeys[0];
      const primaryLevelVal = sportsMatrix[firstSportKey];
      const translatedLevel: Level =
        primaryLevelVal === 1 ? "Principiante" : primaryLevelVal === 2 ? "Intermedio" : "Avanzado";

      // 2. DEFENSIVE MAPPING FOR LEGACY ACCOUNTS
      const cleanSportsMatrix =
        legacyMatrix && Object.keys(legacyMatrix).length > 0 ? legacyMatrix : {};
      const cleanUserSports = Array.isArray(userSports) ? userSports : [];

      // Build consolidated atomic payload
      const updatedPayload = {
        user_sports: cleanUserSports,
        onboarding_completed: true,
        preferred_sports: sportsKeys as Sport[],
        level: translatedLevel,
        sport_preferences: {
          sports_matrix: cleanSportsMatrix,
          behavioral_intent: {
            weekly_hours: identityData.weekly_hours,
            intent: "Recreativo" as const,
          },
        },
        avatar_url: identityData.avatar_url || user?.avatar_url || "",
        bio: identityData.bio,
        gender: identityData.gender,
        last_location_lat: identityData.lat,
        last_location_lng: identityData.lng,
      };

      // updateProfile now propagates errors — any Supabase failure, RLS violation,
      // or 12-second timeout will throw and land in the catch block below.
      await updateProfile(updatedPayload);

      toast.success(t("register.success_toast", "¡Configuración guardada con éxito!"));
      navigate({ to: "/app" });
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error saving onboarding sports:", err);
      const errMsg = err instanceof Error ? err.message : "Error desconocido al guardar el perfil.";
      // If the profile store exhausted retries due to missing columns, show migration hint
      if (errMsg.includes("migración SQL") || errMsg.includes("varios intentos")) {
        toast.error(
          "Tu base de datos necesita una migración. Ejecuta el SQL en Supabase → SQL Editor.",
          { duration: 8000 },
        );
      } else {
        toast.error(errMsg, { duration: 6000 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismissTutorial = () => {
    localStorage.setItem("has_seen_sport_tutorial", "true");
    setHasSeenTutorial(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative">
      {/* Full screen backdrop blur tutorial */}
      {!hasSeenTutorial && step === 1 && <CoachmarkTutorial onDismiss={handleDismissTutorial} />}

      <div className="max-w-4xl w-full mx-auto px-4 py-12 space-y-8 flex-1 flex flex-col justify-center">
        {/* Step Indicator */}
        <div className="flex justify-between items-center px-2 mb-4">
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

        {step === 1 ? (
          <SportsMatrixStep
            sportsMatrix={sportsMatrix}
            onSportChange={handleSportChange}
            onNext={() => setStep(2)}
          />
        ) : (
          <IdentityStep
            userId={user?.id || ""}
            isDemoMode={useAuthStore.getState().isDemoMode}
            onBack={() => setStep(1)}
            onComplete={handleComplete}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}

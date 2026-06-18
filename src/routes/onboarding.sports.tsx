// === BLOQUE: IMPORTS — Dependencias del onboarding deportivo ===
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

// === BLOQUE: Ruta /onboarding/sports — createFileRoute ===
// Guard de autenticación: redirige a /login si el usuario no está autenticado.
export const Route = createFileRoute("/onboarding/sports")({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: OnboardingSports,
});

// === BLOQUE: OnboardingSports — Flujo de onboarding en 2 pasos ===
// Paso 1 (SportsMatrixStep): selección de deportes y niveles.
// Paso 2 (IdentityStep): avatar, bio, género, ubicación, horas semanales.
// Al completar, persiste en Supabase vía updateProfile y redirige a /app.
function OnboardingSports() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateProfile } = useProfileStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean>(true);
  const [sportsMatrix, setSportsMatrix] = useState<Record<string, 1 | 2 | 3>>({});
  const [isSaving, setIsSaving] = useState(false);

  // === BLOQUE: useEffect — Carga inicial de preferencias deportivas ===
  // Al montar, verifica si ya se vio el tutorial (localStorage) y
  // precarga la matriz deportiva desde user_sports del usuario autenticado.
  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_sport_tutorial") === "true";
    setHasSeenTutorial(hasSeen);

    if (user?.user_sports) {
      const initial: Record<string, 1 | 2 | 3> = {};
      user.user_sports.forEach((us) => {
        initial[us.sport_id] = us.level;
      });
      setSportsMatrix(initial);
    }
  }, [user]);

  // === BLOQUE: handleSportChange — Actualiza la matriz deportiva ===
  // Si level es undefined, elimina el deporte de la matriz.
  // Si tiene valor, lo asigna (1=Principiante, 2=Intermedio, 3=Avanzado).
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

  // === BLOQUE: handleComplete — Persiste el onboarding en Supabase ===
  // Construye el payload consolidado que incluye:
  //   - user_sports (array de objetos {sport_id, level})
  //   - sport_preferences.legacy (backwards compatibility)
  //   - onboarding_completed: true
  //   - Datos de identidad (avatar, bio, género, ubicación)
  // Realiza validación previa: verifica sesión activa (si no es demo).
  const handleComplete = async (identityData: {
    avatar_url: string;
    bio: string;
    gender: "Masculino" | "Femenino" | "Otro";
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

      // Verifica sesión activa antes de tocar Supabase (salta en modo demo).
      const isDemoMode = useAuthStore.getState().isDemoMode;
      if (!isDemoMode) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          throw new Error(
            t("auth.session_expired", "Tu sesión ha expirado. Por favor inicia sesión de nuevo."),
          );
        }
      }

      // Estructura user_sports: array de objetos para la tabla relacional.
      const userSports = sportsKeys.map((key) => ({
        sport_id: key,
        level: sportsMatrix[key] as 1 | 2 | 3,
      }));

      // Estructura legacy para backward compatibility con perfiles antiguos.
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

      // Traduce el nivel del primer deporte para el campo level del perfil.
      const firstSportKey = sportsKeys[0];
      const primaryLevelVal = sportsMatrix[firstSportKey];
      const translatedLevel: Level =
        primaryLevelVal === 1 ? "Principiante" : primaryLevelVal === 2 ? "Intermedio" : "Avanzado";

      // Mapeo defensivo para evitar datos nulos en columnas legacy.
      const cleanSportsMatrix =
        legacyMatrix && Object.keys(legacyMatrix).length > 0 ? legacyMatrix : {};
      const cleanUserSports = Array.isArray(userSports) ? userSports : [];

      // Payload atómico consolidado para updateProfile.
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

      // updateProfile propaga errores — cualquier fallo de Supabase,
      // violación RLS o timeout de 12s lanzará excepción al catch.
      await updateProfile(updatedPayload);

      toast.success(t("register.success_toast", "¡Configuración guardada con éxito!"));
      navigate({ to: "/app" });
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error saving onboarding sports:", err);

      let errMsg = "Error desconocido al guardar el perfil.";
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errMsg = String((err as { message: unknown }).message);
      }

      // Si el store agotó reintentos por columnas faltantes, muestra hint de migración.
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

  // === BLOQUE: handleDismissTutorial — Marca tutorial como visto ===
  const handleDismissTutorial = () => {
    localStorage.setItem("has_seen_sport_tutorial", "true");
    setHasSeenTutorial(true);
  };

  // === BLOQUE: Renderizado — UI del onboarding ===
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative">
      {/* Coachmark tutorial en pantalla completa (solo paso 1 si no se ha visto) */}
      {!hasSeenTutorial && step === 1 && <CoachmarkTutorial onDismiss={handleDismissTutorial} />}

      <div className="max-w-4xl w-full mx-auto px-4 py-12 space-y-8 flex-1 flex flex-col justify-center">
        {/* Indicador de progreso (paso 1 de 2) */}
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

        {/* === BLOQUE: Selector de paso === */}
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

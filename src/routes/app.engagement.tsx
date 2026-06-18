import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  LineChart,
  Loader2,
  Map,
  Save,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  EngagementAnalytics,
  EngagementAchievement,
  EngagementChallenge,
  EngagementContent,
  EngagementDiagnostics,
  AiRecommendationCard,
  AiRecommendationResponse,
  AiRecommendationType,
  completeEngagementChallenge,
  evaluateEngagementAchievements,
  getEngagementAchievements,
  getEngagementAnalytics,
  getEngagementChallenges,
  getEngagementContents,
  getEngagementDiagnostics,
  getEngagementProfile,
  getTodayAiRecommendations,
  rebuildEngagementEmbedding,
  saveEngagementAchievement,
  saveEngagementChallenge,
  saveEngagementContent,
  saveSmartNotification,
  EngagementProfile,
  trackEngagementEvent,
} from "@/features/engagement-ai";
import { useAuthStore } from "@/entities/user/useAuth";
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";
import { toast } from "sonner";

export const Route = createFileRoute("/app/engagement")({
  component: EngagementAiPage,
});

const FILTERS: Array<{ type: AiRecommendationType; label: string }> = [
  { type: "overview", label: "Todo" },
  { type: "players", label: "Jugadores" },
  { type: "sports", label: "Deportes" },
  { type: "challenges", label: "Retos" },
  { type: "achievements", label: "Logros" },
  { type: "content", label: "Contenido" },
];

const cardIcons = {
  player: Users,
  sport: Trophy,
  challenge: Target,
  achievement: Award,
  content: Sparkles,
  venue: Map,
};

const LOCAL_FILTER_TYPES: Record<
  Exclude<AiRecommendationType, "overview">,
  AiRecommendationCard["type"][]
> = {
  players: ["player"],
  sports: ["sport"],
  challenges: ["challenge"],
  achievements: ["achievement"],
  content: ["content", "venue"],
};

function EngagementAiPage() {
  const user = useAuthStore((state) => state.user);
  const [selectedType, setSelectedType] = useState<AiRecommendationType>("overview");
  const [profile, setProfile] = useState<EngagementProfile | null>(null);
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [savedChallenges, setSavedChallenges] = useState<EngagementChallenge[]>([]);
  const [savedAchievements, setSavedAchievements] = useState<EngagementAchievement[]>([]);
  const [savedContents, setSavedContents] = useState<EngagementContent[]>([]);
  const [diagnostics, setDiagnostics] = useState<EngagementDiagnostics | null>(null);
  const [recommendations, setRecommendations] = useState<AiRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyChallengeStatus, setDailyChallengeStatus] = useState<
    "idle" | "started" | "completed"
  >("idle");
  const [savedChallenge, setSavedChallenge] = useState<EngagementChallenge | null>(null);
  const [achievementSaved, setAchievementSaved] = useState(false);
  const [smartNotificationSaved, setSmartNotificationSaved] = useState(false);
  const [weeklyBriefSaved, setWeeklyBriefSaved] = useState(false);
  const [tourNarrativeSaved, setTourNarrativeSaved] = useState(false);
  const [cardFeedback, setCardFeedback] = useState<Record<string, "liked" | "dismissed">>({});
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [achievementEvaluationLoading, setAchievementEvaluationLoading] = useState(false);
  const addNotificationDirectly = useNotificationStore((state) => state.addNotificationDirectly);

  const loadEngagementSnapshot = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const [
        profileResult,
        recommendationResult,
        analyticsResult,
        diagnosticsResult,
        challengesResult,
        achievementsResult,
        contentsResult,
      ] = await Promise.all([
        getEngagementProfile(),
        getTodayAiRecommendations(),
        getEngagementAnalytics(),
        getEngagementDiagnostics(),
        getEngagementChallenges(),
        getEngagementAchievements(),
        getEngagementContents(),
      ]);
      setProfile(profileResult);
      setRecommendations(recommendationResult);
      setAnalytics(analyticsResult);
      setDiagnostics(diagnosticsResult);
      setSavedChallenges(challengesResult);
      setSavedAchievements(achievementsResult);
      setSavedContents(contentsResult);
      setDailyChallengeStatus("idle");
      setSavedChallenge(null);
      setAchievementSaved(false);
      setSmartNotificationSaved(false);
      setWeeklyBriefSaved(false);
      setTourNarrativeSaved(false);
      setCardFeedback({});
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar Engagement AI.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngagementSnapshot();
    // Carga el paquete diario cacheado; solo genera IA si hoy aun no existe snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleFilter = (type: AiRecommendationType) => {
    setSelectedType(type);
  };

  const handleCardAction = (cardId: string, entityId?: string) => {
    trackEngagementEvent({
      eventType: "AI_RECOMMENDATION_OPENED",
      entityType: "ai_recommendation",
      entityId: entityId ?? cardId,
      dedupeKey: `ai-opened:${user?.id}:${cardId}:${Date.now()}`,
      metadata: {
        cardId,
        source: "engagement_page",
        experimentVariant: recommendations?.metadata.experimentVariant,
      },
    });
  };

  const refreshAnalytics = async () => {
    try {
      setAnalytics(await getEngagementAnalytics());
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[Engagement AI] Analytics no actualizado:", err);
    }
  };

  const refreshProgressLists = async () => {
    try {
      const [challengesResult, achievementsResult, contentsResult] = await Promise.all([
        getEngagementChallenges(),
        getEngagementAchievements(),
        getEngagementContents(),
      ]);
      setSavedChallenges(challengesResult);
      setSavedAchievements(achievementsResult);
      setSavedContents(contentsResult);
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[Engagement AI] Progreso no actualizado:", err);
    }
  };

  const handleRecommendationFeedback = async (
    card: AiRecommendationResponse["recommendations"][number],
    feedback: "liked" | "dismissed",
  ) => {
    if (!user) return;
    const eventType =
      feedback === "liked" ? "AI_RECOMMENDATION_LIKED" : "AI_RECOMMENDATION_DISMISSED";

    // Feedback explicito para medir calidad de recomendaciones y alimentar
    // futuras reglas/experimentos A-B sin guardar texto sensible del usuario.
    await trackEngagementEvent({
      eventType,
      entityType: "ai_recommendation",
      entityId: card.entityId ?? card.id,
      dedupeKey: `${eventType}:${user.id}:${card.id}`,
      metadata: {
        cardId: card.id,
        cardType: card.type,
        score: card.score,
        source: "engagement_page",
        experimentVariant: recommendations?.metadata.experimentVariant,
      },
    });

    setCardFeedback((current) => ({ ...current, [card.id]: feedback }));
    refreshAnalytics();
    toast.success(feedback === "liked" ? "Tomaremos esto como buena señal." : "Lo ajustaremos.");
  };

  const handleDailyChallengeAction = async (status: "started" | "completed") => {
    if (!user || !recommendations) return;
    let challenge = savedChallenge;

    if (!challenge) {
      // Persistimos el reto para que pueda retomarse y no quede solo como evento.
      challenge = await saveEngagementChallenge({
        title: recommendations.dailyChallenge.title,
        description: recommendations.dailyChallenge.description,
        rewardHint: recommendations.dailyChallenge.rewardHint,
        metadata: {
          model: recommendations.metadata.model,
          experimentVariant: recommendations.metadata.experimentVariant,
        },
      });
      setSavedChallenge(challenge);
      refreshProgressLists();
    }

    if (status === "completed") {
      challenge = await completeEngagementChallenge(challenge.id);
      setSavedChallenge(challenge);
      refreshProgressLists();
    }

    setDailyChallengeStatus(status);
    refreshAnalytics();
    toast.success(
      status === "started" ? "Reto diario guardado." : "Reto diario marcado como completado.",
    );
  };

  const handleCompleteSavedChallenge = async (challengeId: string) => {
    try {
      // Completa retos guardados desde el historial, no solo el reto generado en pantalla.
      await completeEngagementChallenge(challengeId);
      refreshProgressLists();
      refreshAnalytics();
      toast.success("Reto guardado marcado como completado.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo completar el reto.";
      toast.error(message);
    }
  };

  const handleSaveAchievement = async () => {
    if (!user || !recommendations) return;
    // Guardar el logro crea un objetivo persistente; desbloquearlo queda para
    // reglas futuras basadas en partidos, rachas o desafios completados.
    await saveEngagementAchievement({
      name: recommendations.achievementIdea.name,
      description: recommendations.achievementIdea.description,
      unlockCondition: recommendations.achievementIdea.unlockCondition,
      metadata: {
        model: recommendations.metadata.model,
        experimentVariant: recommendations.metadata.experimentVariant,
      },
    });

    setAchievementSaved(true);
    refreshProgressLists();
    refreshAnalytics();
    toast.success("Logro sugerido guardado.");
  };

  const handleEvaluateAchievements = async () => {
    try {
      setAchievementEvaluationLoading(true);
      // La evaluacion consulta eventos reales y actualiza solo logros que cumplen reglas.
      const result = await evaluateEngagementAchievements();
      refreshProgressLists();
      refreshAnalytics();

      if (result.unlockedCount > 0) {
        toast.success(`${result.unlockedCount} logro(s) desbloqueado(s).`);
      } else {
        toast.info("Aun faltan senales deportivas para desbloquear logros.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo evaluar logros.";
      toast.error(message);
    } finally {
      setAchievementEvaluationLoading(false);
    }
  };

  const handleSaveSmartNotification = async () => {
    if (!recommendations) return;

    // Guardamos el borrador como notificacion real. Si realtime tarda,
    // insertamos tambien en el store local evitando duplicados por ID.
    const notification = await saveSmartNotification({
      title: recommendations.notificationDraft.title,
      body: recommendations.notificationDraft.body,
      source: "engagement_page",
    });

    addNotificationDirectly({
      ...notification,
      link: notification.link ?? undefined,
    });
    setSmartNotificationSaved(true);
    refreshAnalytics();
    toast.success("Alerta inteligente guardada en notificaciones.");
  };

  const handleSaveWeeklyBrief = async () => {
    if (!recommendations) return;

    // El resumen semanal se guarda como contenido propio del modulo.
    // Asi se puede revisar luego sin mezclarlo con alertas de notificaciones.
    await saveEngagementContent({
      contentType: "weekly_brief",
      title: "Resumen semanal SportMatch",
      body: recommendations.weeklyBrief,
      metadata: {
        model: recommendations.metadata.model,
        experimentVariant: recommendations.metadata.experimentVariant,
      },
    });

    setWeeklyBriefSaved(true);
    refreshProgressLists();
    refreshAnalytics();
    toast.success("Resumen semanal guardado.");
  };

  const handleSaveTourNarrative = async () => {
    if (!recommendations) return;

    // Guardamos la narrativa como contenido persistente para el historial
    // deportivo personal del usuario.
    await saveEngagementContent({
      contentType: "tour_narrative",
      title: "Narrativa deportiva",
      body: recommendations.tourNarrative,
      metadata: {
        model: recommendations.metadata.model,
        experimentVariant: recommendations.metadata.experimentVariant,
      },
    });

    setTourNarrativeSaved(true);
    refreshProgressLists();
    refreshAnalytics();
    toast.success("Narrativa deportiva guardada.");
  };

  const handleRebuildEmbedding = async () => {
    try {
      setEmbeddingLoading(true);
      const embedding = await rebuildEngagementEmbedding();
      setProfile((current) => (current ? { ...current, embedding } : current));
      refreshAnalytics();
      toast.success("Perfil de preferencias actualizado.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar el perfil de preferencias.";
      toast.error(message);
    } finally {
      setEmbeddingLoading(false);
    }
  };

  const isFallbackMode = recommendations?.metadata.model.includes("fallback");
  const visibleRecommendations =
    recommendations?.recommendations.filter((card) => {
      if (selectedType === "overview") return true;
      return LOCAL_FILTER_TYPES[selectedType].includes(card.type);
    }) ?? [];

  return (
    <div className="w-full space-y-6 px-4 pb-20 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-card p-6 shadow-card">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <BrainCircuit className="h-4 w-4" />
              Motor de recomendaciones
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Tu coach deportivo inteligente
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Recomendaciones generadas con datos reales de tu perfil y actividad deportiva. El
              sistema usa senales privadas y no copia el texto completo de tus publicaciones.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-bold text-primary">
            {loading
              ? "Preparando recomendaciones..."
              : recommendations?.metadata.cacheStatus === "hit"
                ? "Recomendaciones de hoy"
                : "Paquete diario actualizado"}
          </div>
        </div>
      </section>

      {diagnostics && import.meta.env.DEV && <DiagnosticsCard diagnostics={diagnostics} />}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.type}
            onClick={() => handleFilter(filter.type)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-bold transition-all ${
              selectedType === filter.type
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && !recommendations ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          Preparando tus recomendaciones de hoy...
        </div>
      ) : null}

      {!loading && !recommendations ? (
        <section className="rounded-3xl border border-dashed border-primary/30 bg-card p-8 text-center shadow-card">
          <BrainCircuit className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="text-lg font-black">Recomendaciones diarias</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            El sistema prepara un paquete diario y lo reutiliza para evitar demoras y consumo
            repetido de tokens.
          </p>
        </section>
      ) : null}

      {recommendations && (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-black">
                <Sparkles className="h-5 w-5 text-primary" />
                Resumen inteligente
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">{recommendations.summary}</p>
              <div className="mt-4 grid gap-3 text-xs md:grid-cols-4">
                <Metric label="Latencia" value={`${recommendations.metadata.latencyMs} ms`} />
                <Metric label="Eventos" value={String(profile?.sampleSize ?? 0)} />
                <Metric
                  label="Experimento"
                  value={recommendations.metadata.experimentVariant ?? "A/B"}
                />
                <Metric
                  label="Cache diario"
                  value={recommendations.metadata.cacheStatus === "hit" ? "Reutilizado" : "Nuevo"}
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-background/40 p-3 text-xs md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-bold text-foreground">Perfil de preferencias</div>
                  <div className="text-muted-foreground">
                    {profile?.embedding
                      ? "Actualizado con la actividad reciente"
                      : "Aun no generado para este usuario"}
                  </div>
                </div>
                <button
                  onClick={handleRebuildEmbedding}
                  disabled={embeddingLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 px-4 py-2 font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                >
                  {embeddingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BrainCircuit className="h-4 w-4" />
                  )}
                  Actualizar preferencias
                </button>
              </div>
              {isFallbackMode && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  El servicio avanzado no esta disponible en este momento. Mientras tanto, las
                  recomendaciones se calculan con datos reales y reglas deterministicas del MVP.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-card">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-black">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Reto diario
              </h2>
              <h3 className="font-bold">{recommendations.dailyChallenge.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {recommendations.dailyChallenge.description}
              </p>
              <span className="mt-4 inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                {recommendations.dailyChallenge.rewardHint}
              </span>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => handleDailyChallengeAction("started")}
                  disabled={dailyChallengeStatus !== "idle"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {dailyChallengeStatus === "idle" ? "Guardar reto" : "Reto guardado"}
                </button>
                <button
                  onClick={() => handleDailyChallengeAction("completed")}
                  disabled={dailyChallengeStatus === "completed"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {dailyChallengeStatus === "completed" ? "Completado" : "Marcar completado"}
                </button>
              </div>
            </div>
          </section>

          {analytics && (
            <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black">
                <LineChart className="h-5 w-5 text-primary" />
                Medición privada del motor
              </h2>
              <div className="grid gap-3 text-xs md:grid-cols-4">
                <Metric label="Generadas" value={String(analytics.funnel.generated)} />
                <Metric label="Abiertas" value={String(analytics.funnel.opened)} />
                <Metric label="Interesantes" value={String(analytics.funnel.liked)} />
                <Metric label="Descartadas" value={String(analytics.funnel.dismissed)} />
              </div>
              <div className="mt-3 grid gap-3 text-xs md:grid-cols-4">
                <Metric label="Open rate" value={`${analytics.rates.openRate}%`} />
                <Metric label="Like rate" value={`${analytics.rates.likeRate}%`} />
                <Metric label="Dismiss rate" value={`${analytics.rates.dismissRate}%`} />
                <Metric label="Variante" value={analytics.experiment.currentVariant} />
              </div>
              {Object.keys(analytics.experiment.performance).length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-bold">Variante</th>
                        <th className="px-3 py-2 font-bold">Generadas</th>
                        <th className="px-3 py-2 font-bold">Abiertas</th>
                        <th className="px-3 py-2 font-bold">Likes</th>
                        <th className="px-3 py-2 font-bold">Descartes</th>
                        <th className="px-3 py-2 font-bold">Open rate</th>
                        <th className="px-3 py-2 font-bold">Like rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analytics.experiment.performance).map(([variant, data]) => (
                        <tr key={variant} className="border-t border-border">
                          <td className="px-3 py-2 font-bold">{variant}</td>
                          <td className="px-3 py-2">{data.generated}</td>
                          <td className="px-3 py-2">{data.opened}</td>
                          <td className="px-3 py-2">{data.liked}</td>
                          <td className="px-3 py-2">{data.dismissed}</td>
                          <td className="px-3 py-2">{data.openRate}%</td>
                          <td className="px-3 py-2">{data.likeRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Estas métricas solo usan tus eventos privados. Sirven para validar si el algoritmo
                recomienda mejor con compatibilidad o exploración.
              </p>
            </section>
          )}

          {(savedChallenges.length > 0 || savedAchievements.length > 0) && (
            <section className="grid gap-4 lg:grid-cols-2">
              <ProgressPanel
                icon={Target}
                title="Mis retos guardados"
                emptyLabel="Aun no tienes retos guardados."
                items={savedChallenges.slice(0, 4).map((challenge) => ({
                  id: challenge.id,
                  title: challenge.title,
                  description: challenge.description,
                  status: challenge.status,
                  actionLabel: challenge.status === "completed" ? undefined : "Completar",
                  onAction:
                    challenge.status === "completed"
                      ? undefined
                      : () => handleCompleteSavedChallenge(challenge.id),
                }))}
              />
              <ProgressPanel
                icon={Award}
                title="Mis logros sugeridos"
                emptyLabel="Aun no tienes logros guardados."
                action={
                  savedAchievements.length > 0 ? (
                    <button
                      onClick={handleEvaluateAchievements}
                      disabled={achievementEvaluationLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                    >
                      {achievementEvaluationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Evaluar logros
                    </button>
                  ) : null
                }
                items={savedAchievements.slice(0, 4).map((achievement) => ({
                  id: achievement.id,
                  title: achievement.name,
                  description: achievement.unlock_condition ?? achievement.description,
                  status: achievement.status,
                }))}
              />
            </section>
          )}

          {savedContents.length > 0 && (
            <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black">
                <Sparkles className="h-5 w-5 text-primary" />
                Mis contenidos guardados
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {savedContents.slice(0, 4).map((content) => (
                  <article
                    key={content.id}
                    className="rounded-2xl border border-border bg-background/50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold">{content.title}</h3>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                        {content.content_type === "weekly_brief" ? "Resumen" : "Narrativa"}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
                      {content.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleRecommendations.map((card) => {
              const Icon = cardIcons[card.type] ?? Sparkles;
              return (
                <article
                  key={card.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-1"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-primary/30 px-3 py-1 text-xs font-black text-primary">
                      {card.score}%
                    </span>
                  </div>
                  <h3 className="text-lg font-black">{card.title}</h3>
                  <p className="mt-2 min-h-16 text-sm leading-6 text-muted-foreground">
                    {card.description}
                  </p>
                  <div className="mt-4 space-y-2">
                    {card.reasons.slice(0, 3).map((reason) => (
                      <div key={reason} className="rounded-xl bg-muted px-3 py-2 text-xs">
                        {reason}
                      </div>
                    ))}
                  </div>
                  <Link
                    to={
                      card.type === "player" && card.entityId
                        ? "/app/profile/$userId"
                        : card.type === "venue" && card.entityId
                          ? "/app/courts/$courtId"
                          : "/app"
                    }
                    params={
                      card.type === "player" && card.entityId
                        ? { userId: card.entityId }
                        : card.type === "venue" && card.entityId
                          ? { courtId: card.entityId }
                          : undefined
                    }
                    onClick={() => handleCardAction(card.id, card.entityId)}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-primary/30 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {card.actionLabel}
                  </Link>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRecommendationFeedback(card, "liked")}
                      disabled={cardFeedback[card.id] === "liked"}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {cardFeedback[card.id] === "liked" ? "Guardado" : "Me interesa"}
                    </button>
                    <button
                      onClick={() => handleRecommendationFeedback(card, "dismissed")}
                      disabled={cardFeedback[card.id] === "dismissed"}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-60"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      {cardFeedback[card.id] === "dismissed" ? "Marcado" : "No me sirve"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <InsightCard icon={Award} title={recommendations.achievementIdea.name}>
              <p>{recommendations.achievementIdea.description}</p>
              <strong className="mt-2 block text-foreground">
                {recommendations.achievementIdea.unlockCondition}
              </strong>
              <button
                onClick={handleSaveAchievement}
                disabled={achievementSaved}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {achievementSaved ? "Logro guardado" : "Guardar logro"}
              </button>
            </InsightCard>
            <InsightCard icon={Trophy} title="Resumen semanal">
              <p>{recommendations.weeklyBrief}</p>
              <button
                onClick={handleSaveWeeklyBrief}
                disabled={weeklyBriefSaved}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {weeklyBriefSaved ? "Resumen guardado" : "Guardar resumen"}
              </button>
            </InsightCard>
            <InsightCard icon={Bell} title={recommendations.notificationDraft.title}>
              <p>{recommendations.notificationDraft.body}</p>
              <button
                onClick={handleSaveSmartNotification}
                disabled={smartNotificationSaved}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                <Bell className="h-4 w-4" />
                {smartNotificationSaved ? "Alerta guardada" : "Guardar alerta"}
              </button>
            </InsightCard>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-black">
              <Map className="h-5 w-5 text-primary" />
              Narrativa deportiva
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {recommendations.tourNarrative}
            </p>
            <button
              onClick={handleSaveTourNarrative}
              disabled={tourNarrativeSaved}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {tourNarrativeSaved ? "Narrativa guardada" : "Guardar narrativa"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-black">{value}</div>
    </div>
  );
}

function DiagnosticsCard({ diagnostics }: { diagnostics: EngagementDiagnostics }) {
  const statusLabel = diagnostics.status === "ok" ? "Listo para probar" : "Revisar antes de probar";
  const statusClass =
    diagnostics.status === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Estado de recomendaciones
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{diagnostics.nextRecommendedAction}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-xs md:grid-cols-4">
        <Metric label="Eventos" value={String(diagnostics.database.events?.count ?? 0)} />
        <Metric label="Preferencias" value={String(diagnostics.database.embeddings?.count ?? 0)} />
        <Metric label="Retos" value={String(diagnostics.database.challenges?.count ?? 0)} />
        <Metric label="Contenidos" value={String(diagnostics.database.contents?.count ?? 0)} />
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-background/50 p-3 text-xs">
        <div className="font-bold text-foreground">Servicio de recomendaciones</div>
        <div className="mt-1 text-muted-foreground">
          {diagnostics.vertexAi.status === "ok"
            ? "Disponible para generar contenido personalizado."
            : diagnostics.vertexAi.message}
        </div>
      </div>
    </section>
  );
}

function InsightCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-black">{title}</h3>
      </div>
      <div className="text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

function ProgressPanel({
  icon: Icon,
  title,
  emptyLabel,
  items,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  emptyLabel: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    actionLabel?: string;
    onAction?: () => void;
  }>;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </h2>
        {action}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-background/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                    {item.status}
                  </span>
                  {item.actionLabel && item.onAction ? (
                    <button
                      onClick={item.onAction}
                      className="rounded-full border border-primary/30 px-3 py-1 text-[10px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {item.actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

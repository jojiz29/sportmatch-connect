import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/shared/api/supabase", () => ({
  supabase: {
    auth: { getSession },
  },
}));

describe("engagementApi", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("registra una señal autenticada sin incluir contenido completo", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 201 }));

    const { trackEngagementEvent } = await import("../api/engagementApi");
    await trackEngagementEvent({
      eventType: "POST_CREATED",
      entityType: "post",
      entityId: "post-1",
      metadata: { sport: "Tenis", contentLength: 42 },
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
    expect(request?.body).not.toContain("contenido");
  });

  it("no bloquea la acción principal cuando el backend falla", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 500 }));

    const { trackEngagementEvent } = await import("../api/engagementApi");

    await expect(
      trackEngagementEvent({ eventType: "SPORT_SELECTED", metadata: { sport: "Pádel" } }),
    ).resolves.toBeUndefined();
  });

  it("solicita recomendaciones reales al endpoint de IA", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          summary: "Perfil listo",
          recommendations: [],
          dailyChallenge: { title: "Reto", description: "Juega hoy", rewardHint: "+50 FC" },
          achievementIdea: {
            name: "Constancia",
            description: "Entrena seguido",
            unlockCondition: "3 eventos",
          },
          weeklyBrief: "Semana activa",
          tourNarrative: "Surco desbloqueado",
          notificationDraft: { title: "Nueva idea", body: "Revisa tu coach" },
          metadata: {
            model: "gemini-2.5-flash",
            latencyMs: 900,
            tokens: 120,
            algorithmVersion: "engagement-ai-v1",
            experimentVariant: "A_COMPATIBILITY",
            generatedAt: new Date().toISOString(),
          },
        }),
        { status: 200 },
      ),
    );

    const { getAiRecommendations } = await import("../api/engagementApi");
    const result = await getAiRecommendations({ type: "players", limit: 4, language: "es" });

    expect(result.summary).toBe("Perfil listo");
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/ai/recommend");
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
    expect(request?.body).toContain('"type":"players"');
  });

  it("obtiene recomendaciones diarias cacheadas", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          summary: "Paquete diario",
          recommendations: [],
          dailyChallenge: { title: "Reto", description: "Juega hoy", rewardHint: "+50 FC" },
          achievementIdea: {
            name: "Constancia",
            description: "Entrena seguido",
            unlockCondition: "3 eventos",
          },
          weeklyBrief: "Semana activa",
          tourNarrative: "Surco desbloqueado",
          notificationDraft: { title: "Nueva idea", body: "Revisa tu coach" },
          metadata: {
            model: "gemini-2.5-flash",
            latencyMs: 900,
            tokens: 120,
            algorithmVersion: "engagement-ai-v1",
            experimentVariant: "A_COMPATIBILITY",
            cacheStatus: "hit",
            snapshotId: "snapshot-1",
            expiresAt: new Date().toISOString(),
            generatedAt: new Date().toISOString(),
          },
        }),
        { status: 200 },
      ),
    );

    const { getTodayAiRecommendations } = await import("../api/engagementApi");
    const result = await getTodayAiRecommendations();

    expect(result.metadata.cacheStatus).toBe("hit");
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/engagement/recommendations/today");
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
  });

  it("guarda una notificacion inteligente desde recomendaciones", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "notif-1",
          user_id: "user-1",
          type: "MATCH_ALERT",
          title: "Entrena hoy",
          content: "Tienes una recomendacion lista.",
          link: "/app",
          is_read: false,
          created_at: new Date().toISOString(),
        }),
        { status: 201 },
      ),
    );

    const { saveSmartNotification } = await import("../api/engagementApi");
    const result = await saveSmartNotification({
      title: "Entrena hoy",
      body: "Tienes una recomendacion lista.",
      source: "test",
    });

    expect(result.id).toBe("notif-1");
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/engagement/smart-notification");
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
    expect(request?.body).toContain('"source":"test"');
  });

  it("reconstruye el embedding privado de engagement", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "embedding-1",
          provider: "deterministic-local-v1",
          dimension: 32,
          generatedAt: new Date().toISOString(),
          sampleSize: 6,
        }),
        { status: 201 },
      ),
    );

    const { rebuildEngagementEmbedding } = await import("../api/engagementApi");
    const result = await rebuildEngagementEmbedding();

    expect(result.provider).toBe("deterministic-local-v1");
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/engagement/embedding/rebuild");
    expect(request?.method).toBe("POST");
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
  });

  it("obtiene analytics privados de engagement", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          sampleSize: 3,
          counts: { AI_RECOMMENDATION_GENERATED: 1 },
          funnel: {
            generated: 1,
            opened: 1,
            liked: 1,
            dismissed: 0,
            completedChallenges: 0,
            savedSignals: 1,
          },
          rates: {
            openRate: 100,
            likeRate: 100,
            dismissRate: 0,
            challengeCompletionRate: 0,
          },
          experiment: {
            variants: { A_COMPATIBILITY: 1 },
            currentVariant: "A_COMPATIBILITY",
            performance: {
              A_COMPATIBILITY: {
                generated: 1,
                opened: 1,
                liked: 1,
                dismissed: 0,
                openRate: 100,
                likeRate: 100,
                dismissRate: 0,
              },
            },
          },
          recentEvents: [],
        }),
        { status: 200 },
      ),
    );

    const { getEngagementAnalytics } = await import("../api/engagementApi");
    const result = await getEngagementAnalytics();

    expect(result.rates.openRate).toBe(100);
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/engagement/analytics");
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
  });

  it("obtiene diagnostico operativo de engagement", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          generatedAt: new Date().toISOString(),
          status: "ok",
          database: {
            events: { status: "ok", count: 3, message: "Disponible" },
            embeddings: { status: "ok", count: 1, message: "Disponible" },
          },
          vertexAi: {
            status: "ok",
            model: "gemini-2.5-flash",
            location: "us-central1",
            message: "Configuracion local presente",
          },
          nextRecommendedAction: "Listo para prueba funcional con usuario autenticado",
        }),
        { status: 200 },
      ),
    );

    const { getEngagementDiagnostics } = await import("../api/engagementApi");
    const result = await getEngagementDiagnostics();

    expect(result.status).toBe("ok");
    expect(result.vertexAi.model).toBe("gemini-2.5-flash");
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/engagement/diagnostics");
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
  });

  it("guarda y completa un reto persistente de engagement", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "challenge-1",
            user_id: "user-1",
            title: "Reto diario",
            description: "Juega hoy",
            reward_hint: "+50 FC",
            status: "started",
            source: "engagement_page",
            metadata: {},
            started_at: new Date().toISOString(),
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "challenge-1",
            user_id: "user-1",
            title: "Reto diario",
            description: "Juega hoy",
            status: "completed",
            source: "engagement_page",
            metadata: {},
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          }),
          { status: 200 },
        ),
      );

    const { completeEngagementChallenge, saveEngagementChallenge } =
      await import("../api/engagementApi");
    const saved = await saveEngagementChallenge({
      title: "Reto diario",
      description: "Juega hoy",
      rewardHint: "+50 FC",
    });
    const completed = await completeEngagementChallenge(saved.id);

    expect(completed.status).toBe("completed");
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/api/v1/engagement/challenges");
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain(
      "/api/v1/engagement/challenges/challenge-1/complete",
    );
  });

  it("guarda un logro persistente de engagement", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "achievement-1",
          user_id: "user-1",
          name: "Constancia",
          description: "Entrena seguido",
          unlock_condition: "3 eventos",
          status: "saved",
          source: "engagement_page",
          metadata: {},
          saved_at: new Date().toISOString(),
        }),
        { status: 201 },
      ),
    );

    const { saveEngagementAchievement } = await import("../api/engagementApi");
    const result = await saveEngagementAchievement({
      name: "Constancia",
      description: "Entrena seguido",
      unlockCondition: "3 eventos",
    });

    expect(result.status).toBe("saved");
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/engagement/achievements");
    expect(request?.body).toContain('"unlockCondition":"3 eventos"');
  });

  it("evalua logros guardados y devuelve desbloqueos", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          evaluated: 2,
          unlockedCount: 1,
          achievements: [{ id: "achievement-1", status: "unlocked" }],
        }),
        { status: 200 },
      ),
    );

    const { evaluateEngagementAchievements } = await import("../api/engagementApi");
    const result = await evaluateEngagementAchievements();

    expect(result.unlockedCount).toBe(1);
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/v1/engagement/achievements/evaluate");
    expect(request?.method).toBe("POST");
    expect(request?.headers).toMatchObject({ Authorization: "Bearer jwt-real" });
  });

  it("lista retos y logros persistidos", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "challenge-1" }]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "achievement-1" }]), { status: 200 }),
      );

    const { getEngagementAchievements, getEngagementChallenges } =
      await import("../api/engagementApi");
    const challenges = await getEngagementChallenges();
    const achievements = await getEngagementAchievements();

    expect(challenges[0].id).toBe("challenge-1");
    expect(achievements[0].id).toBe("achievement-1");
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/api/v1/engagement/challenges");
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("/api/v1/engagement/achievements");
  });

  it("guarda y lista contenidos personalizados de engagement", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "jwt-real" } },
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "content-1",
            user_id: "user-1",
            content_type: "weekly_brief",
            title: "Resumen semanal",
            body: "Entrenaste con buena frecuencia.",
            source: "engagement_page",
            metadata: {},
            saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "content-1", content_type: "weekly_brief" }]), {
          status: 200,
        }),
      );

    const { getEngagementContents, saveEngagementContent } = await import("../api/engagementApi");
    const saved = await saveEngagementContent({
      contentType: "weekly_brief",
      title: "Resumen semanal",
      body: "Entrenaste con buena frecuencia.",
    });
    const contents = await getEngagementContents();

    expect(saved.content_type).toBe("weekly_brief");
    expect(contents[0].id).toBe("content-1");
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/api/v1/engagement/contents");
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("/api/v1/engagement/contents");
  });
});

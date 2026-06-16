// ============================================================
// src/features/b2b-ai/__tests__/b2bAiApi.test.ts
// Tests para el cliente HTTP B2B-AI. Anti-mock safeguards +
// validación de host + endpoints correctos + manejo de errores.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/shared/api/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "fake-jwt-token" } },
      }),
    },
  },
}));

const BACKEND_URL = "https://sportmatch-api.onrender.com";

describe("B2B AI API — anti-mock safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_URL", BACKEND_URL);
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("b2bAiApi.ts no contiene catálogos hardcoded de respuestas", async () => {
    const fs = await import("node:fs");
    const source = await fs.promises.readFile("src/features/b2b-ai/api/b2bAiApi.ts", "utf-8");
    expect(source).not.toMatch(/FALLBACK_RECOMMENDATION\s*=/);
    expect(source).not.toMatch(/MOCK_PRICING\s*=/);
    expect(source).not.toMatch(/HARDCODED_VARIANTS\s*=/);
  });

  it("recommendPricing() hace POST a /ai/b2b/pricing", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        recommendedPrice: 62.5,
        baseline: 50,
        deltaPct: 0.25,
        occupancyRate: 0.85,
        confidence: 0.78,
        sampleSize: 24,
        bestHour: 19,
        drivers: [],
        narrative: "Sube el precio",
        metadata: { tokens: 100, model: "gemini-2.5-flash", latencyMs: 1200 },
      }),
    });

    const { recommendPricing } = await import("../api/b2bAiApi");
    const res = await recommendPricing({
      courtId: "court-1",
      date: "2026-06-20",
      hour: 19,
    });
    const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${BACKEND_URL}/api/v1/ai/b2b/pricing`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      courtId: "court-1",
      date: "2026-06-20",
      hour: 19,
    });
    expect(res.recommendedPrice).toBe(62.5);
  });

  it("optimizeAds() hace POST a /ai/b2b/ads/optimize", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        variants: [
          {
            variantId: "B",
            title: "Test",
            description: "Test",
            style: "emocional",
            score: 0.1,
            predictedCtr: 0.1,
          },
        ],
        recommendation: "B",
        expectedLift: 0.02,
        currentCtr: 0.08,
        sampleSize: 100,
        drivers: [],
        narrative: "Cambia a B",
        metadata: { tokens: 100, model: "gemini-2.5-flash", latencyMs: 1500 },
      }),
    });

    const { optimizeAds } = await import("../api/b2bAiApi");
    const res = await optimizeAds({ adId: "ad-1", goal: "ctr" });
    const [url] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${BACKEND_URL}/api/v1/ai/b2b/ads/optimize`);
    expect(res.recommendation).toBe("B");
  });

  it("predictChurn() hace POST a /ai/b2b/churn/predict", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        churnScore: 0.42,
        riskLevel: "medium",
        factors: [],
        daysSinceLastInteraction: 5,
        activeAdsCount: 2,
        totalRevenue: 300,
        totalEngagement: 10,
        drivers: [],
        narrative: "Contacta al cliente",
        metadata: { tokens: 100, model: "gemini-2.5-flash", latencyMs: 800 },
      }),
    });

    const { predictChurn } = await import("../api/b2bAiApi");
    const res = await predictChurn({ businessId: "biz-1", lookbackDays: 30 });
    const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${BACKEND_URL}/api/v1/ai/b2b/churn/predict`);
    expect(JSON.parse(init.body)).toEqual({ businessId: "biz-1", lookbackDays: 30 });
    expect(res.riskLevel).toBe("medium");
  });

  it("lanza error 401 con mensaje user-friendly", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Token expired" }),
    });

    const { recommendPricing } = await import("../api/b2bAiApi");
    await expect(recommendPricing({ courtId: "c1", date: "2026-06-20" })).rejects.toThrow(
      /No autorizado/,
    );
  });

  it("lanza error 403 cuando el usuario no es BUSINESS", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "Forbidden" }),
    });

    const { optimizeAds } = await import("../api/b2bAiApi");
    await expect(optimizeAds({ adId: "ad-1", goal: "ctr" })).rejects.toThrow(
      /Acceso restringido|BUSINESS/,
    );
  });

  it("lanza error 429 con mensaje de rate limit", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ message: "Too many requests" }),
    });

    const { predictChurn } = await import("../api/b2bAiApi");
    await expect(predictChurn({ businessId: "biz-1" })).rejects.toThrow(/demasiadas/i);
  });

  it("rechaza VITE_API_URL que no apunta al backend", async () => {
    vi.stubEnv("VITE_API_URL", "https://sportmatch-frontend.vercel.app");

    const { recommendPricing } = await import("../api/b2bAiApi");
    await expect(recommendPricing({ courtId: "c1", date: "2026-06-20" })).rejects.toThrow(
      /no apunta a un backend/i,
    );
  });
});

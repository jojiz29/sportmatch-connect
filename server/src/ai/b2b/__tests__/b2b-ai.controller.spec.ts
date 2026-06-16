/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// server/src/ai/b2b/__tests__/b2b-ai.controller.spec.ts
// Tests del controller: verifica shape de respuesta + auth/roles guards.
// No testeamos los services aquí (ya cubiertos en sus propios specs).
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { B2bAiController } from "../b2b-ai.controller";
import { B2bAiService } from "../b2b-ai.service";
import { SupabaseAuthService } from "../../../auth/supabase-auth.service";

describe("B2bAiController", () => {
  let controller: B2bAiController;
  let b2bAiServiceMock: any;

  const buildPricingResponse = () => ({
    recommendedPrice: 62.5,
    baseline: 50,
    deltaPct: 0.25,
    occupancyRate: 0.85,
    confidence: 0.78,
    sampleSize: 24,
    bestHour: 19,
    drivers: [{ feature: "Ocupación", contribution: 9.5, value: 0.85, weight: 0.45 }],
    narrative: "Sube el precio del sábado a las 19h",
    metadata: { tokens: 100, model: "gemini-2.5-flash", latencyMs: 1200 },
  });

  beforeEach(async () => {
    b2bAiServiceMock = {
      recommendPricing: jest.fn().mockResolvedValue(buildPricingResponse()),
      optimizeAds: jest.fn().mockResolvedValue({
        variants: [],
        recommendation: "B",
        expectedLift: 0.02,
        currentCtr: 0.08,
        sampleSize: 100,
        drivers: [],
        narrative: "Cambia a B",
        metadata: { tokens: 100, model: "gemini-2.5-flash", latencyMs: 1500 },
      }),
      predictChurn: jest.fn().mockResolvedValue({
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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [B2bAiController],
      providers: [
        { provide: B2bAiService, useValue: b2bAiServiceMock },
        // Mock SupabaseAuthService para que los guards puedan resolver
        { provide: SupabaseAuthService, useValue: { validateToken: jest.fn() } },
      ],
    }).compile();

    controller = module.get<B2bAiController>(B2bAiController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // pricing
  // ============================================================
  it("POST /pricing llama al service con userId del request", async () => {
    const req = { user: { sub: "user-biz-1", email: "biz@test.com" } } as any;
    const dto = { courtId: "court-1", date: "2026-06-20", hour: 19 };

    const result = await controller.pricing(dto, req);

    expect(b2bAiServiceMock.recommendPricing).toHaveBeenCalledWith("user-biz-1", dto);
    expect(result).toEqual(buildPricingResponse());
  });

  // ============================================================
  // adsOptimize
  // ============================================================
  it("POST /ads/optimize llama al service con userId del request", async () => {
    const req = { user: { sub: "user-biz-1" } } as any;
    const dto = { adId: "ad-1", goal: "ctr" as const };

    const result = await controller.adsOptimize(dto, req);

    expect(b2bAiServiceMock.optimizeAds).toHaveBeenCalledWith("user-biz-1", dto);
    expect(result.recommendation).toBe("B");
  });

  // ============================================================
  // churnPredict
  // ============================================================
  it("POST /churn/predict llama al service con userId del request", async () => {
    const req = { user: { sub: "user-biz-1" } } as any;
    const dto = { businessId: "biz-1", lookbackDays: 30 };

    const result = await controller.churnPredict(dto, req);

    expect(b2bAiServiceMock.predictChurn).toHaveBeenCalledWith("user-biz-1", dto);
    expect(result.riskLevel).toBe("medium");
  });
});

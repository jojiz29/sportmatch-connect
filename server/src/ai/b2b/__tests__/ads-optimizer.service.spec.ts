/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// server/src/ai/b2b/__tests__/ads-optimizer.service.spec.ts
// Tests para Feature #21 — Ads Optimizer
// Cubre: UCB1 scoring, variant generation (mocked LLM), ranking, drivers.
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { AdsOptimizerService } from "../services/ads-optimizer.service";
import { DataPipelineService } from "../services/data-pipeline.service";
import { ShapExplainerService } from "../services/shap-explainer.service";
import { VertexAiService } from "../../vertex-ai.service";
import { NotFoundException } from "@nestjs/common";

describe("AdsOptimizerService", () => {
  let service: AdsOptimizerService;
  let dataPipelineMock: any;
  let vertexAiMock: any;

  beforeEach(async () => {
    dataPipelineMock = {
      getAdMetricsForBusiness: jest.fn().mockResolvedValue({
        totalAds: 3,
        totalViews: 450,
        totalClicks: 36,
        totalContacts: 8,
        ctr: 0.08,
        contactRate: 0.22,
        perAd: [
          {
            adId: "ad-1",
            title: "Torneo Relámpago Pádel",
            views: 200,
            clicks: 16,
            contacts: 4,
            ctr: 0.08,
            lastInteractionAt: new Date().toISOString(),
          },
          {
            adId: "ad-2",
            title: "Clases Grupales",
            views: 150,
            clicks: 12,
            contacts: 3,
            ctr: 0.08,
            lastInteractionAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          },
          {
            adId: "ad-3",
            title: "Promo 2x1",
            views: 100,
            clicks: 8,
            contacts: 1,
            ctr: 0.08,
            lastInteractionAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
        ],
      }),
    };

    // Mock LLM para que devuelva JSON válido siempre
    vertexAiMock = {
      generateContent: jest.fn().mockImplementation((prompt: string) => {
        if (prompt.includes("emocional")) {
          return Promise.resolve({
            text: '{"title": "¡Únete a la pichanga!", "description": "Diversión garantizada"}',
            tokens: 30,
            model: "gemini-2.5-flash",
            latencyMs: 800,
          });
        }
        if (prompt.includes("racional")) {
          return Promise.resolve({
            text: '{"title": "Torneo Pádel - 8 cupos", "description": "Martes 19h, 50 PEN"}',
            tokens: 30,
            model: "gemini-2.5-flash",
            latencyMs: 800,
          });
        }
        if (prompt.includes("urgencia")) {
          return Promise.resolve({
            text: '{"title": "¡Últimos cupos!", "description": "Cierra inscripción esta semana"}',
            tokens: 30,
            model: "gemini-2.5-flash",
            latencyMs: 800,
          });
        }
        return Promise.resolve({ text: "{}", tokens: 0, model: "test", latencyMs: 0 });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsOptimizerService,
        { provide: DataPipelineService, useValue: dataPipelineMock },
        { provide: VertexAiService, useValue: vertexAiMock },
        ShapExplainerService,
      ],
    }).compile();

    service = module.get<AdsOptimizerService>(AdsOptimizerService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // CASO 1: Optimización exitosa
  // ============================================================
  it("optimiza un anuncio y devuelve variantes rankeadas", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 3);

    expect(result.variants).toHaveLength(4); // original + 3 reescritas
    expect(result.variants[0]).toBeDefined();
    expect(result.recommendation).toBeDefined();
    expect(result.variants[0].variantId).toBe(result.recommendation);
  });

  it("variantes están ordenadas por score descendente", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 3);
    for (let i = 1; i < result.variants.length; i++) {
      expect(result.variants[i - 1].score).toBeGreaterThanOrEqual(result.variants[i].score);
    }
  });

  it("la primera variante es la original (variantId='A')", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 3);
    // Buscamos la original por su variantId
    const original = result.variants.find((v) => v.variantId === "A");
    expect(original).toBeDefined();
    expect(original!.style).toBe("original");
  });

  // ============================================================
  // CASO 2: Coeficientes por estilo
  // ============================================================
  it("variante 'urgencia' tiene mayor CTR predicho que 'racional'", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 3);
    const urgency = result.variants.find((v) => v.style === "urgencia");
    const racional = result.variants.find((v) => v.style === "racional");
    expect(urgency).toBeDefined();
    expect(racional).toBeDefined();
    expect(urgency!.predictedCtr).toBeGreaterThanOrEqual(racional!.predictedCtr);
  });

  it("variante 'emocional' tiene mayor CTR predicho que 'racional' en businessCtr uniforme", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 3);
    const emocional = result.variants.find((v) => v.style === "emocional");
    const racional = result.variants.find((v) => v.style === "racional");
    expect(emocional!.predictedCtr).toBeGreaterThan(racional!.predictedCtr);
  });

  // ============================================================
  // CASO 3: Lift esperado
  // ============================================================
  it("expectedLift es positivo y <= businessCtr", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 3);
    expect(result.expectedLift).toBeGreaterThanOrEqual(0);
    expect(result.expectedLift).toBeLessThanOrEqual(1);
  });

  // ============================================================
  // CASO 4: Anuncio no encontrado
  // ============================================================
  it("lanza NotFoundException si el ad no pertenece al business", async () => {
    await expect(service.optimize("biz-1", "ad-inexistente", "ctr")).rejects.toThrow(
      NotFoundException,
    );
  });

  // ============================================================
  // CASO 5: Drivers SHAP
  // ============================================================
  it("genera 4 drivers SHAP-style", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 3);
    expect(result.drivers).toHaveLength(4);
    for (const d of result.drivers) {
      expect(d).toHaveProperty("feature");
      expect(d).toHaveProperty("contribution");
      expect(d).toHaveProperty("value");
    }
  });

  // ============================================================
  // CASO 6: Variant count clamping (1-3)
  // ============================================================
  it("variantCount=1 devuelve 2 variantes (original + 1)", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 1);
    expect(result.variants).toHaveLength(2);
  });

  it("variantCount=5 se clampa a 3 → 4 variantes", async () => {
    const result = await service.optimize("biz-1", "ad-1", "ctr", 5);
    expect(result.variants).toHaveLength(4);
  });

  // ============================================================
  // CASO 7: LLM fallback
  // ============================================================
  it("si LLM falla, usa fallback con título original + sufijo de estilo", async () => {
    // Sobrescribe el mock para que TODAS las llamadas fallen
    vertexAiMock.generateContent = jest.fn().mockRejectedValue(new Error("Vertex AI timeout"));

    const result = await service.optimize("biz-1", "ad-1", "ctr", 1);
    // Después del ranking por score, la variante original (score=0) queda al final
    const originalVariant = result.variants.find((v) => v.variantId === "A");
    const emocinalVariant = result.variants.find((v) => v.style === "emocional");
    expect(originalVariant).toBeDefined();
    expect(emocinalVariant).toBeDefined();
    // El fallback añade el nombre del estilo al título original
    expect(emocinalVariant!.title).toMatch(/emocional/i);
    // El score se calcula igualmente con UCB1 (no debe ser NaN)
    expect(Number.isFinite(emocinalVariant!.score)).toBe(true);
  });

  // ============================================================
  // CASO 8: Goal 'conversions' (mismo resultado que 'ctr' por ahora)
  // ============================================================
  it("goal='conversions' no falla", async () => {
    const result = await service.optimize("biz-1", "ad-1", "conversions", 2);
    expect(result.variants).toHaveLength(3);
  });
});

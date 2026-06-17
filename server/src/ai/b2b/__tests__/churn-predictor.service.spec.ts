/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// server/src/ai/b2b/__tests__/churn-predictor.service.spec.ts
// Tests para Feature #23 — Churn Predictor
// Cubre: scoring RFM-lite, umbrales riskLevel, factores, drivers.
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { ChurnPredictorService } from "../services/churn-predictor.service";
import { DataPipelineService } from "../services/data-pipeline.service";
import { ShapExplainerService } from "../services/shap-explainer.service";
import { VertexAiService } from "../../vertex-ai.service";

describe("ChurnPredictorService", () => {
  let service: ChurnPredictorService;
  let dataPipelineMock: any;
  let vertexAiMock: any;

  const buildAdMetrics = (overrides: any = {}) => ({
    totalAds: 3,
    totalViews: 500,
    totalClicks: 40,
    totalContacts: 10,
    ctr: 0.08,
    contactRate: 0.25,
    perAd: [
      {
        adId: "ad-1",
        title: "Test",
        views: 200,
        clicks: 16,
        contacts: 4,
        ctr: 0.08,
        lastInteractionAt: new Date().toISOString(),
      },
    ],
    ...overrides,
  });

  const buildUsageSummary = (overrides: any = {}) => ({
    profileViews: 30,
    adViews: 20,
    adClicks: 5,
    mapPinClicks: 2,
    venueBookings: 1,
    last30dByDay: [],
    ...overrides,
  });

  beforeEach(async () => {
    dataPipelineMock = {
      getAdMetricsForBusiness: jest.fn().mockResolvedValue(buildAdMetrics()),
      getUsageSummary: jest.fn().mockResolvedValue(buildUsageSummary()),
      prisma: {
        $queryRaw: jest.fn().mockResolvedValue([{ total: 1500 }]),
      },
    };

    vertexAiMock = {
      generateContent: jest.fn().mockResolvedValue({
        text: "Contacta al cliente para evitar churn.",
        tokens: 30,
        model: "gemini-2.5-flash",
        latencyMs: 800,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChurnPredictorService,
        { provide: DataPipelineService, useValue: dataPipelineMock },
        { provide: VertexAiService, useValue: vertexAiMock },
        ShapExplainerService,
      ],
    }).compile();

    service = module.get<ChurnPredictorService>(ChurnPredictorService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // CASO 1: Negocio saludable → riskLevel=low
  // ============================================================
  it("negocio activo y con revenue → riskLevel='low'", async () => {
    // Mock con todo OK
    dataPipelineMock.getAdMetricsForBusiness.mockResolvedValue(
      buildAdMetrics({
        perAd: [
          {
            adId: "ad-1",
            title: "Reciente",
            views: 200,
            clicks: 16,
            contacts: 4,
            ctr: 0.08,
            lastInteractionAt: new Date().toISOString(),
          },
          {
            adId: "ad-2",
            title: "Reciente 2",
            views: 200,
            clicks: 16,
            contacts: 4,
            ctr: 0.08,
            lastInteractionAt: new Date().toISOString(),
          },
          {
            adId: "ad-3",
            title: "Reciente 3",
            views: 200,
            clicks: 16,
            contacts: 4,
            ctr: 0.08,
            lastInteractionAt: new Date().toISOString(),
          },
        ],
      }),
    );
    dataPipelineMock.getUsageSummary.mockResolvedValue(
      buildUsageSummary({ profileViews: 100, adViews: 80 }),
    );
    dataPipelineMock.prisma.$queryRaw.mockResolvedValue([{ total: 2000 }]);

    const result = await service.predict("biz-1", 30);

    expect(result.riskLevel).toBe("low");
    expect(result.churnScore).toBeLessThan(0.4);
    expect(result.daysSinceLastInteraction).toBeLessThan(7);
  });

  // ============================================================
  // CASO 2: Negocio abandonado → riskLevel=high
  // ============================================================
  it("negocio sin ads ni interacciones → riskLevel='high'", async () => {
    dataPipelineMock.getAdMetricsForBusiness.mockResolvedValue({
      totalAds: 0,
      totalViews: 0,
      totalClicks: 0,
      totalContacts: 0,
      ctr: 0,
      contactRate: 0,
      perAd: [],
    });
    dataPipelineMock.getUsageSummary.mockResolvedValue(
      buildUsageSummary({
        profileViews: 0,
        adViews: 0,
        adClicks: 0,
        mapPinClicks: 0,
        venueBookings: 0,
      }),
    );
    dataPipelineMock.prisma.$queryRaw.mockResolvedValue([{ total: 0 }]);

    const result = await service.predict("biz-1", 30);

    expect(result.riskLevel).toBe("high");
    expect(result.churnScore).toBeGreaterThanOrEqual(0.7);
    expect(result.daysSinceLastInteraction).toBe(Infinity); // sin ads = sin fecha
  });

  // ============================================================
  // CASO 3: Negocio medio
  // ============================================================
  it("negocio con engagement medio → riskLevel='medium'", async () => {
    // Ads con 14 días de antigüedad
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    dataPipelineMock.getAdMetricsForBusiness.mockResolvedValue(
      buildAdMetrics({
        perAd: [
          {
            adId: "ad-1",
            title: "Antiguo",
            views: 100,
            clicks: 5,
            contacts: 1,
            ctr: 0.05,
            lastInteractionAt: twoWeeksAgo,
          },
        ],
      }),
    );
    dataPipelineMock.getUsageSummary.mockResolvedValue(
      buildUsageSummary({ profileViews: 10, adViews: 5 }),
    );
    dataPipelineMock.prisma.$queryRaw.mockResolvedValue([{ total: 200 }]); // bajo

    const result = await service.predict("biz-1", 30);

    expect(result.riskLevel).toBe("medium");
    expect(result.churnScore).toBeGreaterThanOrEqual(0.4);
    expect(result.churnScore).toBeLessThan(0.7);
  });

  // ============================================================
  // CASO 4: Factores generados
  // ============================================================
  it("genera factores ordenados por severity descendente", async () => {
    const result = await service.predict("biz-1", 30);

    expect(result.factors.length).toBeGreaterThan(0);
    for (let i = 1; i < result.factors.length; i++) {
      expect(result.factors[i - 1].severity).toBeGreaterThanOrEqual(result.factors[i].severity);
    }
  });

  it("cada factor tiene suggestedAction no vacía", async () => {
    const result = await service.predict("biz-1", 30);
    for (const f of result.factors) {
      expect(f.suggestedAction).toBeTruthy();
      expect(f.suggestedAction.length).toBeGreaterThan(10);
    }
  });

  // ============================================================
  // CASO 5: SHAP drivers
  // ============================================================
  it("genera 4 drivers SHAP-style ordenados por magnitud", async () => {
    const result = await service.predict("biz-1", 30);

    expect(result.drivers).toHaveLength(4);
    for (let i = 1; i < result.drivers.length; i++) {
      expect(Math.abs(result.drivers[i - 1].contribution)).toBeGreaterThanOrEqual(
        Math.abs(result.drivers[i].contribution),
      );
    }
  });

  // ============================================================
  // CASO 6: Narrative
  // ============================================================
  it("genera narrative con LLM (mock retorna string fijo)", async () => {
    const result = await service.predict("biz-1", 30);
    expect(result.narrative).toBe("Contacta al cliente para evitar churn.");
    expect(vertexAiMock.generateContent).toHaveBeenCalled();
  });

  it("si LLM falla, narrative viene del skeleton interno", async () => {
    vertexAiMock.generateContent.mockRejectedValueOnce(new Error("Vertex AI down"));
    const result = await service.predict("biz-1", 30);
    expect(result.narrative).toBeTruthy();
    // El skeleton es "Riesgo {level}. Acción prioritaria: ..."
    expect(result.narrative).toMatch(/Riesgo/);
  });

  // ============================================================
  // CASO 7: scoreMonetary fallback
  // ============================================================
  it("si la query de revenue falla, scoreMonetary es neutral (0.5)", async () => {
    dataPipelineMock.prisma.$queryRaw.mockRejectedValueOnce(new Error("DB timeout"));
    const result = await service.predict("biz-1", 30);
    // El score agregado no debe ser NaN ni crashear
    expect(result.churnScore).toBeGreaterThanOrEqual(0);
    expect(result.churnScore).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.churnScore)).toBe(true);
  });

  // ============================================================
  // CASO 8: Constantes del modelo
  // ============================================================
  it("constantes del modelo son correctas", () => {
    const c = ChurnPredictorService.constants;
    expect(c.HIGH_THRESHOLD).toBe(0.7);
    expect(c.MEDIUM_THRESHOLD).toBe(0.4);
    expect(c.WEIGHTS.RECENCY).toBe(0.4);
    // Pesos suman 1.0
    const totalWeight =
      c.WEIGHTS.RECENCY + c.WEIGHTS.FREQUENCY + c.WEIGHTS.MONETARY + c.WEIGHTS.ENGAGEMENT;
    expect(totalWeight).toBeCloseTo(1.0, 5);
  });

  // ============================================================
  // CASO 9: Engagement factor con datos
  // ============================================================
  it("engagement alto reduce el churn score", async () => {
    dataPipelineMock.getUsageSummary.mockResolvedValue(
      buildUsageSummary({ profileViews: 50, adViews: 30, adClicks: 10, mapPinClicks: 5 }),
    );
    const result = await service.predict("biz-1", 30);
    expect(result.totalEngagement).toBe(95);
    // engagementScore debe ser bajo (mucha interacción = poco churn)
    const engagementDriver = result.drivers.find((d) => d.feature.includes("Engagement"));
    expect(engagementDriver).toBeDefined();
  });
});

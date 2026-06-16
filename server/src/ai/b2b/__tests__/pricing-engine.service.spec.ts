/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// server/src/ai/b2b/__tests__/pricing-engine.service.spec.ts
// Tests para Feature #9 — Dynamic Pricing Engine
// Cubre: heurística de ocupación, modificadores temporales, clamps,
// confianza, sample size, SHAP-style contributions.
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { PricingEngineService } from "../services/pricing-engine.service";
import { DataPipelineService, HourOccupancy } from "../services/data-pipeline.service";
import { ShapExplainerService } from "../services/shap-explainer.service";

describe("PricingEngineService", () => {
  let service: PricingEngineService;
  let dataPipelineMock: any;

  // Helper para construir un array de 24 horas con occupancy predefinido
  const buildOccupancy = (occupancyByHour: number[]): HourOccupancy[] => {
    if (occupancyByHour.length !== 24) {
      throw new Error("buildOccupancy requiere 24 entradas (0..23)");
    }
    return occupancyByHour.map((rate, hour) => ({
      hour,
      bookedSlots: Math.round(rate * 28),
      totalSlots: 28,
      occupancyRate: rate,
    }));
  };

  beforeEach(async () => {
    dataPipelineMock = {
      getCourtForBusiness: jest.fn().mockResolvedValue({
        id: "court-1",
        name: "Cancha Test",
        sport: "Pádel",
        price_per_hour: 50,
        operating_hours: ["08:00-22:00"],
        district: "Miraflores",
      }),
      getHourlyOccupancy: jest
        .fn()
        .mockResolvedValue(buildOccupancy(new Array(24).fill(0).map(() => 0.5))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingEngineService,
        { provide: DataPipelineService, useValue: dataPipelineMock },
        ShapExplainerService,
      ],
    }).compile();

    service = module.get<PricingEngineService>(PricingEngineService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // CASO 1: Slot de baja ocupación entre semana → debe recomendar descuento
  // ============================================================
  describe("Baja ocupación (martes 10am)", () => {
    beforeEach(() => {
      // 10h = baja ocupación (0.2), resto neutral
      const occ = new Array(24).fill(0.5);
      occ[10] = 0.2;
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(buildOccupancy(occ));
    });

    it("recomienda precio por debajo del baseline (martes 10h)", async () => {
      const result = await service.recommend(
        "court-1",
        "biz-1",
        "2026-06-16", // martes
        10,
      );

      expect(result.baseline).toBe(50);
      expect(result.recommendedPrice).toBeLessThan(50);
      expect(result.deltaPct).toBeLessThan(0);
      expect(result.recommendedPrice).toBeGreaterThanOrEqual(50 * 0.75); // -25% cap
    });

    it("marca el slot como hora valle", async () => {
      const result = await service.recommend("court-1", "biz-1", "2026-06-16", 10);
      const valleFeature = result.drivers.find((d) => d.feature.includes("valle"));
      expect(valleFeature).toBeDefined();
      expect(valleFeature!.value).toBe(1);
    });
  });

  // ============================================================
  // CASO 2: Slot de alta ocupación en hora pico de fin de semana
  // ============================================================
  describe("Alta ocupación (sábado 19h)", () => {
    beforeEach(() => {
      const occ = new Array(24).fill(0.5);
      occ[19] = 0.9;
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(buildOccupancy(occ));
    });

    it("recomienda precio por encima del baseline (sábado 19h)", async () => {
      const result = await service.recommend("court-1", "biz-1", "2026-06-20", 19);

      expect(result.recommendedPrice).toBeGreaterThan(50);
      expect(result.deltaPct).toBeGreaterThan(0);
      // Hard cap +30%
      expect(result.recommendedPrice).toBeLessThanOrEqual(50 * 1.3);
    });

    it("ocupación y hora pico son los drivers top", async () => {
      const result = await service.recommend("court-1", "biz-1", "2026-06-20", 19);
      const top = result.drivers[0];
      // El driver top debe ser el de mayor magnitud (ocupación o peak hour)
      expect(["Ocupación del slot", "Hora pico (18-21h)"]).toContain(top.feature);
      expect(top.contribution).not.toBe(0);
    });
  });

  // ============================================================
  // CASO 3: Slot neutral entre semana
  // ============================================================
  describe("Slot neutral (miércoles 15h)", () => {
    beforeEach(() => {
      // 15h con ocupación media (0.5), ni pico ni valle
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(
        buildOccupancy(new Array(24).fill(0.5)),
      );
    });

    it("recomienda precio cercano al baseline (±5%)", async () => {
      const result = await service.recommend("court-1", "biz-1", "2026-06-17", 15);

      expect(Math.abs(result.deltaPct)).toBeLessThan(0.05);
      expect(result.recommendedPrice).toBeGreaterThanOrEqual(50 * 0.95);
      expect(result.recommendedPrice).toBeLessThanOrEqual(50 * 1.05);
    });
  });

  // ============================================================
  // CASO 4: Sin hora especificada → devuelve bestHour
  // ============================================================
  describe("Sin hora específica", () => {
    it("devuelve bestHour = hora con mayor ocupación histórica", async () => {
      const occ = new Array(24).fill(0.3);
      occ[20] = 0.95;
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(buildOccupancy(occ));

      const result = await service.recommend("court-1", "biz-1", "2026-06-20");

      expect(result.bestHour).toBe(20);
      expect(result.occupancyRate).toBeGreaterThan(0.9);
    });
  });

  // ============================================================
  // CASO 5: Confianza basada en muestra
  // ============================================================
  describe("Confianza", () => {
    it("confianza base ~0.3 cuando hay 0 bookings históricos", async () => {
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(buildOccupancy(new Array(24).fill(0)));
      const result = await service.recommend("court-1", "biz-1", "2026-06-20", 19);
      expect(result.confidence).toBeCloseTo(0.3, 1);
    });

    it("confianza sube con más bookings (cap a 1.0)", async () => {
      // 24 bookings por hora = muestra saludable
      const occ = new Array(24).fill(0.5);
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(buildOccupancy(occ));
      const result = await service.recommend("court-1", "biz-1", "2026-06-20", 19);
      // 24h * 14 bookings = 336 -> confianza ~ 0.3 + 336*0.03 = 10.38, cap a 1.0
      expect(result.confidence).toBe(1.0);
    });
  });

  // ============================================================
  // CASO 6: Guard de autoría (cancha no pertenece al business)
  // ============================================================
  describe("Guard de autorización", () => {
    it("lanza error si la cancha no es del negocio", async () => {
      dataPipelineMock.getCourtForBusiness.mockRejectedValueOnce(
        new Error("Court court-1 not found or not owned by business other-biz"),
      );

      await expect(service.recommend("court-1", "other-biz", "2026-06-20", 19)).rejects.toThrow(
        /not found or not owned/i,
      );
    });
  });

  // ============================================================
  // CASO 7: SHAP drivers — integridad estructural
  // ============================================================
  describe("SHAP-style drivers", () => {
    it("devuelve exactamente 5 drivers ordenados por |contribution|", async () => {
      const result = await service.recommend("court-1", "biz-1", "2026-06-20", 19);
      expect(result.drivers).toHaveLength(5);

      // Verificar orden descendente por magnitud
      for (let i = 1; i < result.drivers.length; i++) {
        expect(Math.abs(result.drivers[i - 1].contribution)).toBeGreaterThanOrEqual(
          Math.abs(result.drivers[i].contribution),
        );
      }

      // Verificar shape de cada driver
      for (const d of result.drivers) {
        expect(d).toHaveProperty("feature");
        expect(d).toHaveProperty("contribution");
        expect(d).toHaveProperty("value");
        expect(typeof d.contribution).toBe("number");
        expect(d.weight).toBeGreaterThan(0);
        expect(d.weight).toBeLessThanOrEqual(1);
      }
    });

    it("contribución total está en rango plausible vs delta absoluto del precio", async () => {
      const result = await service.recommend("court-1", "biz-1", "2026-06-20", 19);
      const totalContribution = Math.abs(
        result.drivers.reduce((s, d) => s + d.contribution, 0),
      );
      const expectedDelta = Math.abs(result.recommendedPrice - result.baseline);
      // Las contributions son SHAP-style (no must exactly = delta).
      // Comprobamos solo que estén en el mismo orden de magnitud.
      const ratio = totalContribution / Math.max(expectedDelta, 0.01);
      expect(ratio).toBeGreaterThan(0.2);
      expect(ratio).toBeLessThan(5);
    });
  });

  // ============================================================
  // CASO 8: Hard caps
  // ============================================================
  describe("Hard caps de subida/bajada", () => {
    it("nunca sube más del 30% del baseline aunque todo esté al máximo", async () => {
      const occ = new Array(24).fill(1.0); // 100% ocupado en todas las horas
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(buildOccupancy(occ));

      const result = await service.recommend("court-1", "biz-1", "2026-06-20", 19);
      // baseline 50, cap 1.3x = 65
      expect(result.recommendedPrice).toBeLessThanOrEqual(50 * 1.3 + 0.01);
    });

    it("nunca baja más del 25% del baseline aunque todo esté vacío", async () => {
      const occ = new Array(24).fill(0.0); // 0% ocupado
      dataPipelineMock.getHourlyOccupancy.mockResolvedValue(buildOccupancy(occ));

      const result = await service.recommend("court-1", "biz-1", "2026-06-16", 10);
      // baseline 50, cap 0.75x = 37.5
      expect(result.recommendedPrice).toBeGreaterThanOrEqual(50 * 0.75 - 0.01);
    });
  });
});

// ============================================================
// Tests adicionales para el ShapExplainerService
// ============================================================
describe("ShapExplainerService", () => {
  let service: ShapExplainerService;

  beforeEach(() => {
    service = new ShapExplainerService();
  });

  it("computeContributions ordena por magnitud descendente", () => {
    const result = service.computeContributions(
      [
        { name: "A", value: 0.9, weight: 0.5, positiveDirection: true, baseline: 0.5 },
        { name: "B", value: 0.1, weight: 0.2, positiveDirection: false, baseline: 0.5 },
        { name: "C", value: 0.7, weight: 0.3, positiveDirection: true, baseline: 0.5 },
      ],
      100,
    );

    // A: |40|, B: |16|, C: |12| → orden esperado A > B > C
    expect(result[0].feature).toBe("A");
    expect(result[1].feature).toBe("B");
    expect(result[2].feature).toBe("C");
  });

  it("dirección positiva: valor > baseline → contribution > 0", () => {
    const result = service.computeContributions(
      [{ name: "X", value: 0.9, weight: 0.5, positiveDirection: true, baseline: 0.5 }],
      100,
    );
    expect(result[0].contribution).toBeGreaterThan(0);
  });

  it("dirección negativa: valor > baseline → contribution < 0", () => {
    const result = service.computeContributions(
      [{ name: "X", value: 0.9, weight: 0.5, positiveDirection: false, baseline: 0.5 }],
      100,
    );
    expect(result[0].contribution).toBeLessThan(0);
  });

  it("buildSkeletonNarrative devuelve esqueleto en español", () => {
    const contribs = [
      { feature: "Ocupación", contribution: 5, value: 0.9, weight: 0.5 },
      { feature: "Hora pico", contribution: 2, value: 1, weight: 0.2 },
    ];
    const narrative = service.buildSkeletonNarrative(contribs, {
      direction: "up",
      magnitude: 0.15,
    });
    expect(narrative).toMatch(/sube/);
    expect(narrative).toMatch(/Ocupación/);
  });

  it("buildSkeletonNarrative con array vacío devuelve fallback", () => {
    const narrative = service.buildSkeletonNarrative([], { direction: "flat", magnitude: 0 });
    expect(narrative).toMatch(/No hay suficientes datos/i);
  });
});

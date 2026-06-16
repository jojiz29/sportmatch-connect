/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// server/src/ai/b2b/__tests__/data-pipeline.service.spec.ts
// Tests para DataPipelineService: ocupación horaria, ad metrics,
// usage summary, y fallbacks ante tablas vacías o errores SQL.
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { DataPipelineService } from "../services/data-pipeline.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("DataPipelineService", () => {
  let service: DataPipelineService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      courts: {
        findFirst: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DataPipelineService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<DataPipelineService>(DataPipelineService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // getCourtForBusiness
  // ============================================================
  describe("getCourtForBusiness", () => {
    it("devuelve la cancha si pertenece al business", async () => {
      prismaMock.courts.findFirst.mockResolvedValue({
        id: "court-1",
        name: "Cancha Test",
        sport: "Pádel",
        price_per_hour: 50,
        operating_hours: ["08:00-22:00"],
        district: "Miraflores",
      });

      const result = await service.getCourtForBusiness("court-1", "biz-1");
      expect(result.id).toBe("court-1");
      expect(prismaMock.courts.findFirst).toHaveBeenCalledWith({
        where: { id: "court-1", owner_id: "biz-1" },
        select: {
          id: true,
          name: true,
          sport: true,
          price_per_hour: true,
          operating_hours: true,
          district: true,
        },
      });
    });

    it("lanza error si la cancha no existe o no es del business", async () => {
      prismaMock.courts.findFirst.mockResolvedValue(null);
      await expect(service.getCourtForBusiness("court-1", "other-biz")).rejects.toThrow(
        /not found or not owned/,
      );
    });
  });

  // ============================================================
  // getHourlyOccupancy
  // ============================================================
  describe("getHourlyOccupancy", () => {
    it("construye 24 entradas con occupancy correcta", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([
        { time: "09:00-10:00" },
        { time: "19:00-20:00" },
        { time: "19:00" },
      ]);

      const result = await service.getHourlyOccupancy("court-1", 28);
      expect(result).toHaveLength(24);
      expect(result[9].bookedSlots).toBe(1);
      expect(result[19].bookedSlots).toBe(2);
      expect(result[0].bookedSlots).toBe(0);
    });

    it("devuelve todas las horas con 0 bookings si no hay data", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.getHourlyOccupancy("court-1", 28);
      expect(result).toHaveLength(24);
      expect(result.every((h) => h.bookedSlots === 0)).toBe(true);
    });

    it("ignora time_slots con formato inválido", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([
        { time: "abc" },
        { time: "" },
        { time: "25:00" }, // hora inválida
        { time: "10:00" },
      ]);
      const result = await service.getHourlyOccupancy("court-1", 28);
      expect(result[10].bookedSlots).toBe(1);
      expect(result.every((h) => h.bookedSlots <= 1)).toBe(true);
    });
  });

  // ============================================================
  // getAdMetricsForBusiness
  // ============================================================
  describe("getAdMetricsForBusiness", () => {
    it("devuelve métricas agregadas cuando business_ads tiene datos", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([
        {
          id: "ad-1",
          title: "Torneo",
          views: 100,
          clicks: 10,
          contacts: 2,
          created_at: new Date("2026-06-01"),
        },
        {
          id: "ad-2",
          title: "Clases",
          views: 50,
          clicks: 5,
          contacts: 1,
          created_at: new Date("2026-06-15"),
        },
      ]);

      const result = await service.getAdMetricsForBusiness("biz-1");
      expect(result.totalAds).toBe(2);
      expect(result.totalViews).toBe(150);
      expect(result.totalClicks).toBe(15);
      expect(result.ctr).toBeCloseTo(0.1, 3);
      expect(result.perAd).toHaveLength(2);
      expect(result.perAd[0].lastInteractionAt).toBe("2026-06-01T00:00:00.000Z");
    });

    it("devuelve empty cuando business_ads no tiene datos", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.getAdMetricsForBusiness("biz-1");
      expect(result.totalAds).toBe(0);
      expect(result.ctr).toBe(0);
      expect(result.perAd).toEqual([]);
    });

    it("devuelve empty si la query falla (tabla no existe en Prisma)", async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(new Error("relation does not exist"));
      const result = await service.getAdMetricsForBusiness("biz-1");
      expect(result.totalAds).toBe(0);
      // No debe crashear — fallback graceful
    });

    it("maneja views/clicks/contacts NULL", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([
        {
          id: "ad-1",
          title: "X",
          views: null,
          clicks: null,
          contacts: null,
          created_at: new Date(),
        },
      ]);
      const result = await service.getAdMetricsForBusiness("biz-1");
      expect(result.perAd[0].views).toBe(0);
      expect(result.perAd[0].clicks).toBe(0);
    });
  });

  // ============================================================
  // getUsageSummary
  // ============================================================
  describe("getUsageSummary", () => {
    it("agrega usage_metrics por tipo", async () => {
      prismaMock.$queryRaw.mockResolvedValueOnce([
        { metric_type: "profile_view", total: 30n, day_bucket: new Date("2026-06-15") },
        { metric_type: "ad_view", total: 20n, day_bucket: new Date("2026-06-15") },
        { metric_type: "profile_view", total: 10n, day_bucket: new Date("2026-06-16") },
      ]);

      const result = await service.getUsageSummary("biz-1", 30);
      expect(result.profileViews).toBe(40);
      expect(result.adViews).toBe(20);
      expect(result.adClicks).toBe(0);
      expect(result.last30dByDay).toHaveLength(2);
    });

    it("devuelve empty si la query falla (migración no aplicada)", async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(new Error("relation does not exist"));
      const result = await service.getUsageSummary("biz-1", 30);
      expect(result.profileViews).toBe(0);
      expect(result.last30dByDay).toEqual([]);
    });
  });
});

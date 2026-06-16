/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// courts.service.spec.ts — Tests para CourtsService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { CourtsService } from "./courts.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("CourtsService", () => {
  let service: CourtsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      courts: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      reviews: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("debe buscar canchas sin filtros", async () => {
      prismaMock.courts.findMany.mockResolvedValue([{ id: "c1" }]);
      const res = await service.findAll();
      expect(prismaMock.courts.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
      expect(res).toEqual([{ id: "c1" }]);
    });

    it("debe buscar canchas filtrando por deporte y distrito", async () => {
      prismaMock.courts.findMany.mockResolvedValue([]);
      await service.findAll("futbol", "surco");
      expect(prismaMock.courts.findMany).toHaveBeenCalledWith({
        where: { sport: "futbol", district: "surco" },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });
  });

  describe("findOne", () => {
    it("debe devolver la cancha si existe", async () => {
      const mockCourt = { id: "c1" };
      prismaMock.courts.findUnique.mockResolvedValue(mockCourt);
      const res = await service.findOne("c1");
      expect(res).toEqual(mockCourt);
    });

    it("debe lanzar NotFoundException si la cancha no existe", async () => {
      prismaMock.courts.findUnique.mockResolvedValue(null);
      await expect(service.findOne("c2")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("debe crear una cancha con is_available en true", async () => {
      const dto = {
        name: "Cancha 1",
        sport: "tenis",
        district: "miraflores",
        address: "Av Larco 123",
        price_per_hour: 40,
      } as any;
      prismaMock.courts.create.mockResolvedValue({ id: "new-court", ...dto, is_available: true });

      const res = await service.create(dto);
      expect(prismaMock.courts.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          is_available: true,
        },
      });
      expect(res.id).toBe("new-court");
    });
  });

  describe("update", () => {
    it("debe actualizar la cancha si existe", async () => {
      prismaMock.courts.findUnique.mockResolvedValue({ id: "c1" });
      prismaMock.courts.update.mockResolvedValue({ id: "c1", name: "nuevo nombre" });

      const res = await service.update("c1", { name: "nuevo nombre" });
      expect(res.name).toBe("nuevo nombre");
    });

    it("debe lanzar NotFoundException si no existe al actualizar", async () => {
      prismaMock.courts.findUnique.mockResolvedValue(null);
      await expect(service.update("c2", { name: "test" })).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("debe eliminar la cancha si existe", async () => {
      prismaMock.courts.findUnique.mockResolvedValue({ id: "c1" });
      prismaMock.courts.delete.mockResolvedValue({ id: "c1" });

      const res = await service.delete("c1");
      expect(res.id).toBe("c1");
    });

    it("debe lanzar NotFoundException si no existe al eliminar", async () => {
      prismaMock.courts.findUnique.mockResolvedValue(null);
      await expect(service.delete("c2")).rejects.toThrow(NotFoundException);
    });
  });

  describe("createReview", () => {
    it("debe lanzar NotFoundException si la cancha no existe", async () => {
      prismaMock.courts.findUnique.mockResolvedValue(null);
      await expect(
        service.createReview("c1", "u1", { rating: 5, comment: "excelente" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("debe crear reseña y actualizar el promedio del rating en la cancha", async () => {
      prismaMock.courts.findUnique.mockResolvedValue({ id: "c1" });
      prismaMock.reviews.create.mockResolvedValue({ id: "r1", rating: 5 });
      prismaMock.reviews.findMany.mockResolvedValue([{ rating: 4 }, { rating: 5 }]);
      prismaMock.courts.update.mockResolvedValue({ id: "c1" });

      const res = await service.createReview("c1", "u1", { rating: 5, comment: "excelente" });

      expect(prismaMock.reviews.create).toHaveBeenCalledWith({
        data: {
          court_id: "c1",
          user_id: "u1",
          rating: 5,
          comment: "excelente",
        },
        include: expect.any(Object),
      });
      expect(prismaMock.courts.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: {
          rating: 4.5,
          reviews_count: 2,
        },
      });
      expect(res).toEqual({ id: "r1", rating: 5 });
    });
  });
});

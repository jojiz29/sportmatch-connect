/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// sports.service.spec.ts — Tests para SportsService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { SportsService } from "./sports.service";
import { PrismaService } from "../prisma/prisma.service";

describe("SportsService", () => {
  let service: SportsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      sports: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<SportsService>(SportsService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("debe retornar todos los deportes ordenados por nombre", async () => {
      prismaMock.sports.findMany.mockResolvedValue([
        { id: "s1", name: "Fútbol" },
        { id: "s2", name: "Tenis" },
      ]);

      const result = await service.findAll();

      expect(prismaMock.sports.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
      });
      expect(result).toEqual([
        { id: "s1", name: "Fútbol" },
        { id: "s2", name: "Tenis" },
      ]);
    });
  });
});

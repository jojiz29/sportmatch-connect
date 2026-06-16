/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// users.service.spec.ts — Tests para UsersService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";

describe("UsersService", () => {
  let service: UsersService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      $queryRawUnsafe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("debe retornar la lista de usuarios consultando la base de datos", async () => {
      const mockResult = [{ id: "1", name: "User 1" }];
      prismaMock.$queryRawUnsafe.mockResolvedValue(mockResult);

      const result = await service.findAll();

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, name, avatar_url, city FROM profiles LIMIT 30"),
      );
      expect(result).toEqual(mockResult);
    });

    it("debe capturar y relanzar el error si la consulta falla", async () => {
      const error = new Error("DB Error");
      prismaMock.$queryRawUnsafe.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow("DB Error");
    });
  });

  describe("getLeaderboard", () => {
    it("debe retornar la tabla de clasificación ordenada por FitCoins", async () => {
      const mockResult = [{ id: "1", name: "User 1", fitcoins_balance: 100 }];
      prismaMock.$queryRawUnsafe.mockResolvedValue(mockResult);

      const result = await service.getLeaderboard();

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("fitcoins_balance DESC LIMIT 20"),
      );
      expect(result).toEqual(mockResult);
    });

    it("debe capturar y relanzar el error si la consulta del leaderboard falla", async () => {
      const error = new Error("DB Error");
      prismaMock.$queryRawUnsafe.mockRejectedValue(error);

      await expect(service.getLeaderboard()).rejects.toThrow("DB Error");
    });
  });
});

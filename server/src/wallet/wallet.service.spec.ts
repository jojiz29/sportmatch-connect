/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// wallet.service.spec.ts — Tests unitarios para WalletService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { WalletService } from "./wallet.service";
import { PrismaService } from "../prisma/prisma.service";

describe("WalletService", () => {
  let service: WalletService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      profiles: {
        findUnique: jest.fn(),
      },
      wallet_transactions: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("getBalance", () => {
    it("debe devolver el saldo del usuario si existe", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue({ fitcoins_balance: 150.5 });

      const balance = await service.getBalance("user-123");

      expect(prismaMock.profiles.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: { fitcoins_balance: true },
      });
      expect(balance).toBe(150.5);
    });

    it("debe devolver 0 si el perfil no existe", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue(null);

      const balance = await service.getBalance("non-existent");

      expect(balance).toBe(0);
    });

    it("debe devolver 0 si fitcoins_balance es null o undefined", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue({ fitcoins_balance: null });

      const balance = await service.getBalance("user-null");

      expect(balance).toBe(0);
    });
  });

  describe("getTransactions", () => {
    it("debe devolver la lista de transacciones del usuario", async () => {
      const mockTx = [
        {
          id: 1,
          user_id: "user-123",
          amount: 10,
          description: "Earn",
          type: "EARN",
          created_at: new Date(),
        },
        {
          id: 2,
          user_id: "user-123",
          amount: -5,
          description: "Spend",
          type: "SPEND",
          created_at: new Date(),
        },
      ];
      prismaMock.wallet_transactions.findMany.mockResolvedValue(mockTx);

      const result = await service.getTransactions("user-123");

      expect(prismaMock.wallet_transactions.findMany).toHaveBeenCalledWith({
        where: { user_id: "user-123" },
        orderBy: { created_at: "desc" },
      });
      expect(result).toEqual(mockTx);
    });
  });
});

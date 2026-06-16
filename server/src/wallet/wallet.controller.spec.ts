/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// wallet.controller.spec.ts — Tests unitarios para WalletController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("WalletController", () => {
  let controller: WalletController;
  let walletServiceMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    walletServiceMock = {
      getBalance: jest.fn(),
      getTransactions: jest.fn(),
    };

    prismaMock = {
      wallet_transactions: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: walletServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("getBalance", () => {
    it("debe retornar el balance en formato de objeto", async () => {
      walletServiceMock.getBalance.mockResolvedValue(200);

      const result = await controller.getBalance("user-123");

      expect(walletServiceMock.getBalance).toHaveBeenCalledWith("user-123");
      expect(result).toEqual({ fitcoins_balance: 200 });
    });
  });

  describe("getTransactions", () => {
    it("debe retornar las transacciones del usuario", async () => {
      const mockTx = [{ id: 1, amount: 50 }];
      walletServiceMock.getTransactions.mockResolvedValue(mockTx);

      const result = await controller.getTransactions("user-123");

      expect(walletServiceMock.getTransactions).toHaveBeenCalledWith("user-123");
      expect(result).toEqual(mockTx);
    });
  });

  describe("createTransaction", () => {
    it("debe crear una nueva transacción en la base de datos", async () => {
      const mockData = {
        user_id: "user-123",
        amount: 25,
        description: "Bonus",
        type: "EARN" as const,
      };
      const mockCreated = { id: 9, ...mockData, created_at: new Date() };
      prismaMock.wallet_transactions.create.mockResolvedValue(mockCreated);

      const result = await controller.createTransaction(mockData);

      expect(prismaMock.wallet_transactions.create).toHaveBeenCalledWith({
        data: {
          user_id: "user-123",
          amount: 25,
          description: "Bonus",
          type: "EARN",
        },
      });
      expect(result).toEqual(mockCreated);
    });
  });
});

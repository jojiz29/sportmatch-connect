/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// health.controller.spec.ts — Tests para HealthController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { PrismaService } from "../prisma/prisma.service";
import { HttpStatus } from "@nestjs/common";

describe("HealthController", () => {
  let controller: HealthController;
  let prismaMock: any;
  let responseMock: any;

  beforeEach(async () => {
    prismaMock = {
      isHealthy: jest.fn(),
      tryReconnect: jest.fn(),
    };

    responseMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("check", () => {
    it("debe responder HTTP 200 si la base de datos está sana", () => {
      prismaMock.isHealthy.mockReturnValue(true);

      controller.check(responseMock);

      expect(prismaMock.isHealthy).toHaveBeenCalled();
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "ok",
          checks: { database: "up" },
        }),
      );
    });

    it("debe responder HTTP 503 si la base de datos está degradada", () => {
      prismaMock.isHealthy.mockReturnValue(false);

      controller.check(responseMock);

      expect(prismaMock.isHealthy).toHaveBeenCalled();
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "degraded",
          checks: { database: "down" },
        }),
      );
    });
  });

  describe("reconnect", () => {
    it("debe intentar reconectarse y reportar el resultado", async () => {
      prismaMock.tryReconnect.mockResolvedValue(true);

      const result = await controller.reconnect();

      expect(prismaMock.tryReconnect).toHaveBeenCalled();
      expect(result.reconnected).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
  });
});

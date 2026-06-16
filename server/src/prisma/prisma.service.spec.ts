/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// prisma.service.spec.ts — Tests unitarios para PrismaService
// Verifica conexión, desconexión y reconexión resiliente
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";
import { PrismaClient } from "@prisma/client";

describe("PrismaService", () => {
  let service: PrismaService;
  let connectSpy: jest.SpyInstance;
  let disconnectSpy: jest.SpyInstance;

  beforeEach(() => {
    // Espiamos los métodos del prototipo para no intentar conectar a una base de datos real
    connectSpy = jest.spyOn(PrismaClient.prototype, "$connect").mockResolvedValue(undefined as any);
    disconnectSpy = jest
      .spyOn(PrismaClient.prototype, "$disconnect")
      .mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    connectSpy.mockRestore();
    disconnectSpy.mockRestore();
  });

  it("debe conectar exitosamente al inicializar el módulo", async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
    expect(service.isHealthy()).toBe(true);
  });

  it("debe arrancar en modo degraded si falla la conexión en module init", async () => {
    connectSpy.mockRejectedValue(new Error("Database connection timeout"));

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
    expect(service.isHealthy()).toBe(false);
  });

  it("debe desconectar al destruir el módulo", async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("debe intentar reconectarse manualmente con éxito", async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    connectSpy.mockResolvedValue(undefined as any);

    const reconnected = await service.tryReconnect();

    expect(reconnected).toBe(true);
    expect(service.isHealthy()).toBe(true);
  });

  it("debe manejar fallos al intentar reconectarse manualmente", async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    connectSpy.mockRejectedValue(new Error("Reconnect failure"));

    const reconnected = await service.tryReconnect();

    expect(reconnected).toBe(false);
    expect(service.isHealthy()).toBe(false);
  });
});

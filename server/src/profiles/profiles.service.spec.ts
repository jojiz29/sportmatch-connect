/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// profiles.service.spec.ts — Tests para ProfilesService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { ProfilesService } from "./profiles.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";

describe("ProfilesService", () => {
  let service: ProfilesService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      $queryRawUnsafe: jest.fn(),
      profiles: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    process.env.VITE_USE_MOCKS = "true"; // default to mock mode for tests
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("debe retornar la lista de perfiles", async () => {
      const mockProfiles = [{ id: "u1", name: "Edwin" }];
      prismaMock.$queryRawUnsafe.mockResolvedValue(mockProfiles);

      const res = await service.findAll();

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalled();
      expect(res).toEqual(mockProfiles);
    });

    it("debe relanzar el error si $queryRawUnsafe falla en findAll", async () => {
      prismaMock.$queryRawUnsafe.mockRejectedValue(new Error("DB Error"));
      await expect(service.findAll()).rejects.toThrow("DB Error");
    });
  });

  describe("findOne", () => {
    it("debe retornar el perfil si existe", async () => {
      const mockProfile = { id: "u1", name: "Edwin" };
      prismaMock.$queryRawUnsafe.mockResolvedValue([mockProfile]);

      const res = await service.findOne("u1");

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalled();
      expect(res).toEqual(mockProfile);
    });

    it("debe lanzar NotFoundException si no existe el perfil", async () => {
      prismaMock.$queryRawUnsafe.mockResolvedValue([]);
      await expect(service.findOne("u2")).rejects.toThrow(NotFoundException);
    });

    it("debe relanzar el error si falla $queryRawUnsafe en findOne", async () => {
      prismaMock.$queryRawUnsafe.mockRejectedValue(new Error("DB Error"));
      await expect(service.findOne("u2")).rejects.toThrow("DB Error");
    });
  });

  describe("update", () => {
    it("debe actualizar el perfil", async () => {
      const mockProfile = { id: "u1", name: "Nuevo Edwin" };
      prismaMock.profiles.update.mockResolvedValue(mockProfile);

      const res = await service.update("u1", { name: "Nuevo Edwin" });

      expect(prismaMock.profiles.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { name: "Nuevo Edwin" },
      });
      expect(res).toEqual(mockProfile);
    });

    it("debe relanzar el error si update falla en base de datos", async () => {
      prismaMock.profiles.update.mockRejectedValue(new Error("DB Error"));
      await expect(service.update("u1", { name: "Nuevo" })).rejects.toThrow("DB Error");
    });
  });

  describe("verifyDni", () => {
    it("debe lanzar BadRequestException si el DNI no tiene 8 dígitos", async () => {
      await expect(service.verifyDni("u1", "1234")).rejects.toThrow(BadRequestException);
    });

    it("debe lanzar NotFoundException si el perfil del usuario no existe", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue(null);
      await expect(service.verifyDni("u1", "12345678")).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ForbiddenException si ya se han superado los 3 intentos", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue({ id: "u1", dni_intentos: 3 });
      await expect(service.verifyDni("u1", "12345678")).rejects.toThrow(ForbiddenException);
    });

    it("debe lanzar BadRequestException si el DNI ya está verificado en otra cuenta", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue({ id: "u1", dni_intentos: 0 });
      prismaMock.profiles.findFirst.mockResolvedValue({ id: "u2", name: "Duplicado" });
      prismaMock.profiles.update.mockResolvedValue({ id: "u1", dni_intentos: 1 });

      await expect(service.verifyDni("u1", "12345678")).rejects.toThrow(BadRequestException);
      expect(prismaMock.profiles.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { dni_intentos: { increment: 1 } },
      });
    });

    it("debe verificar la identidad exitosamente en modo mock con nombre coincidente", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "u1",
        name: "Juan Perez Gomez",
        dni_intentos: 0,
        trust_score: 50,
      });
      prismaMock.profiles.findFirst.mockResolvedValue(null);
      prismaMock.profiles.update.mockResolvedValue({
        dni_verificado: true,
        fecha_verificacion: new Date(),
        trust_score: 65,
      });

      const res = await service.verifyDni("u1", "99999999");

      expect(res.success).toBe(true);
      expect(res.profile.dni_verificado).toBe(true);
      expect(res.profile.trust_score).toBe(65);
    });

    it("debe lanzar BadRequestException si el nombre no coincide en modo mock", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "u1",
        name: "Carlos Gomez",
        dni_intentos: 0,
      });
      prismaMock.profiles.findFirst.mockResolvedValue(null);
      prismaMock.profiles.update.mockResolvedValue({ dni_intentos: 1 });

      await expect(service.verifyDni("u1", "99999999")).rejects.toThrow(BadRequestException);
    });

    it("debe lanzar BadRequestException si la llamada a la API de RENIEC falla en modo real", async () => {
      process.env.VITE_USE_MOCKS = "false";
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "u1",
        name: "Edwin",
        dni_intentos: 0,
      });
      prismaMock.profiles.findFirst.mockResolvedValue(null);

      // Mock fetch to simulate API failure
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = mockFetch as any;

      await expect(service.verifyDni("u1", "12345678")).rejects.toThrow(BadRequestException);
    });

    it("debe verificar identidad exitosamente en modo real con respuesta exitosa de RENIEC", async () => {
      process.env.VITE_USE_MOCKS = "false";
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "u1",
        name: "Edwin Junior",
        dni_intentos: 0,
        trust_score: 50,
      });
      prismaMock.profiles.findFirst.mockResolvedValue(null);
      prismaMock.profiles.update.mockResolvedValue({
        dni_verificado: true,
        fecha_verificacion: new Date(),
        trust_score: 65,
      });

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            names: "Edwin",
            paternalSurname: "Junior",
            maternalSurname: "",
            fullName: "Edwin Junior",
          },
        }),
      });
      global.fetch = mockFetch as any;

      const res = await service.verifyDni("u1", "12345678");

      expect(res.success).toBe(true);
      expect(res.profile.dni_verificado).toBe(true);
    });

    it("debe usar nombres del perfil en modo mock si el DNI no es 99999999", async () => {
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "u1",
        name: "Edwin Junior Demo",
        dni_intentos: 0,
        trust_score: 50,
      });
      prismaMock.profiles.findFirst.mockResolvedValue(null);
      prismaMock.profiles.update.mockResolvedValue({
        dni_verificado: true,
        fecha_verificacion: new Date(),
        trust_score: 65,
      });

      const res = await service.verifyDni("u1", "12345678");

      expect(res.success).toBe(true);
      expect(res.profile.dni_verificado).toBe(true);
    });

    it("debe lanzar BadRequestException si la API de RENIEC responde ok pero sin objeto data", async () => {
      process.env.VITE_USE_MOCKS = "false";
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "u1",
        name: "Edwin Junior",
        dni_intentos: 0,
      });
      prismaMock.profiles.findFirst.mockResolvedValue(null);

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}), // missing data
      });
      global.fetch = mockFetch as any;

      await expect(service.verifyDni("u1", "12345678")).rejects.toThrow(BadRequestException);
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// supabase-auth.service.spec.ts — Tests unitarios para SupabaseAuthService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseAuthService } from "./supabase-auth.service";
import { UnauthorizedException } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

describe("SupabaseAuthService", () => {
  let service: SupabaseAuthService;
  let mockSupabaseClient: any;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Configuración", () => {
    it("debe advertir si no hay variables de entorno configuradas", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const module: TestingModule = await Test.createTestingModule({
        providers: [SupabaseAuthService],
      }).compile();

      service = module.get<SupabaseAuthService>(SupabaseAuthService);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe("Métodos de Autenticación", () => {
    beforeEach(async () => {
      process.env.SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";

      const module: TestingModule = await Test.createTestingModule({
        providers: [SupabaseAuthService],
      }).compile();

      service = module.get<SupabaseAuthService>(SupabaseAuthService);
    });

    describe("validateToken", () => {
      it("debe validar un token válido y devolver los datos del usuario con rol por defecto", async () => {
        const mockUser = {
          id: "user-id-123",
          email: "test@example.com",
          user_metadata: {},
        };

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const result = await service.validateToken("valid-token");

        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith("valid-token");
        expect(result).toEqual({
          userId: "user-id-123",
          email: "test@example.com",
          role: "PLAYER",
        });
      });

      it("debe validar un token válido y devolver los datos del usuario con rol personalizado", async () => {
        const mockUser = {
          id: "user-id-123",
          email: "business@example.com",
          user_metadata: { user_role: "BUSINESS" },
        };

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        const result = await service.validateToken("valid-token");

        expect(result).toEqual({
          userId: "user-id-123",
          email: "business@example.com",
          role: "BUSINESS",
        });
      });

      it("debe lanzar UnauthorizedException si Supabase devuelve un error", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error("Auth error"),
        });

        await expect(service.validateToken("invalid-token")).rejects.toThrow(UnauthorizedException);
      });

      it("debe lanzar UnauthorizedException si no se devuelve ningún usuario", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        await expect(service.validateToken("invalid-token")).rejects.toThrow(UnauthorizedException);
      });

      it("debe lanzar UnauthorizedException si hay un error general en la validación", async () => {
        mockSupabaseClient.auth.getUser.mockRejectedValue(new Error("Network fail"));

        await expect(service.validateToken("invalid-token")).rejects.toThrow(UnauthorizedException);
      });
    });

    describe("getUserProfile", () => {
      it("debe devolver el perfil si existe en la base de datos", async () => {
        const mockProfile = {
          id: "user-id-123",
          name: "Edwin Flores",
          xp: 1500,
        };

        mockSupabaseClient.single.mockResolvedValue({
          data: mockProfile,
          error: null,
        });

        const result = await service.getUserProfile("user-id-123");

        expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", "user-id-123");
        expect(result).toEqual(mockProfile);
      });

      it("debe lanzar UnauthorizedException si no encuentra el perfil", async () => {
        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: new Error("Profile not found"),
        });

        await expect(service.getUserProfile("non-existent-user")).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });
  });

  describe("Casos no configurados", () => {
    beforeEach(async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const module: TestingModule = await Test.createTestingModule({
        providers: [SupabaseAuthService],
      }).compile();
      service = module.get<SupabaseAuthService>(SupabaseAuthService);
      consoleWarnSpy.mockRestore();
    });

    it("validateToken debe fallar si el cliente no está configurado", async () => {
      await expect(service.validateToken("token")).rejects.toThrow(UnauthorizedException);
    });

    it("getUserProfile debe fallar si el cliente no está configurado", async () => {
      await expect(service.getUserProfile("id")).rejects.toThrow(UnauthorizedException);
    });
  });
});

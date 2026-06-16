/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// auth.service.spec.ts — Tests unitarios para AuthService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { SupabaseAuthService } from "./supabase-auth.service";
import { UnauthorizedException } from "@nestjs/common";

describe("AuthService", () => {
  let service: AuthService;
  let supabaseAuthMock: any;

  beforeEach(async () => {
    supabaseAuthMock = {
      validateToken: jest.fn(),
      getUserProfile: jest.fn(),
      supabaseAdmin: {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseAuthService,
          useValue: supabaseAuthMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("validateToken", () => {
    it("debe devolver el payload si el token es válido", async () => {
      const mockPayload = { userId: "user-123", email: "user@test.com" };
      supabaseAuthMock.validateToken.mockResolvedValue(mockPayload);

      const result = await service.validateToken("valid-token");

      expect(supabaseAuthMock.validateToken).toHaveBeenCalledWith("valid-token");
      expect(result).toEqual(mockPayload);
    });

    it("debe lanzar UnauthorizedException si la validación falla", async () => {
      supabaseAuthMock.validateToken.mockRejectedValue(new Error("Invalid token"));

      await expect(service.validateToken("invalid-token")).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getProfile", () => {
    it("debe validar el token y devolver el perfil del usuario", async () => {
      const mockPayload = { userId: "user-123" };
      const mockProfile = { id: "user-123", name: "Edwin Flores", xp: 500 };

      supabaseAuthMock.validateToken.mockResolvedValue(mockPayload);
      supabaseAuthMock.getUserProfile.mockResolvedValue(mockProfile);

      const result = await service.getProfile("valid-token");

      expect(supabaseAuthMock.validateToken).toHaveBeenCalledWith("valid-token");
      expect(supabaseAuthMock.getUserProfile).toHaveBeenCalledWith("user-123");
      expect(result).toEqual(mockProfile);
    });
  });

  describe("updateProfile", () => {
    const mockData = { name: "New Name", bio: "New Bio" };

    it("debe actualizar y devolver el perfil actualizado en el happy path", async () => {
      const mockPayload = { userId: "user-123" };
      const mockUpdatedProfile = { id: "user-123", name: "New Name", bio: "New Bio" };

      supabaseAuthMock.validateToken.mockResolvedValue(mockPayload);
      supabaseAuthMock.supabaseAdmin.single.mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      const result = await service.updateProfile("valid-token", mockData);

      expect(supabaseAuthMock.validateToken).toHaveBeenCalledWith("valid-token");
      expect(supabaseAuthMock.supabaseAdmin.from).toHaveBeenCalledWith("profiles");
      expect(supabaseAuthMock.supabaseAdmin.update).toHaveBeenCalledWith(mockData);
      expect(supabaseAuthMock.supabaseAdmin.eq).toHaveBeenCalledWith("id", "user-123");
      expect(result).toEqual(mockUpdatedProfile);
    });

    it("debe lanzar UnauthorizedException si la actualización devuelve un error de base de datos", async () => {
      const mockPayload = { userId: "user-123" };

      supabaseAuthMock.validateToken.mockResolvedValue(mockPayload);
      supabaseAuthMock.supabaseAdmin.single.mockResolvedValue({
        data: null,
        error: new Error("Db update failed"),
      });

      await expect(service.updateProfile("valid-token", mockData)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("debe lanzar UnauthorizedException si no se devuelve ningún perfil actualizado", async () => {
      const mockPayload = { userId: "user-123" };

      supabaseAuthMock.validateToken.mockResolvedValue(mockPayload);
      supabaseAuthMock.supabaseAdmin.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(service.updateProfile("valid-token", mockData)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

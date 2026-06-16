/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// auth.controller.spec.ts — Tests para AuthController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseAuthService } from "./supabase-auth.service";
import { UnauthorizedException } from "@nestjs/common";

describe("AuthController", () => {
  let controller: AuthController;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("getProfile", () => {
    it("debe lanzar UnauthorizedException si falta el token", async () => {
      await expect(controller.getProfile("")).rejects.toThrow(UnauthorizedException);
      await expect(controller.getProfile("invalid")).rejects.toThrow(UnauthorizedException);
    });

    it("debe retornar el perfil si el token es válido", async () => {
      authServiceMock.getProfile.mockResolvedValue({ id: "u1", name: "Edwin" });
      const res = await controller.getProfile("Bearer token-xyz");
      expect(authServiceMock.getProfile).toHaveBeenCalledWith("token-xyz");
      expect(res).toEqual({ id: "u1", name: "Edwin" });
    });
  });

  describe("updateProfile", () => {
    it("debe lanzar UnauthorizedException si falta el token", async () => {
      await expect(controller.updateProfile("", {})).rejects.toThrow(UnauthorizedException);
    });

    it("debe actualizar el perfil si el token es válido", async () => {
      authServiceMock.updateProfile.mockResolvedValue({ id: "u1", name: "Nuevo" });
      const res = await controller.updateProfile("Bearer token-xyz", { name: "Nuevo" });
      expect(authServiceMock.updateProfile).toHaveBeenCalledWith("token-xyz", { name: "Nuevo" });
      expect(res).toEqual({ id: "u1", name: "Nuevo" });
    });
  });

  describe("verifyToken", () => {
    it("debe lanzar UnauthorizedException si falta el token", async () => {
      await expect(controller.verifyToken("")).rejects.toThrow(UnauthorizedException);
    });

    it("debe validar el token si es válido", async () => {
      authServiceMock.validateToken.mockResolvedValue({ user: { id: "u1" } });
      const res = await controller.verifyToken("Bearer token-xyz");
      expect(authServiceMock.validateToken).toHaveBeenCalledWith("token-xyz");
      expect(res).toEqual({ user: { id: "u1" } });
    });
  });
});

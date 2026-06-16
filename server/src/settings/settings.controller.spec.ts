/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// settings.controller.spec.ts — Tests para SettingsController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("SettingsController", () => {
  let controller: SettingsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      getPreferences: jest.fn(),
      updatePreferences: jest.fn(),
      resetPreferences: jest.fn(),
      listBlocks: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      listSessions: jest.fn(),
      registerSession: jest.fn(),
      deleteSession: jest.fn(),
      deleteAllOtherSessions: jest.fn(),
      exportUserData: jest.fn(),
      deleteAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: serviceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("preferences", () => {
    it("debe obtener preferencias", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.getPreferences.mockResolvedValue({ theme: "dark" });
      const res = await controller.getPreferences(req as any);
      expect(serviceMock.getPreferences).toHaveBeenCalledWith("u1");
      expect(res).toEqual({ theme: "dark" });
    });

    it("debe actualizar preferencias", async () => {
      const req = { user: { sub: "u1" } };
      const dto = { notifications_enabled: true } as any;
      serviceMock.updatePreferences.mockResolvedValue({ success: true });
      const res = await controller.updatePreferences(req as any, dto);
      expect(serviceMock.updatePreferences).toHaveBeenCalledWith("u1", dto);
      expect(res).toEqual({ success: true });
    });

    it("debe resetear preferencias", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.resetPreferences.mockResolvedValue({ success: true });
      const res = await controller.resetPreferences(req as any);
      expect(serviceMock.resetPreferences).toHaveBeenCalledWith("u1");
      expect(res).toEqual({ success: true });
    });
  });

  describe("blocks", () => {
    it("debe listar bloques", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.listBlocks.mockResolvedValue([]);
      const res = await controller.listBlocks(req as any);
      expect(serviceMock.listBlocks).toHaveBeenCalledWith("u1");
      expect(res).toEqual([]);
    });

    it("debe bloquear usuario", async () => {
      const req = { user: { sub: "u1" } };
      const dto = { blocked_id: "u2" } as any;
      serviceMock.blockUser.mockResolvedValue({ success: true });
      const res = await controller.blockUser(req as any, dto);
      expect(serviceMock.blockUser).toHaveBeenCalledWith("u1", dto);
      expect(res).toEqual({ success: true });
    });

    it("debe desbloquear usuario", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.unblockUser.mockResolvedValue({ success: true });
      const res = await controller.unblockUser(req as any, "u2");
      expect(serviceMock.unblockUser).toHaveBeenCalledWith("u1", "u2");
      expect(res).toEqual({ success: true });
    });
  });

  describe("sessions", () => {
    it("debe listar sesiones", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.listSessions.mockResolvedValue([]);
      const res = await controller.listSessions(req as any);
      expect(serviceMock.listSessions).toHaveBeenCalledWith("u1");
      expect(res).toEqual([]);
    });

    it("debe registrar sesión", async () => {
      const req = { user: { sub: "u1" } };
      const body = { device_label: "iPhone" };
      serviceMock.registerSession.mockResolvedValue({ id: "s1" });
      const res = await controller.registerSession(req as any, body);
      expect(serviceMock.registerSession).toHaveBeenCalledWith("u1", body);
      expect(res).toEqual({ id: "s1" });
    });

    it("debe borrar una sesión", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.deleteSession.mockResolvedValue({ success: true });
      const res = await controller.deleteSession(req as any, "s1");
      expect(serviceMock.deleteSession).toHaveBeenCalledWith("u1", "s1");
      expect(res).toEqual({ success: true });
    });

    it("debe borrar todas las demás sesiones", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.deleteAllOtherSessions.mockResolvedValue({ success: true });
      const res = await controller.deleteAllOtherSessions(req as any);
      expect(serviceMock.deleteAllOtherSessions).toHaveBeenCalledWith("u1");
      expect(res).toEqual({ success: true });
    });
  });

  describe("exportUserData", () => {
    it("debe exportar los datos", async () => {
      const req = { user: { sub: "u1" } };
      serviceMock.exportUserData.mockResolvedValue({ exported: true });
      const res = await controller.exportData(req as any);
      expect(serviceMock.exportUserData).toHaveBeenCalledWith("u1");
      expect(res).toEqual({ exported: true });
    });
  });

  describe("deleteAccount", () => {
    it("debe llamar a service.deleteAccount con parámetros de req y dto", async () => {
      const req = {
        user: { sub: "u1", email: "e@e.com" },
        headers: {
          get: jest.fn().mockImplementation((key) => {
            if (key === "x-forwarded-for") return "1.2.3.4";
            if (key === "user-agent") return "Mozilla";
            return null;
          }),
        },
      };
      const dto = { password: "123", confirmText: "ELIMINAR", reason: "gdpr" } as any;
      serviceMock.deleteAccount.mockResolvedValue({ success: true });

      const res = await controller.deleteAccount(req as any, dto);

      expect(req.headers.get).toHaveBeenCalledWith("x-forwarded-for");
      expect(req.headers.get).toHaveBeenCalledWith("user-agent");
      expect(serviceMock.deleteAccount).toHaveBeenCalledWith(
        "u1",
        "e@e.com",
        "123",
        "ELIMINAR",
        "1.2.3.4",
        "Mozilla",
        "gdpr",
      );
      expect(res).toEqual({ success: true });
    });
  });
});

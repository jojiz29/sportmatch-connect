/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// settings.service.spec.ts — Tests unitarios para SettingsService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { SettingsService } from "./settings.service";
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

describe("SettingsService", () => {
  let service: SettingsService;
  let mockSupabaseClient: any;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: "https://mockurl.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      rpc: jest.fn(),
      auth: {
        admin: {
          getUserById: jest.fn(),
          signOut: jest.fn(),
        },
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("Configuración", () => {
    it("debe avisar si no hay variables de entorno", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [SettingsService],
      }).compile();

      const unconfiguredService = module.get<SettingsService>(SettingsService);
      expect(unconfiguredService).toBeDefined();
    });

    it("debe lanzar un error si no está configurado al llamar ensureConfigured", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [SettingsService],
      }).compile();

      const unconfiguredService = module.get<SettingsService>(SettingsService);
      await expect(unconfiguredService.getPreferences("user-123")).rejects.toThrow(
        "Settings service not configured",
      );
    });
  });

  describe("getPreferences", () => {
    it("debe retornar preferencias existentes", async () => {
      const mockPrefs = { user_id: "user-123", theme: "dark" };
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ data: mockPrefs, error: null }));

      const result = await service.getPreferences("user-123");
      expect(result).toEqual(mockPrefs);
    });

    it("debe crear y retornar preferencias por defecto si no existen (PGRST116)", async () => {
      const mockPrefs = { user_id: "user-123", theme: "system" };
      mockSupabaseClient.then = jest
        .fn()
        .mockImplementationOnce((resolve) => resolve({ data: null, error: { code: "PGRST116" } }))
        .mockImplementationOnce((resolve) => resolve({ data: mockPrefs, error: null }));

      const result = await service.getPreferences("user-123");
      expect(result).toEqual(mockPrefs);
    });

    it("debe propagar el error si el insert de defaults falla", async () => {
      mockSupabaseClient.then = jest
        .fn()
        .mockImplementationOnce((resolve) => resolve({ data: null, error: { code: "PGRST116" } }))
        .mockImplementationOnce((resolve) =>
          resolve({ data: null, error: new Error("Insert fail") }),
        );

      await expect(service.getPreferences("user-123")).rejects.toThrow("Insert fail");
    });

    it("debe propagar el error si ocurre otro fallo al consultar", async () => {
      mockSupabaseClient.then = jest.fn((resolve) =>
        resolve({ data: null, error: new Error("DB error") }),
      );

      await expect(service.getPreferences("user-123")).rejects.toThrow("DB error");
    });
  });

  describe("updatePreferences", () => {
    it("debe actualizar y retornar las preferencias", async () => {
      const mockPrefs = { user_id: "user-123", theme: "light" };
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ data: mockPrefs, error: null }));

      const result = await service.updatePreferences("user-123", { theme: "light" });
      expect(result).toEqual(mockPrefs);
    });

    it("debe retornar preferencias actuales si el DTO está vacío o solo contiene undefined", async () => {
      const mockPrefs = { user_id: "user-123", theme: "dark" };
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ data: mockPrefs, error: null }));

      const result = await service.updatePreferences("user-123", { theme: undefined });
      expect(result).toEqual(mockPrefs);
    });

    it("debe lanzar un error si el update falla", async () => {
      mockSupabaseClient.then = jest.fn((resolve) =>
        resolve({ data: null, error: new Error("Update fail") }),
      );

      await expect(service.updatePreferences("user-123", { theme: "dark" })).rejects.toThrow(
        "Update fail",
      );
    });
  });

  describe("resetPreferences", () => {
    it("debe eliminar las preferencias y retornar las nuevas creadas", async () => {
      const mockPrefs = { user_id: "user-123", theme: "system" };
      mockSupabaseClient.then = jest
        .fn()
        .mockImplementationOnce((resolve) => resolve({ error: null })) // delete
        .mockImplementationOnce((resolve) => resolve({ data: mockPrefs, error: null })); // getPreferences

      const result = await service.resetPreferences("user-123");
      expect(result).toEqual(mockPrefs);
    });

    it("debe lanzar un error si la eliminación falla", async () => {
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ error: new Error("Delete fail") }));

      await expect(service.resetPreferences("user-123")).rejects.toThrow("Delete fail");
    });
  });

  describe("Usuarios Bloqueados", () => {
    it("listBlocks debe retornar lista de bloqueos", async () => {
      const mockBlocks = [{ blocked_id: "user-2", reason: "Spam" }];
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ data: mockBlocks, error: null }));

      const result = await service.listBlocks("user-1");
      expect(result).toEqual(mockBlocks);
    });

    it("listBlocks debe lanzar error en fallo", async () => {
      mockSupabaseClient.then = jest.fn((resolve) =>
        resolve({ data: null, error: new Error("List fail") }),
      );

      await expect(service.listBlocks("user-1")).rejects.toThrow("List fail");
    });

    it("blockUser debe bloquear usuario", async () => {
      const mockBlock = { blocker_id: "user-1", blocked_id: "user-2", reason: "Abuso" };
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ data: mockBlock, error: null }));

      const result = await service.blockUser("user-1", { user_id: "user-2", reason: "Abuso" });
      expect(result).toEqual(mockBlock);
    });

    it("blockUser debe fallar si intenta bloquearse a sí mismo", async () => {
      await expect(service.blockUser("user-1", { user_id: "user-1" })).rejects.toThrow(
        "No puedes bloquearte a ti mismo",
      );
    });

    it("blockUser debe lanzar error si falla base de datos", async () => {
      mockSupabaseClient.then = jest.fn((resolve) =>
        resolve({ data: null, error: new Error("Block fail") }),
      );

      await expect(service.blockUser("user-1", { user_id: "user-2" })).rejects.toThrow(
        "Block fail",
      );
    });

    it("unblockUser debe desbloquear usuario", async () => {
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.unblockUser("user-1", "user-2");
      expect(result).toEqual({ success: true });
    });

    it("unblockUser debe lanzar error si falla", async () => {
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ error: new Error("Unblock fail") }));

      await expect(service.unblockUser("user-1", "user-2")).rejects.toThrow("Unblock fail");
    });
  });

  describe("Sesiones", () => {
    it("listSessions debe retornar sesiones", async () => {
      const mockSessions = [{ id: "session-1", user_id: "user-1" }];
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ data: mockSessions, error: null }));

      const result = await service.listSessions("user-1");
      expect(result).toEqual(mockSessions);
    });

    it("listSessions debe lanzar error en fallo", async () => {
      mockSupabaseClient.then = jest.fn((resolve) =>
        resolve({ data: null, error: new Error("List fail") }),
      );

      await expect(service.listSessions("user-1")).rejects.toThrow("List fail");
    });

    it("registerSession debe insertar sesión", async () => {
      const mockSession = { id: "session-1", user_id: "user-1" };
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ data: mockSession, error: null }));

      const result = await service.registerSession("user-1", { device_label: "iPhone" });
      expect(result).toEqual(mockSession);
    });

    it("registerSession debe lanzar error en fallo", async () => {
      mockSupabaseClient.then = jest.fn((resolve) =>
        resolve({ data: null, error: new Error("Register fail") }),
      );

      await expect(service.registerSession("user-1", {})).rejects.toThrow("Register fail");
    });

    it("deleteSession debe eliminar sesión", async () => {
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.deleteSession("user-1", "session-1");
      expect(result).toEqual({ success: true });
    });

    it("deleteSession debe lanzar error en fallo", async () => {
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ error: new Error("Delete fail") }));

      await expect(service.deleteSession("user-1", "session-1")).rejects.toThrow("Delete fail");
    });

    it("deleteAllOtherSessions debe eliminar otras sesiones", async () => {
      mockSupabaseClient.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.deleteAllOtherSessions("user-1");
      expect(result).toEqual({ success: true });
    });

    it("deleteAllOtherSessions debe lanzar error en fallo", async () => {
      mockSupabaseClient.then = jest.fn((resolve) =>
        resolve({ error: new Error("Delete all fail") }),
      );

      await expect(service.deleteAllOtherSessions("user-1")).rejects.toThrow("Delete all fail");
    });
  });

  describe("exportUserData", () => {
    it("debe retornar todos los datos del usuario exportados", async () => {
      mockSupabaseClient.then = jest
        .fn()
        .mockImplementationOnce((resolve) =>
          resolve({ data: { id: "user-123", name: "Edwin" }, error: null }),
        ) // profile
        .mockImplementationOnce((resolve) => resolve({ data: { theme: "dark" }, error: null })) // preferences
        .mockImplementation((resolve) => resolve({ data: [], error: null })); // others

      const result = await service.exportUserData("user-123");
      expect(result.user_id).toBe("user-123");
      expect(result.sections.profile).toEqual({ id: "user-123", name: "Edwin" });
      expect(result.sections.preferences).toEqual({ theme: "dark" });
    });
  });

  describe("deleteAccount", () => {
    it("debe fallar si confirmText no es ELIMINAR", async () => {
      await expect(
        service.deleteAccount("user-123", "email@test.com", "pass", "NO"),
      ).rejects.toThrow(BadRequestException);
    });

    it("debe fallar si password está vacío", async () => {
      await expect(
        service.deleteAccount("user-123", "email@test.com", "", "ELIMINAR"),
      ).rejects.toThrow(BadRequestException);
    });

    it("debe fallar si el usuario no existe", async () => {
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: new Error("Not found"),
      });

      await expect(
        service.deleteAccount("user-123", "email@test.com", "pass", "ELIMINAR"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("debe fallar si ocurre un error general obteniendo el usuario", async () => {
      mockSupabaseClient.auth.admin.getUserById.mockRejectedValue(new Error("Unexpected"));

      await expect(
        service.deleteAccount("user-123", "email@test.com", "pass", "ELIMINAR"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("debe fallar si RPC soft_delete_user devuelve error", async () => {
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: new Error("RPC fail") });

      await expect(
        service.deleteAccount("user-123", "email@test.com", "pass", "ELIMINAR"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("debe fallar si RPC devuelve vacío", async () => {
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      await expect(
        service.deleteAccount("user-123", "email@test.com", "pass", "ELIMINAR"),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("debe completar soft delete y cerrar sesión", async () => {
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ deletion_id: "del-99", deleted_at: "2026-06-16T00:00:00Z" }],
        error: null,
      });
      mockSupabaseClient.auth.admin.signOut.mockResolvedValue({ error: null });

      const result = await service.deleteAccount("user-123", "email@test.com", "pass", "ELIMINAR");

      expect(result).toEqual({
        deletion_id: "del-99",
        deleted_at: "2026-06-16T00:00:00Z",
        message: expect.any(String),
      });
      expect(mockSupabaseClient.auth.admin.signOut).toHaveBeenCalledWith("user-123");
    });

    it("debe completar soft delete incluso si signOut falla", async () => {
      mockSupabaseClient.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ deletion_id: "del-99", deleted_at: "2026-06-16T00:00:00Z" }],
        error: null,
      });
      mockSupabaseClient.auth.admin.signOut.mockRejectedValue(new Error("SignOut fail"));

      const result = await service.deleteAccount("user-123", "email@test.com", "pass", "ELIMINAR");

      expect(result.deletion_id).toBe("del-99");
    });
  });
});

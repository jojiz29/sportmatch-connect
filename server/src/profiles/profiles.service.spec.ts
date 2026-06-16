// ============================================================
// profiles.service.spec.ts — Pruebas unitarias de ProfilesService
// Cobertura completa del flujo de Verificación DNI 2.0
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { ProfilesService } from "./profiles.service";
import { PrismaService } from "../prisma/prisma.service";
import { VertexAiService } from "../ai/vertex-ai.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import * as crypto from "crypto";

describe("ProfilesService — DNI Verification 2.0", () => {
  let service: ProfilesService;
  let prismaMock: any;
  let vertexAiMock: any;
  let supabaseAuthMock: any;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    prismaMock = {
      profiles: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    vertexAiMock = {
      generateContentWithImages: jest.fn(),
    };

    supabaseAuthMock = {
      downloadStorageObject: jest.fn(),
      deleteStorageObjects: jest.fn(),
    };

    global.fetch = jest.fn() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: VertexAiService, useValue: vertexAiMock },
        { provide: SupabaseAuthService, useValue: supabaseAuthMock },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);

    jest.clearAllMocks();
    process.env.VITE_USE_MOCKS = "false";
    process.env.VERIFICAPE_API_KEY = "vp_mock_key_123";
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  // ============================================================
  // Objetivo 1: Consentimiento biométrico obligatorio
  // ============================================================
  it("should throw BadRequestException if consent is missing in v2 verification", async () => {
    const payload = {
      dni: "70123456",
      documentPath: "user123/dni-front_123.webp",
      selfiePath: "user123/selfie_123.webp",
      consentimientoBio: false,
    };

    await expect(service.verifyDni("user123", payload)).rejects.toThrow(
      new BadRequestException(
        "Debes aceptar el consentimiento biométrico para continuar con la verificación.",
      ),
    );
    expect(prismaMock.profiles.findUnique).not.toHaveBeenCalled();
  });

  // ============================================================
  // Objetivo 2: Límite de intentos
  // ============================================================
  it("should throw ForbiddenException if user has 3 or more attempts", async () => {
    prismaMock.profiles.findUnique.mockResolvedValue({
      id: "user123",
      dni_intentos: 3,
    });

    const payload = {
      dni: "70123456",
      documentPath: "user123/dni-front_123.webp",
      selfiePath: "user123/selfie_123.webp",
      consentimientoBio: true,
    };

    await expect(service.verifyDni("user123", payload)).rejects.toThrow(
      new ForbiddenException(
        "Has superado el límite de 3 intentos de verificación. Por favor, contacta al soporte técnico en soporte@sportmatch.app.",
      ),
    );
    expect(prismaMock.profiles.findUnique).toHaveBeenCalledWith({ where: { id: "user123" } });
  });

  // ============================================================
  // Objetivo 3: Validación de ownership de rutas y Path Traversal
  // ============================================================
  describe("Path Ownership & Path Traversal Mitigations", () => {
    beforeEach(() => {
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "user123",
        dni_intentos: 0,
      });
    });

    it("should reject paths containing directory traversal '..'", async () => {
      const payload = {
        dni: "70123456",
        documentPath: "user123/../../victim/file.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload)).rejects.toThrow(
        new BadRequestException("Ruta de imagen maliciosa detectada."),
      );
    });

    it("should reject paths containing backslashes '\\'", async () => {
      const payload = {
        dni: "70123456",
        documentPath: "user123\\dni-front_123.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload)).rejects.toThrow(
        new BadRequestException("Ruta de imagen maliciosa detectada."),
      );
    });

    it("should reject paths starting with slash '/' or containing scheme ':'", async () => {
      const payload = {
        dni: "70123456",
        documentPath: "/user123/dni-front_123.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload)).rejects.toThrow(
        new BadRequestException("Ruta absoluta o esquema no permitido."),
      );

      const payload2 = {
        dni: "70123456",
        documentPath: "http://malicious.com/file.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload2)).rejects.toThrow(
        new BadRequestException("Ruta absoluta o esquema no permitido."),
      );
    });

    it("should reject paths with disallowed characters", async () => {
      const payload = {
        dni: "70123456",
        documentPath: "user123/dni-front;drop table profiles;.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload)).rejects.toThrow(
        new BadRequestException("La ruta contiene caracteres no permitidos."),
      );
    });

    it("should reject paths that do not belong to the user folder (IDOR check)", async () => {
      const payload = {
        dni: "70123456",
        documentPath: "otherUser/dni-front_123.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload)).rejects.toThrow(
        new BadRequestException("Ruta de imagen no autorizada para este usuario."),
      );
    });
  });

  // ============================================================
  // Objetivo 4: Eliminación transitoria de imágenes
  // ============================================================
  describe("Transient file deletion", () => {
    beforeEach(() => {
      prismaMock.profiles.findUnique.mockResolvedValue({
        id: "user123",
        dni_intentos: 0,
      });
      supabaseAuthMock.downloadStorageObject.mockResolvedValue({
        mimeType: "image/webp",
        data: Buffer.from("dummy_binary"),
      });
    });

    it("should call deleteStorageObjects even when Vertex AI validation throws an error", async () => {
      vertexAiMock.generateContentWithImages.mockRejectedValue(new Error("Vertex AI timeout"));

      const payload = {
        dni: "70123456",
        documentPath: "user123/dni-front_123.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload)).rejects.toThrow("Vertex AI timeout");

      // Verificar que se purguen las imágenes
      expect(supabaseAuthMock.deleteStorageObjects).toHaveBeenCalledWith("identity-documents", [
        "user123/dni-front_123.webp",
        "user123/selfie_123.webp",
      ]);
    });

    it("should call deleteStorageObjects when Vertex AI indicates face mismatch", async () => {
      vertexAiMock.generateContentWithImages.mockResolvedValue({
        text: JSON.stringify({
          isValidDocument: true,
          extractedDni: "70123456",
          dniMatches: true,
          faceMatch: false,
          confidence: 0.95,
          reason: "Face mismatch",
        }),
        tokens: 100,
        model: "gemini-2.5-flash",
        latencyMs: 120,
      });

      prismaMock.profiles.update.mockResolvedValue({
        id: "user123",
        dni_intentos: 1,
      });

      const payload = {
        dni: "70123456",
        documentPath: "user123/dni-front_123.webp",
        selfiePath: "user123/selfie_123.webp",
        consentimientoBio: true,
      };

      await expect(service.verifyDni("user123", payload)).rejects.toThrow(
        new BadRequestException(
          "La selfie no coincide con la foto del documento. Intenta con mejor iluminación.",
        ),
      );

      // Verificación de eliminación obligatoria
      expect(supabaseAuthMock.deleteStorageObjects).toHaveBeenCalledWith("identity-documents", [
        "user123/dni-front_123.webp",
        "user123/selfie_123.webp",
      ]);
      // Verificación de incremento de intentos
      expect(prismaMock.profiles.update).toHaveBeenCalledWith({
        where: { id: "user123" },
        data: { dni_intentos: { increment: 1 } },
      });
    });
  });

  // ============================================================
  // Objetivo 5: Consentimiento persistido y flujo exitoso completo
  // ============================================================
  it("should complete validation, verify names against RENIEC, record consent, and clean storage", async () => {
    prismaMock.profiles.findUnique.mockResolvedValue({
      id: "user123",
      name: "Edwin Flores",
      dni_intentos: 0,
      trust_score: 50,
    });
    prismaMock.profiles.findFirst.mockResolvedValue(null); // No duplicate DNI

    supabaseAuthMock.downloadStorageObject.mockResolvedValue({
      mimeType: "image/webp",
      data: Buffer.from("dummy_binary"),
    });

    vertexAiMock.generateContentWithImages.mockResolvedValue({
      text: JSON.stringify({
        isValidDocument: true,
        extractedDni: "70123456",
        dniMatches: true,
        faceMatch: true,
        confidence: 0.98,
        reason: "",
      }),
      tokens: 150,
      model: "gemini-2.5-flash",
      latencyMs: 80,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          names: "Edwin",
          paternalSurname: "Flores",
          maternalSurname: "Gomez",
          fullName: "Edwin Flores Gomez",
        },
      }),
    });

    prismaMock.profiles.update.mockResolvedValue({
      id: "user123",
      dni_verificado: true,
      dni_intentos: 0,
      trust_score: 65,
      dni_verification_version: "v2",
      dni_ai_confidence: 0.98,
      consentimiento_bio: new Date(),
    });

    const payload = {
      dni: "70123456",
      documentPath: "user123/dni-front_123.webp",
      selfiePath: "user123/selfie_123.webp",
      consentimientoBio: true,
    };

    const result = await service.verifyDni("user123", payload);

    // Assert responses
    expect(result.success).toBe(true);
    expect(result.version).toBe("v2");
    expect(result.profile.dni_verificado).toBe(true);

    // Verify storage clean
    expect(supabaseAuthMock.deleteStorageObjects).toHaveBeenCalledWith("identity-documents", [
      "user123/dni-front_123.webp",
      "user123/selfie_123.webp",
    ]);

    // Verify database updates (Persistencia de consentimiento)
    const expectedDniHash = crypto.createHash("sha256").update("70123456").digest("hex");
    expect(prismaMock.profiles.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: {
        dni_verificado: true,
        dni_hash: expectedDniHash,
        dni_intentos: 0,
        fecha_verificacion: expect.any(Date),
        trust_score: 65,
        dni_verification_version: "v2",
        dni_ai_confidence: 0.98,
        consentimiento_bio: expect.any(Date),
      },
    });
  });

  // ============================================================
  // Prueba de Mock Mode
  // ============================================================
  it("should bypass external providers in mock mode", async () => {
    process.env.VITE_USE_MOCKS = "true";

    prismaMock.profiles.findUnique.mockResolvedValue({
      id: "user123",
      name: "Edwin Flores",
      dni_intentos: 0,
      trust_score: 50,
    });
    prismaMock.profiles.findFirst.mockResolvedValue(null);

    prismaMock.profiles.update.mockResolvedValue({
      id: "user123",
      dni_verificado: true,
      dni_intentos: 0,
      trust_score: 65,
      dni_verification_version: "v2",
      dni_ai_confidence: 0.95,
      consentimiento_bio: new Date(),
    });

    const payload = {
      dni: "70123456",
      documentPath: "user123/dni-front_123.webp",
      selfiePath: "user123/selfie_123.webp",
      consentimientoBio: true,
    };

    const result = await service.verifyDni("user123", payload);

    expect(result.success).toBe(true);
    expect(vertexAiMock.generateContentWithImages).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// ai.service.spec.ts — Tests para AiService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { AiService } from "./ai.service";
import { VertexAiService } from "./vertex-ai.service";
import { InternalServerErrorException, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

describe("AiService", () => {
  let service: AiService;
  let vertexAiServiceMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    vertexAiServiceMock = {
      generateContent: jest.fn(),
    };

    prismaMock = {
      isHealthy: jest.fn().mockReturnValue(true),
      tryReconnect: jest.fn().mockResolvedValue(true),
      profiles: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      moderation_logs: {
        create: jest.fn(),
      },
      user_blocks: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: VertexAiService,
          useValue: vertexAiServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("chat", () => {
    it("debe retornar la respuesta formateada y sugerencias si la IA genera contenido", async () => {
      const mockResult = {
        text: '{"suggestions": ["S1", "S2"]}',
        tokens: 10,
        model: "gemini-flash",
        latencyMs: 120,
      };
      vertexAiServiceMock.generateContent.mockResolvedValue(mockResult);

      const result = await service.chat("user1", "hola", []);

      expect(vertexAiServiceMock.generateContent).toHaveBeenCalledWith("hola", {
        history: [],
        language: "es",
        userContext: expect.any(Object),
      });
      expect(result.reply).toBe('{"suggestions": ["S1", "S2"]}');
      expect(result.suggestions).toEqual(["S1", "S2"]);
    });

    it("debe lanzar InternalServerErrorException si la IA falla", async () => {
      vertexAiServiceMock.generateContent.mockRejectedValue(new Error("unauthenticated error 401"));

      await expect(service.chat("user1", "hola")).rejects.toThrow(InternalServerErrorException);
    });

    it("debe lanzar HttpException por TOO_MANY_REQUESTS si se supera el rate limit", async () => {
      const mockResult = { text: "ok" };
      vertexAiServiceMock.generateContent.mockResolvedValue(mockResult);

      // El límite de chat es 20. Hacemos 21 peticiones para el mismo usuario en el mismo minuto.
      for (let i = 0; i < 20; i++) {
        await service.chat("user-limit", "hola");
      }

      await expect(service.chat("user-limit", "hola")).rejects.toThrow(HttpException);
      try {
        await service.chat("user-limit", "hola");
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });

  describe("welcome", () => {
    it("debe llamar a generateContent con el prompt correcto en inglés", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({ text: "Hi mate" });
      const res = await service.welcome("u1", "en");
      expect(vertexAiServiceMock.generateContent).toHaveBeenCalledWith(
        expect.stringContaining("Respond in English only"),
        expect.any(Object),
      );
      expect(res.reply).toBe("Hi mate");
    });

    it("debe llamar a generateContent con el prompt correcto en portugués", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({ text: "Oi" });
      await service.welcome("u2", "pt");
      expect(vertexAiServiceMock.generateContent).toHaveBeenCalledWith(
        expect.stringContaining("Responda só em português"),
        expect.any(Object),
      );
    });

    it("debe lanzar InternalServerErrorException si la IA falla en welcome", async () => {
      vertexAiServiceMock.generateContent.mockRejectedValue(new Error("quota exceeded 429"));
      await expect(service.welcome("u1", "es")).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("generateCommentSuggestions", () => {
    it("debe llamar a la IA y parsear sugerencias", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: '{"suggestions": ["S1", "S2"]}',
      });

      const res = await service.generateCommentSuggestions("u1", "Contexto", "Parcial");

      expect(res.suggestions).toEqual(["S1", "S2"]);
    });

    it("debe retornar fallback si el JSON de respuesta es inválido", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: "no-json-reply",
      });

      const res = await service.generateCommentSuggestions("u1", "Contexto", "Parcial");
      expect(res.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("generateHashtags", () => {
    it("debe generar y formatear hashtags en minúsculas y sin acentos", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: '{"tags": ["Pádel-Lima", "FÚTBOL!!"]}',
      });

      const res = await service.generateHashtags("u1", "Contenido");

      expect(res.tags).toEqual(["padel-lima", "futbol"]);
    });
  });

  describe("moderateContent", () => {
    it("debe llamar a moderateContent y retornar el resultado de moderación parseado", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: JSON.stringify({
          safe: false,
          flagged: true,
          categorias: { toxicity: 0.9, harassment: 0.1 },
          confidencia: 0.95,
        }),
      });

      const res = await service.moderateContent("u1", "Eres un tonto", "comment");

      expect(res.safe).toBe(false);
      expect(res.flagged).toBe(true);
      expect(res.categorias.toxicity).toBe(0.9);
      expect(res.confidencia).toBe(0.95);
    });

    it("debe retornar defaults si la moderación no devuelve JSON válido", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: "no-json-response",
      });

      const res = await service.moderateContent("u1", "texto", "bio");

      expect(res.safe).toBe(true);
      expect(res.flagged).toBe(false);
    });
  });

  describe("parseVertexAiError mapping", () => {
    it("debe mapear 404 a modelo no disponible", async () => {
      vertexAiServiceMock.generateContent.mockRejectedValue(
        new Error("Resource was not found 404"),
      );
      await expect(service.chat("u1", "h")).rejects.toThrow(
        "El modelo de IA no está disponible. Por favor, contacta al administrador.",
      );
    });

    it("debe mapear unauthenticated a error de autenticación", async () => {
      vertexAiServiceMock.generateContent.mockRejectedValue(new Error("unauthenticated request"));
      await expect(service.chat("u1", "h")).rejects.toThrow(
        "Error de autenticación con el servicio de IA. Por favor, contacta al administrador.",
      );
    });

    it("debe mapear deadline_exceeded a timeout", async () => {
      vertexAiServiceMock.generateContent.mockRejectedValue(new Error("deadline_exceeded"));
      await expect(service.chat("u1", "h")).rejects.toThrow(
        "La IA tardó demasiado en responder. Por favor, intenta de nuevo.",
      );
    });

    it("debe mapear unavailable a servicio no disponible", async () => {
      vertexAiServiceMock.generateContent.mockRejectedValue(
        new Error("service is currently unavailable"),
      );
      await expect(service.chat("u1", "h")).rejects.toThrow(
        "El servicio de IA está temporalmente no disponible. Por favor, intenta en unos segundos.",
      );
    });

    it("debe mapear network errors a no se pudo conectar", async () => {
      vertexAiServiceMock.generateContent.mockRejectedValue(new Error("fetch failed"));
      await expect(service.chat("u1", "h")).rejects.toThrow(
        "No se pudo conectar con el servicio de IA. Verifica tu conexión e intenta de nuevo.",
      );
    });
  });

  describe("moderateAdvanced", () => {
    it("debe retornar allow para contenido limpio", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: JSON.stringify({
          safe: true,
          flagged: false,
          categorias: { toxicity: 0.1, harassment: 0.1, sexual: 0.0, violence: 0.0 },
          confidencia: 0.9,
        }),
      });
      prismaMock.profiles.findUnique.mockResolvedValue({ trust_score: 100 });

      const res = await service.moderateAdvanced("user1", "Hola amigos, ¿cómo están?", "mensaje");

      expect(res.ensemble_score).toBeLessThan(40);
      expect(res.action_recommended).toBe("allow");
      expect(prismaMock.moderation_logs.create).toHaveBeenCalled();
      expect(prismaMock.user_blocks.upsert).not.toHaveBeenCalled();
    });

    it("debe retornar warn para spam leve", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: JSON.stringify({
          safe: true,
          flagged: false,
          categorias: { toxicity: 0.1, harassment: 0.1, sexual: 0.0, violence: 0.0 },
          confidencia: 0.9,
        }),
      });
      prismaMock.profiles.findUnique.mockResolvedValue({ trust_score: 100 });

      const res = await service.moderateAdvanced(
        "user1",
        "¡¡¡Mira esta oferta en www.oferta.com!!!",
        "mensaje",
      );

      expect(res.ensemble_score).toBe(55);
      expect(res.action_recommended).toBe("warn");
      expect(prismaMock.moderation_logs.create).toHaveBeenCalled();
      expect(prismaMock.user_blocks.upsert).not.toHaveBeenCalled();
    });

    it("debe retornar block para insulto directo", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: JSON.stringify({
          safe: false,
          flagged: true,
          categorias: { toxicity: 0.85, harassment: 0.7, sexual: 0.0, violence: 0.0 },
          confidencia: 0.95,
        }),
      });
      prismaMock.profiles.findUnique.mockResolvedValue({ trust_score: 100 });
      prismaMock.profiles.findFirst.mockResolvedValue({ id: "admin-user" });

      const res = await service.moderateAdvanced(
        "user1",
        "Eres un estúpido y una basura",
        "mensaje",
      );

      expect(res.ensemble_score).toBeGreaterThanOrEqual(75);
      expect(res.action_recommended).toBe("block");
      expect(prismaMock.moderation_logs.create).toHaveBeenCalled();
      expect(prismaMock.user_blocks.upsert).toHaveBeenCalled();
    });

    it("debe retornar block para patrón de cancelaciones (comportamiento de usuario bajo)", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: JSON.stringify({
          safe: true,
          flagged: false,
          categorias: { toxicity: 0.1, harassment: 0.1, sexual: 0.0, violence: 0.0 },
          confidencia: 0.9,
        }),
      });
      prismaMock.profiles.findUnique.mockResolvedValue({ trust_score: 25 });
      prismaMock.profiles.findFirst.mockResolvedValue({ id: "admin-user" });

      const res = await service.moderateAdvanced("user1", "Texto normal y limpio", "mensaje");

      expect(res.ensemble_score).toBe(75);
      expect(res.action_recommended).toBe("block");
      expect(prismaMock.moderation_logs.create).toHaveBeenCalled();
      expect(prismaMock.user_blocks.upsert).toHaveBeenCalled();
    });

    it("debe aplicar block en el caso límite de ensemble_score exactamente en 75", async () => {
      vertexAiServiceMock.generateContent.mockResolvedValue({
        text: JSON.stringify({
          safe: true,
          flagged: false,
          categorias: { toxicity: 0.1, harassment: 0.1, sexual: 0.0, violence: 0.0 },
          confidencia: 0.9,
        }),
      });
      prismaMock.profiles.findUnique.mockResolvedValue({ trust_score: 25 });
      prismaMock.profiles.findFirst.mockResolvedValue({ id: "admin-user" });

      const res = await service.moderateAdvanced("user1", "Texto normal", "mensaje");

      expect(res.ensemble_score).toBe(75);
      expect(res.action_recommended).toBe("block");
      expect(prismaMock.user_blocks.upsert).toHaveBeenCalled();
    });
  });
});

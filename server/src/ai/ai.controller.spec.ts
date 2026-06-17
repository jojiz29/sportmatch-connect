/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// ai.controller.spec.ts — Tests para AiController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("AiController", () => {
  let controller: AiController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      chat: jest.fn(),
      welcome: jest.fn(),
      generateCommentSuggestions: jest.fn(),
      generateHashtags: jest.fn(),
      moderateContent: jest.fn(),
      healthCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: serviceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("chat", () => {
    it("debe llamar a service.chat con los parámetros correctos", async () => {
      const dto = { message: "Hola", history: [], language: "es" } as any;
      const req = { user: { sub: "u1" } };
      serviceMock.chat.mockResolvedValue({ reply: "hola" });

      const res = await controller.chat(dto, req as any);

      expect(serviceMock.chat).toHaveBeenCalledWith("u1", "Hola", [], "es");
      expect(res).toEqual({ reply: "hola" });
    });
  });

  describe("welcome", () => {
    it("debe llamar a service.welcome", async () => {
      const dto = { language: "es" } as any;
      const req = { user: { sub: "u1" } };
      serviceMock.welcome.mockResolvedValue({ reply: "bienvenido" });

      const res = await controller.welcome(dto, req as any);

      expect(serviceMock.welcome).toHaveBeenCalledWith("u1", "es");
      expect(res).toEqual({ reply: "bienvenido" });
    });
  });

  describe("commentSuggestion", () => {
    it("debe llamar a service.generateCommentSuggestions", async () => {
      const dto = { postContext: "ctx", partialText: "par", language: "es" } as any;
      const req = { user: { sub: "u1" } };
      serviceMock.generateCommentSuggestions.mockResolvedValue({ suggestions: [] });

      const res = await controller.commentSuggestion(dto, req as any);

      expect(serviceMock.generateCommentSuggestions).toHaveBeenCalledWith("u1", "ctx", "par", "es");
      expect(res).toEqual({ suggestions: [] });
    });
  });

  describe("hashtags", () => {
    it("debe llamar a service.generateHashtags", async () => {
      const dto = { content: "post", minTags: 3, maxTags: 5, language: "es" } as any;
      const req = { user: { sub: "u1" } };
      serviceMock.generateHashtags.mockResolvedValue({ tags: [] });

      const res = await controller.hashtags(dto, req as any);

      expect(serviceMock.generateHashtags).toHaveBeenCalledWith("u1", "post", {
        minTags: 3,
        maxTags: 5,
        language: "es",
      });
      expect(res).toEqual({ tags: [] });
    });
  });

  describe("moderate", () => {
    it("debe llamar a service.moderateContent", async () => {
      const dto = { text: "t", context: "post" } as any;
      const req = { user: { sub: "u1" } };
      serviceMock.moderateContent.mockResolvedValue({ safe: true });

      const res = await controller.moderate(dto, req as any);

      expect(serviceMock.moderateContent).toHaveBeenCalledWith("u1", "t", "post");
      expect(res).toEqual({ safe: true });
    });
  });

  describe("health", () => {
    it("debe retornar status ok cuando Vertex AI responde", async () => {
      serviceMock.healthCheck.mockResolvedValue({ status: "ok", message: "Vertex AI connected" });
      const res = await controller.health();
      expect(res).toEqual({ status: "ok", message: "Vertex AI connected" });
    });

    it("debe retornar status degraded cuando el módulo está caído", async () => {
      serviceMock.healthCheck.mockResolvedValue({
        status: "degraded",
        message: "Vertex AI not configured",
      });
      const res = await controller.health();
      expect(res).toEqual({ status: "degraded", message: "Vertex AI not configured" });
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// posts.controller.spec.ts — Tests para PostsController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("PostsController", () => {
  let controller: PostsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addComment: jest.fn(),
      deleteComment: jest.fn(),
      addReaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: serviceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("debe llamar a service.findAll con query param", async () => {
      serviceMock.findAll.mockResolvedValue([]);
      const res = await controller.findAll("futbol");
      expect(serviceMock.findAll).toHaveBeenCalledWith("futbol");
      expect(res).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("debe llamar a service.findOne con param id", async () => {
      serviceMock.findOne.mockResolvedValue({ id: "p1" });
      const res = await controller.findOne("p1");
      expect(serviceMock.findOne).toHaveBeenCalledWith("p1");
      expect(res).toEqual({ id: "p1" });
    });
  });

  describe("create", () => {
    it("debe llamar a service.create con body y userId", async () => {
      const dto = { content: "content" } as any;
      const req = { user: { userId: "u1" } };
      serviceMock.create.mockResolvedValue({ id: "p1" });

      const res = await controller.create(dto, req as any);

      expect(serviceMock.create).toHaveBeenCalledWith(dto, "u1");
      expect(res).toEqual({ id: "p1" });
    });
  });

  describe("update", () => {
    it("debe llamar a service.update con id, body y userId", async () => {
      const dto = { content: "content" } as any;
      const req = { user: { userId: "u1" } };
      serviceMock.update.mockResolvedValue({ id: "p1" });

      const res = await controller.update("p1", dto, req as any);

      expect(serviceMock.update).toHaveBeenCalledWith("p1", dto, "u1");
      expect(res).toEqual({ id: "p1" });
    });
  });

  describe("delete", () => {
    it("debe llamar a service.delete con id y userId", async () => {
      const req = { user: { userId: "u1" } };
      serviceMock.delete.mockResolvedValue({ id: "p1" });

      const res = await controller.delete("p1", req as any);

      expect(serviceMock.delete).toHaveBeenCalledWith("p1", "u1");
      expect(res).toEqual({ id: "p1" });
    });
  });

  describe("addComment", () => {
    it("debe llamar a service.addComment con id, body y userId", async () => {
      const dto = { content: "comment" } as any;
      const req = { user: { userId: "u1" } };
      serviceMock.addComment.mockResolvedValue({ id: "c1" });

      const res = await controller.addComment("p1", dto, req as any);

      expect(serviceMock.addComment).toHaveBeenCalledWith("p1", dto, "u1");
      expect(res).toEqual({ id: "c1" });
    });
  });

  describe("deleteComment", () => {
    it("debe llamar a service.deleteComment con commentId y userId", async () => {
      const req = { user: { userId: "u1" } };
      serviceMock.deleteComment.mockResolvedValue({ id: "c1" });

      const res = await controller.deleteComment("c1", req as any);

      expect(serviceMock.deleteComment).toHaveBeenCalledWith("c1", "u1");
      expect(res).toEqual({ id: "c1" });
    });
  });

  describe("addReaction", () => {
    it("debe llamar a service.addReaction con commentId, body y userId", async () => {
      const dto = { reaction_type: "LIKE" } as any;
      const req = { user: { userId: "u1" } };
      serviceMock.addReaction.mockResolvedValue({ success: true });

      const res = await controller.addReaction("c1", dto, req as any);

      expect(serviceMock.addReaction).toHaveBeenCalledWith("c1", dto, "u1");
      expect(res).toEqual({ success: true });
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// posts.service.spec.ts — Tests para PostsService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { PostsService } from "./posts.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("PostsService", () => {
  let service: PostsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      posts: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      post_comments: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      post_comment_reactions: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("debe buscar posts sin filtro de deporte", async () => {
      prismaMock.posts.findMany.mockResolvedValue([]);
      const res = await service.findAll();
      expect(prismaMock.posts.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
      expect(res).toEqual([]);
    });

    it("debe buscar posts filtrando por deporte", async () => {
      prismaMock.posts.findMany.mockResolvedValue([]);
      await service.findAll("futbol");
      expect(prismaMock.posts.findMany).toHaveBeenCalledWith({
        where: { sport: "futbol" },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe("findOne", () => {
    it("debe devolver el post si existe", async () => {
      prismaMock.posts.findUnique.mockResolvedValue({ id: "p1" });
      const res = await service.findOne("p1");
      expect(res).toEqual({ id: "p1" });
    });

    it("debe lanzar NotFoundException si no existe", async () => {
      prismaMock.posts.findUnique.mockResolvedValue(null);
      await expect(service.findOne("p2")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("debe crear el post", async () => {
      const dto = { content: "Hola", sport: "tenis" } as any;
      prismaMock.posts.create.mockResolvedValue({ id: "p1", ...dto });
      const res = await service.create(dto, "u1");
      expect(prismaMock.posts.create).toHaveBeenCalledWith({
        data: { content: "Hola", sport: "tenis", user_id: "u1" },
        include: expect.any(Object),
      });
      expect(res).toEqual({ id: "p1", ...dto });
    });
  });

  describe("update", () => {
    it("debe lanzar NotFoundException si no existe", async () => {
      prismaMock.posts.findUnique.mockResolvedValue(null);
      await expect(service.update("p1", {}, "u1")).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ForbiddenException si no es el dueño", async () => {
      prismaMock.posts.findUnique.mockResolvedValue({ id: "p1", user_id: "u2" });
      await expect(service.update("p1", {}, "u1")).rejects.toThrow(ForbiddenException);
    });

    it("debe actualizar si es el dueño", async () => {
      prismaMock.posts.findUnique.mockResolvedValue({ id: "p1", user_id: "u1" });
      prismaMock.posts.update.mockResolvedValue({ id: "p1", content: "Actualizado" });

      const res = await service.update("p1", { content: "Actualizado" }, "u1");
      expect(res.content).toBe("Actualizado");
    });
  });

  describe("delete", () => {
    it("debe lanzar NotFoundException si no existe", async () => {
      prismaMock.posts.findUnique.mockResolvedValue(null);
      await expect(service.delete("p1", "u1")).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ForbiddenException si no es el dueño", async () => {
      prismaMock.posts.findUnique.mockResolvedValue({ id: "p1", user_id: "u2" });
      await expect(service.delete("p1", "u1")).rejects.toThrow(ForbiddenException);
    });

    it("debe eliminar si es el dueño", async () => {
      prismaMock.posts.findUnique.mockResolvedValue({ id: "p1", user_id: "u1" });
      prismaMock.posts.delete.mockResolvedValue({ id: "p1" });

      const res = await service.delete("p1", "u1");
      expect(res).toEqual({ id: "p1" });
    });
  });

  describe("addComment", () => {
    it("debe lanzar NotFoundException si el post no existe", async () => {
      prismaMock.posts.findUnique.mockResolvedValue(null);
      await expect(service.addComment("p1", { content: "com" }, "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("debe crear el comentario si el post existe", async () => {
      prismaMock.posts.findUnique.mockResolvedValue({ id: "p1" });
      prismaMock.post_comments.create.mockResolvedValue({ id: "c1", content: "com" });

      const res = await service.addComment("p1", { content: "com" }, "u1");

      expect(prismaMock.post_comments.create).toHaveBeenCalledWith({
        data: {
          post_id: "p1",
          user_id: "u1",
          content: "com",
          parent_id: undefined,
        },
        include: expect.any(Object),
      });
      expect(res).toEqual({ id: "c1", content: "com" });
    });
  });

  describe("deleteComment", () => {
    it("debe lanzar NotFoundException si no existe", async () => {
      prismaMock.post_comments.findUnique.mockResolvedValue(null);
      await expect(service.deleteComment("c1", "u1")).rejects.toThrow(NotFoundException);
    });

    it("debe lanzar ForbiddenException si no es el dueño", async () => {
      prismaMock.post_comments.findUnique.mockResolvedValue({ id: "c1", user_id: "u2" });
      await expect(service.deleteComment("c1", "u1")).rejects.toThrow(ForbiddenException);
    });

    it("debe eliminar si es el dueño", async () => {
      prismaMock.post_comments.findUnique.mockResolvedValue({ id: "c1", user_id: "u1" });
      prismaMock.post_comments.delete.mockResolvedValue({ id: "c1" });

      const res = await service.deleteComment("c1", "u1");
      expect(res).toEqual({ id: "c1" });
    });
  });

  describe("addReaction", () => {
    it("debe lanzar NotFoundException si el comentario no existe", async () => {
      prismaMock.post_comments.findUnique.mockResolvedValue(null);
      await expect(service.addReaction("c1", { reaction_type: "LIKE" }, "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("debe eliminar la reacción si ya existía el mismo tipo (toggle off)", async () => {
      prismaMock.post_comments.findUnique.mockResolvedValue({ id: "c1" });
      prismaMock.post_comment_reactions.findUnique.mockResolvedValue({
        id: "re1",
        reaction_type: "LIKE",
      });
      prismaMock.post_comment_reactions.delete.mockResolvedValue({ id: "re1" });

      const res = await service.addReaction("c1", { reaction_type: "LIKE" }, "u1");

      expect(prismaMock.post_comment_reactions.delete).toHaveBeenCalledWith({
        where: { id: "re1" },
      });
      expect(res).toEqual({ action: "removed" });
    });

    it("debe actualizar la reacción si ya existía pero con otro tipo", async () => {
      prismaMock.post_comments.findUnique.mockResolvedValue({ id: "c1" });
      prismaMock.post_comment_reactions.findUnique.mockResolvedValue({
        id: "re1",
        reaction_type: "LIKE",
      });
      prismaMock.post_comment_reactions.update.mockResolvedValue({
        id: "re1",
        reaction_type: "LOVE",
      });

      const res = await service.addReaction("c1", { reaction_type: "LOVE" }, "u1");

      expect(prismaMock.post_comment_reactions.update).toHaveBeenCalledWith({
        where: { id: "re1" },
        data: { reaction_type: "LOVE" },
      });
      expect((res as any).reaction_type).toBe("LOVE");
    });

    it("debe crear la reacción si no existía previamente", async () => {
      prismaMock.post_comments.findUnique.mockResolvedValue({ id: "c1" });
      prismaMock.post_comment_reactions.findUnique.mockResolvedValue(null);
      prismaMock.post_comment_reactions.create.mockResolvedValue({
        id: "re1",
        reaction_type: "LIKE",
      });

      const res = await service.addReaction("c1", { reaction_type: "LIKE" }, "u1");

      expect(prismaMock.post_comment_reactions.create).toHaveBeenCalledWith({
        data: {
          comment_id: "c1",
          user_id: "u1",
          reaction_type: "LIKE",
        },
      });
      expect((res as any).reaction_type).toBe("LIKE");
    });
  });
});

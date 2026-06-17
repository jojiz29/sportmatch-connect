import { Test, TestingModule } from "@nestjs/testing";
import { SocialService } from "./social.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";

describe("SocialService", () => {
  let service: SocialService;

  const prismaMock = {
    profiles: {
      findUnique: jest.fn(),
    },
    followers: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<SocialService>(SocialService);
    jest.clearAllMocks();
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("follow", () => {
    it("lanza BadRequestException si faltan IDs", async () => {
      await expect(service.follow("", "b")).rejects.toThrow(BadRequestException);
      await expect(service.follow("a", "")).rejects.toThrow(BadRequestException);
    });

    it("lanza BadRequestException si followerId === followingId", async () => {
      await expect(service.follow("a", "a")).rejects.toThrow(BadRequestException);
    });

    it("lanza NotFoundException si el usuario a seguir no existe", async () => {
      prismaMock.profiles.findUnique.mockResolvedValueOnce(null);
      await expect(service.follow("a", "b")).rejects.toThrow(NotFoundException);
    });

    it("crea un follow exitosamente", async () => {
      prismaMock.profiles.findUnique.mockResolvedValueOnce({ id: "b" });
      const mockFollow = { follower_id: "a", following_id: "b" };
      prismaMock.followers.create.mockResolvedValueOnce(mockFollow);

      const result = await service.follow("a", "b");
      expect(result).toEqual(mockFollow);
      expect(prismaMock.followers.create).toHaveBeenCalledWith({
        data: { follower_id: "a", following_id: "b" },
      });
    });

    it("lanza BadRequestException si ya lo sigue (P2002)", async () => {
      prismaMock.profiles.findUnique.mockResolvedValueOnce({ id: "b" });
      const err = new Error("Unique constraint");
      (err as { code?: string }).code = "P2002";
      prismaMock.followers.create.mockRejectedValueOnce(err);

      await expect(service.follow("a", "b")).rejects.toThrow(BadRequestException);
    });

    it("lanza InternalServerErrorException por otros errores", async () => {
      prismaMock.profiles.findUnique.mockResolvedValueOnce({ id: "b" });
      prismaMock.followers.create.mockRejectedValueOnce(new Error("DB Error"));

      await expect(service.follow("a", "b")).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("unfollow", () => {
    it("lanza BadRequestException si faltan IDs", async () => {
      await expect(service.unfollow("", "b")).rejects.toThrow(BadRequestException);
      await expect(service.unfollow("a", "")).rejects.toThrow(BadRequestException);
    });

    it("elimina un follow exitosamente", async () => {
      prismaMock.followers.delete.mockResolvedValueOnce({});
      await service.unfollow("a", "b");

      expect(prismaMock.followers.delete).toHaveBeenCalledWith({
        where: { follower_id_following_id: { follower_id: "a", following_id: "b" } },
      });
    });

    it("lanza BadRequestException si no lo sigue (P2025)", async () => {
      const err = new Error("Not found");
      (err as { code?: string }).code = "P2025";
      prismaMock.followers.delete.mockRejectedValueOnce(err);

      await expect(service.unfollow("a", "b")).rejects.toThrow(BadRequestException);
    });

    it("lanza InternalServerErrorException por otros errores", async () => {
      prismaMock.followers.delete.mockRejectedValueOnce(new Error("DB Error"));
      await expect(service.unfollow("a", "b")).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getFollowers", () => {
    it("lanza BadRequestException si falta userId", async () => {
      await expect(service.getFollowers("")).rejects.toThrow(BadRequestException);
    });

    it("devuelve paginación de seguidores", async () => {
      const mockItems = [{ follower: { id: "f1", name: "User 1" } }];
      prismaMock.followers.findMany.mockResolvedValueOnce(mockItems);
      prismaMock.followers.count.mockResolvedValueOnce(1);

      const result = await service.getFollowers("u1", 1, 10);
      expect(result).toEqual({
        items: [{ id: "f1", name: "User 1" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe("getFollowing", () => {
    it("lanza BadRequestException si falta userId", async () => {
      await expect(service.getFollowing("")).rejects.toThrow(BadRequestException);
    });

    it("devuelve paginación de seguidos", async () => {
      const mockItems = [{ following: { id: "f2", name: "User 2" } }];
      prismaMock.followers.findMany.mockResolvedValueOnce(mockItems);
      prismaMock.followers.count.mockResolvedValueOnce(1);

      const result = await service.getFollowing("u1", 1, 10);
      expect(result).toEqual({
        items: [{ id: "f2", name: "User 2" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe("getFollowStats", () => {
    it("lanza BadRequestException si falta userId", async () => {
      await expect(service.getFollowStats("")).rejects.toThrow(BadRequestException);
    });

    it("devuelve las estadísticas de seguidores y seguidos", async () => {
      prismaMock.followers.count
        .mockResolvedValueOnce(10) // followers
        .mockResolvedValueOnce(5); // following

      const result = await service.getFollowStats("u1");
      expect(result).toEqual({ followers_count: 10, following_count: 5 });
    });
  });

  describe("getSuggestions", () => {
    it("lanza BadRequestException si falta userId", async () => {
      await expect(service.getSuggestions("")).rejects.toThrow(BadRequestException);
    });

    it("devuelve los resultados de get_follow_suggestions con deporte", async () => {
      const mockSuggestions = [{ id: "s1" }];
      prismaMock.$queryRawUnsafe.mockResolvedValueOnce(mockSuggestions);

      const result = await service.getSuggestions("u1", 10, "Padel");
      expect(result).toEqual(mockSuggestions);
      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("get_follow_suggestions"),
        "u1",
        10,
        "Padel",
      );
    });

    it("devuelve un array vacío si la RPC falla", async () => {
      prismaMock.$queryRawUnsafe.mockRejectedValueOnce(new Error("RPC Error"));
      const result = await service.getSuggestions("u1");
      expect(result).toEqual([]);
    });
  });

  describe("isFollowing", () => {
    it("devuelve false si faltan IDs", async () => {
      expect(await service.isFollowing("", "b")).toBe(false);
      expect(await service.isFollowing("a", "")).toBe(false);
    });

    it("devuelve true si el conteo es mayor que 0", async () => {
      prismaMock.followers.count.mockResolvedValueOnce(1);
      expect(await service.isFollowing("a", "b")).toBe(true);
    });

    it("devuelve false si el conteo es 0", async () => {
      prismaMock.followers.count.mockResolvedValueOnce(0);
      expect(await service.isFollowing("a", "b")).toBe(false);
    });
  });
});

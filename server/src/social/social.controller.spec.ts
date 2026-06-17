import { Test, TestingModule } from "@nestjs/testing";
import { SocialController } from "./social.controller";
import { SocialService } from "./social.service";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";

describe("SocialController", () => {
  let controller: SocialController;
  let service: SocialService;

  const mockSocialService = {
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    getFollowStats: jest.fn(),
    isFollowing: jest.fn(),
    follow: jest.fn(),
    unfollow: jest.fn(),
    getSuggestions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [{ provide: SocialService, useValue: mockSocialService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SocialController>(SocialController);
    service = module.get<SocialService>(SocialService);
    jest.clearAllMocks();
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("getFollowers", () => {
    it("llama a service.getFollowers con los args correctos", async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      mockSocialService.getFollowers.mockResolvedValueOnce(mockResult);

      const result = await controller.getFollowers("u1", { page: 1, limit: 10 });
      expect(service.getFollowers).toHaveBeenCalledWith("u1", 1, 10);
      expect(result).toEqual(mockResult);
    });
  });

  describe("getFollowing", () => {
    it("llama a service.getFollowing con los args correctos", async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      mockSocialService.getFollowing.mockResolvedValueOnce(mockResult);

      const result = await controller.getFollowing("u1", { page: 1, limit: 10 });
      expect(service.getFollowing).toHaveBeenCalledWith("u1", 1, 10);
      expect(result).toEqual(mockResult);
    });
  });

  describe("getFollowStats", () => {
    it("llama a service.getFollowStats", async () => {
      const mockStats = { followers_count: 5, following_count: 5 };
      mockSocialService.getFollowStats.mockResolvedValueOnce(mockStats);

      const result = await controller.getFollowStats("u1");
      expect(service.getFollowStats).toHaveBeenCalledWith("u1");
      expect(result).toEqual(mockStats);
    });
  });

  describe("isFollowing", () => {
    it("llama a service.isFollowing y retorna { following: bool }", async () => {
      mockSocialService.isFollowing.mockResolvedValueOnce(true);
      const req = { user: { userId: "follower-id" } };

      const result = await controller.isFollowing("following-id", req);
      expect(service.isFollowing).toHaveBeenCalledWith("follower-id", "following-id");
      expect(result).toEqual({ following: true });
    });
  });

  describe("follow", () => {
    it("llama a service.follow", async () => {
      const mockFollow = { follower_id: "a", following_id: "b" };
      mockSocialService.follow.mockResolvedValueOnce(mockFollow);
      const req = { user: { userId: "a" } };

      const result = await controller.follow("b", req);
      expect(service.follow).toHaveBeenCalledWith("a", "b");
      expect(result).toEqual(mockFollow);
    });
  });

  describe("unfollow", () => {
    it("llama a service.unfollow", async () => {
      mockSocialService.unfollow.mockResolvedValueOnce(undefined);
      const req = { user: { userId: "a" } };

      await controller.unfollow("b", req);
      expect(service.unfollow).toHaveBeenCalledWith("a", "b");
    });
  });

  describe("getSuggestions", () => {
    it("llama a service.getSuggestions con args completos", async () => {
      const mockRes = [{ id: "s1" }];
      mockSocialService.getSuggestions.mockResolvedValueOnce(mockRes);
      const req = { user: { userId: "u1" } };

      const result = await controller.getSuggestions(req, { limit: 5, sport: "Padel" });
      expect(service.getSuggestions).toHaveBeenCalledWith("u1", 5, "Padel");
      expect(result).toEqual(mockRes);
    });

    it("llama a service.getSuggestions con valores default", async () => {
      const req = { user: { userId: "u1" } };
      await controller.getSuggestions(req, {});
      expect(service.getSuggestions).toHaveBeenCalledWith("u1", 10, undefined);
    });
  });
});

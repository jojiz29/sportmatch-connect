/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// courts.controller.spec.ts — Tests para CourtsController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { CourtsController } from "./courts.controller";
import { CourtsService } from "./courts.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("CourtsController", () => {
  let controller: CourtsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createReview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourtsController],
      providers: [
        {
          provide: CourtsService,
          useValue: serviceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<CourtsController>(CourtsController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("debe llamar a service.findAll con query params", async () => {
      serviceMock.findAll.mockResolvedValue([]);
      const res = await controller.findAll("tennis", "surco");
      expect(serviceMock.findAll).toHaveBeenCalledWith("tennis", "surco");
      expect(res).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("debe llamar a service.findOne con param id", async () => {
      serviceMock.findOne.mockResolvedValue({ id: "c1" });
      const res = await controller.findOne("c1");
      expect(serviceMock.findOne).toHaveBeenCalledWith("c1");
      expect(res).toEqual({ id: "c1" });
    });
  });

  describe("create", () => {
    it("debe llamar a service.create con body", async () => {
      const dto = { name: "Cancha" } as any;
      serviceMock.create.mockResolvedValue({ id: "c1" });
      const res = await controller.create(dto);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
      expect(res).toEqual({ id: "c1" });
    });
  });

  describe("update", () => {
    it("debe llamar a service.update con param y body", async () => {
      const dto = { name: "Nuevo" } as any;
      serviceMock.update.mockResolvedValue({ id: "c1" });
      const res = await controller.update("c1", dto);
      expect(serviceMock.update).toHaveBeenCalledWith("c1", dto);
      expect(res).toEqual({ id: "c1" });
    });
  });

  describe("delete", () => {
    it("debe llamar a service.delete con param", async () => {
      serviceMock.delete.mockResolvedValue({ id: "c1" });
      const res = await controller.delete("c1");
      expect(serviceMock.delete).toHaveBeenCalledWith("c1");
      expect(res).toEqual({ id: "c1" });
    });
  });

  describe("createReview", () => {
    it("debe llamar a service.createReview con param, body y userId", async () => {
      const data = { rating: 5, comment: "ok" };
      const req = { user: { userId: "u1" } };
      serviceMock.createReview.mockResolvedValue({ id: "r1" });
      const res = await controller.createReview("c1", data, req as any);
      expect(serviceMock.createReview).toHaveBeenCalledWith("c1", "u1", data);
      expect(res).toEqual({ id: "r1" });
    });
  });
});

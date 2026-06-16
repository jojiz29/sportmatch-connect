/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// matches.controller.spec.ts — Tests para MatchesController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { MatchesController } from "./matches.controller";
import { MatchesService } from "./matches.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("MatchesController", () => {
  let controller: MatchesController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [
        {
          provide: MatchesService,
          useValue: serviceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
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
      serviceMock.findOne.mockResolvedValue({ id: "m1" });
      const res = await controller.findOne("m1");
      expect(serviceMock.findOne).toHaveBeenCalledWith("m1");
      expect(res).toEqual({ id: "m1" });
    });
  });

  describe("create", () => {
    it("debe llamar a service.create con body y userId", async () => {
      const dto = { title: "Nuevo" } as any;
      const req = { user: { userId: "u1" } };
      serviceMock.create.mockResolvedValue({ id: "m1" });

      const res = await controller.create(dto, req as any);

      expect(serviceMock.create).toHaveBeenCalledWith(dto, "u1");
      expect(res).toEqual({ id: "m1" });
    });
  });

  describe("update", () => {
    it("debe llamar a service.update con id, body y userId", async () => {
      const dto = { title: "Nuevo" } as any;
      const req = { user: { userId: "u1" } };
      serviceMock.update.mockResolvedValue({ id: "m1" });

      const res = await controller.update("m1", dto, req as any);

      expect(serviceMock.update).toHaveBeenCalledWith("m1", dto, "u1");
      expect(res).toEqual({ id: "m1" });
    });
  });

  describe("delete", () => {
    it("debe llamar a service.delete con id y userId", async () => {
      const req = { user: { userId: "u1" } };
      serviceMock.delete.mockResolvedValue({ id: "m1" });

      const res = await controller.delete("m1", req as any);

      expect(serviceMock.delete).toHaveBeenCalledWith("m1", "u1");
      expect(res).toEqual({ id: "m1" });
    });
  });

  describe("join", () => {
    it("debe llamar a service.join con id y userId", async () => {
      const req = { user: { userId: "u1" } };
      serviceMock.join.mockResolvedValue({ success: true });

      const res = await controller.join("m1", req as any);

      expect(serviceMock.join).toHaveBeenCalledWith("m1", "u1");
      expect(res).toEqual({ success: true });
    });
  });

  describe("leave", () => {
    it("debe llamar a service.leave con id y userId", async () => {
      const req = { user: { userId: "u1" } };
      serviceMock.leave.mockResolvedValue({ success: true });

      const res = await controller.leave("m1", req as any);

      expect(serviceMock.leave).toHaveBeenCalledWith("m1", "u1");
      expect(res).toEqual({ success: true });
    });
  });
});

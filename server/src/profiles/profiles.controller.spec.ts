/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// profiles.controller.spec.ts — Tests para ProfilesController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("ProfilesController", () => {
  let controller: ProfilesController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      verifyDni: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: serviceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("debe llamar a service.findAll", async () => {
      serviceMock.findAll.mockResolvedValue([]);
      const res = await controller.findAll();
      expect(serviceMock.findAll).toHaveBeenCalled();
      expect(res).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("debe llamar a service.findOne", async () => {
      serviceMock.findOne.mockResolvedValue({ id: "u1" });
      const res = await controller.findOne("u1");
      expect(serviceMock.findOne).toHaveBeenCalledWith("u1");
      expect(res).toEqual({ id: "u1" });
    });
  });

  describe("update", () => {
    it("debe llamar a service.update con id y body", async () => {
      const dto = { name: "Edwin" };
      serviceMock.update.mockResolvedValue({ id: "u1", name: "Edwin" });
      const res = await controller.update("u1", dto);
      expect(serviceMock.update).toHaveBeenCalledWith("u1", dto);
      expect(res).toEqual({ id: "u1", name: "Edwin" });
    });
  });

  describe("verifyDni", () => {
    it("debe llamar a service.verifyDni con userId y dni", async () => {
      const data = { dni: "12345678" };
      const req = { user: { userId: "u1" } };
      serviceMock.verifyDni.mockResolvedValue({ success: true });

      const res = await controller.verifyDni(req as any, data);

      expect(serviceMock.verifyDni).toHaveBeenCalledWith("u1", "12345678");
      expect(res).toEqual({ success: true });
    });
  });
});

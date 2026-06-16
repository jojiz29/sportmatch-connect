/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// users.controller.spec.ts — Tests para UsersController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
      getLeaderboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
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

  describe("getLeaderboard", () => {
    it("debe llamar a service.getLeaderboard", async () => {
      serviceMock.getLeaderboard.mockResolvedValue([]);
      const res = await controller.getLeaderboard();
      expect(serviceMock.getLeaderboard).toHaveBeenCalled();
      expect(res).toEqual([]);
    });
  });
});

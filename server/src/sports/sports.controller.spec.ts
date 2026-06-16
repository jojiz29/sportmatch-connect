/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// sports.controller.spec.ts — Tests para SportsController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { SportsController } from "./sports.controller";
import { SportsService } from "./sports.service";

describe("SportsController", () => {
  let controller: SportsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SportsController],
      providers: [
        {
          provide: SportsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<SportsController>(SportsController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("debe retornar la lista de deportes desde el servicio", async () => {
      serviceMock.findAll.mockResolvedValue([{ id: "s1", name: "Fútbol" }]);
      const res = await controller.findAll();
      expect(serviceMock.findAll).toHaveBeenCalled();
      expect(res).toEqual([{ id: "s1", name: "Fútbol" }]);
    });
  });
});

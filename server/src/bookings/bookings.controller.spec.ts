/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// bookings.controller.spec.ts — Tests para BookingsController
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";

describe("BookingsController", () => {
  let controller: BookingsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      getByCourtAndDate: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: serviceMock,
        },
        {
          provide: SupabaseAuthService,
          useValue: { validateToken: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it("debe estar definido", () => {
    expect(controller).toBeDefined();
  });

  describe("getByCourtAndDate", () => {
    it("debe llamar a service.getByCourtAndDate y devolver el resultado", async () => {
      const mockSlots = ["09:00", "10:00"];
      serviceMock.getByCourtAndDate.mockResolvedValue(mockSlots);

      const result = await controller.getByCourtAndDate("court-123", "2026-06-16");

      expect(serviceMock.getByCourtAndDate).toHaveBeenCalledWith("court-123", "2026-06-16");
      expect(result).toEqual(mockSlots);
    });
  });

  describe("create", () => {
    it("debe llamar a service.create y devolver la reserva creada", async () => {
      const mockBooking = { id: "booking-123" };
      serviceMock.create.mockResolvedValue(mockBooking);

      const data = {
        court_id: "court-123",
        date: "2026-06-16",
        time: "10:00",
        user_id: "user-123",
      };

      const result = await controller.create(data);

      expect(serviceMock.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockBooking);
    });
  });
});

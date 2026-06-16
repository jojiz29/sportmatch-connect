/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// bookings.service.spec.ts — Tests para BookingsService
// ============================================================

import { Test, TestingModule } from "@nestjs/testing";
import { BookingsService } from "./bookings.service";
import { PrismaService } from "../prisma/prisma.service";

describe("BookingsService", () => {
  let service: BookingsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      bookings: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it("debe estar definido", () => {
    expect(service).toBeDefined();
  });

  describe("getByCourtAndDate", () => {
    it("debe devolver un array de slots ocupados", async () => {
      prismaMock.bookings.findMany.mockResolvedValue([
        { time_slot: "09:00-10:00" },
        { time_slot: "11:00-12:00" },
      ]);

      const slots = await service.getByCourtAndDate("court-123", "2026-06-16");

      expect(prismaMock.bookings.findMany).toHaveBeenCalledWith({
        where: { court_id: "court-123", date: "2026-06-16" },
        select: { time_slot: true },
      });
      expect(slots).toEqual(["09:00-10:00", "11:00-12:00"]);
    });

    it("debe devolver array vacío si no hay reservas", async () => {
      prismaMock.bookings.findMany.mockResolvedValue([]);
      const slots = await service.getByCourtAndDate("court-123", "2026-06-16");
      expect(slots).toEqual([]);
    });
  });

  describe("create", () => {
    it("debe crear una nueva reserva exitosamente", async () => {
      const mockBooking = {
        id: "booking-123",
        court_id: "court-123",
        date: "2026-06-16",
        time_slot: "10:00",
        user_id: "user-123",
        precio_cancha: 50,
        porcentaje_comision: 10,
        monto_comision: 5,
        total_cobrado: 55,
      };
      prismaMock.bookings.create.mockResolvedValue(mockBooking);

      const data = {
        court_id: "court-123",
        date: "2026-06-16",
        time: "10:00",
        user_id: "user-123",
        precio_cancha: 50,
        porcentaje_comision: 10,
        monto_comision: 5,
        total_cobrado: 55,
      };

      const result = await service.create(data);

      expect(prismaMock.bookings.create).toHaveBeenCalledWith({
        data: {
          court_id: "court-123",
          date: "2026-06-16",
          time_slot: "10:00",
          user_id: "user-123",
          precio_cancha: 50,
          porcentaje_comision: 10,
          monto_comision: 5,
          total_cobrado: 55,
        },
      });
      expect(result).toEqual(mockBooking);
    });
  });
});

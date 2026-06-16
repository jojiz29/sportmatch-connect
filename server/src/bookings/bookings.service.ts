// ============================================================
// bookings.service.ts — Servicio de reservas
// Consulta slots ocupados por cancha/fecha y crea nuevas reservas
// ============================================================

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByCourtAndDate(courtId: string, date: string) {
    const bookings = await this.prisma.bookings.findMany({
      where: { court_id: courtId, date },
      select: { time_slot: true },
    });
    return bookings.map((b) => b.time_slot);
  }

  async create(data: {
    court_id: string;
    date: string;
    time: string;
    user_id: string;
    precio_cancha?: number;
    porcentaje_comision?: number;
    monto_comision?: number;
    total_cobrado?: number;
  }) {
    return this.prisma.bookings.create({
      data: {
        court_id: data.court_id,
        date: data.date,
        time_slot: data.time,
        user_id: data.user_id,
        precio_cancha: data.precio_cancha,
        porcentaje_comision: data.porcentaje_comision,
        monto_comision: data.monto_comision,
        total_cobrado: data.total_cobrado,
      },
    });
  }
}

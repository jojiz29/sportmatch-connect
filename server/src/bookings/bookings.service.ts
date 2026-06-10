import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async getByCourtAndDate(courtId: string, date: string) {
    const bookings = await this.prisma.bookings.findMany({
      where: { court_id: courtId, date },
      select: { time: true },
    });
    return bookings.map((b) => b.time);
  }

  async create(data: {
    court_id: string;
    date: string;
    time: string;
    user_id: string;
    hours?: number;
    total_price?: number;
  }) {
    return this.prisma.bookings.create({
      data: {
        court_id: data.court_id,
        date: data.date,
        time: data.time,
        user_id: data.user_id,
        hours: data.hours || 1,
        total_price: data.total_price || 0,
      },
    });
  }
}

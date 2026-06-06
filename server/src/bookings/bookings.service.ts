import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  }) {
    return this.prisma.bookings.create({
      data: {
        court_id: data.court_id,
        date: data.date,
        time: data.time,
        user_id: data.user_id,
      },
    });
  }
}
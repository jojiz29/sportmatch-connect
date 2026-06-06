import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(excludeUserId?: string) {
    let where = {};
    if (excludeUserId) {
      where = { id: { not: excludeUserId } };
    }
    return this.prisma.profiles.findMany({
      where,
      take: 30,
      orderBy: { created_at: 'desc' },
    });
  }

  async getLeaderboard() {
    return this.prisma.profiles.findMany({
      where: { user_role: 'PLAYER' },
      take: 20,
      orderBy: { fitcoins_balance: 'desc' },
    });
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(excludeUserId?: string) {
    try {
      const where = excludeUserId ? { id: { not: excludeUserId } } : {};
      return await this.prisma.profiles.findMany({
        where,
        take: 30,
      });
    } catch (error) {
      console.error('UsersService.findAll error:', error);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      return await this.prisma.$queryRaw`SELECT * FROM profiles WHERE fitcoins_balance IS NOT NULL ORDER BY fitcoins_balance DESC LIMIT 20`;
    } catch (error) {
      console.error('UsersService.getLeaderboard error:', error);
      throw error;
    }
  }
}
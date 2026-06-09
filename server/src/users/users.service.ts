import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(excludeUserId?: string) {
    try {
      const result = await this.prisma.$queryRawUnsafe(
        `SELECT id, name, avatar_url, city FROM profiles LIMIT 30`
      );
      return result;
    } catch (error) {
      console.error('UsersService.findAll error:', error);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      const result = await this.prisma.$queryRawUnsafe(
        `SELECT id, name, avatar_url, fitcoins_balance FROM profiles WHERE fitcoins_balance IS NOT NULL ORDER BY fitcoins_balance DESC LIMIT 20`
      );
      return result;
    } catch (error) {
      console.error('UsersService.getLeaderboard error:', error);
      throw error;
    }
  }
}
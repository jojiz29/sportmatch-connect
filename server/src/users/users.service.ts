import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(excludeUserId?: string) {
    try {
      const where = excludeUserId ? { id: { not: excludeUserId } } : {};
      const result = await this.prisma.profiles.findMany({
        where,
        take: 30,
      });
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      console.error('Error name:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      const result = await this.prisma.profiles.findMany({
        take: 20,
      });
      return result;
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      console.error('Error name:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      throw error;
    }
  }
}
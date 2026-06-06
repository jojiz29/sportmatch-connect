import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.profiles.findMany({
        take: 30,
      });
    } catch (error) {
      console.error('ProfilesService.findAll error:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const profile = await this.prisma.profiles.findUnique({
        where: { id },
      });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      return profile;
    } catch (error) {
      console.error('ProfilesService.findOne error:', error);
      throw error;
    }
  }

  async update(id: string, data: { name?: string; bio?: string; city?: string; age?: number; gender?: string }) {
    try {
      return await this.prisma.profiles.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('ProfilesService.update error:', error);
      throw error;
    }
  }
}
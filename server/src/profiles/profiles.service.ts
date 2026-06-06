import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.profiles.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            created_matches: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: { id },
      include: {
        posts: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
        created_matches: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
        followers: true,
        following: true,
        _count: {
          select: {
            posts: true,
            created_matches: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async update(id: string, data: { name?: string; bio?: string; city?: string; age?: number; gender?: string }) {
    return this.prisma.profiles.update({
      where: { id },
      data,
    });
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtDto, UpdateCourtDto } from './dto';

@Injectable()
export class CourtsService {
  constructor(private prisma: PrismaService) {}

  async findAll(sport?: string, district?: string) {
    const where: { sport?: string; district?: string } = {};
    if (sport) where.sport = sport;
    if (district) where.district = district;

    return this.prisma.courts.findMany({
      where,
      include: {
        reviews: {
          take: 5,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar_url: true },
            },
          },
        },
        _count: {
          select: { reviews: true, matches: true },
        },
      },
      orderBy: [{ is_sponsored: 'desc' }, { rating: 'desc' }],
    });
  }

  async findOne(id: string) {
    const court = await this.prisma.courts.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar_url: true },
            },
          },
        },
        matches: {
          where: { status: 'OPEN' },
          take: 10,
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!court) {
      throw new NotFoundException('Court not found');
    }

    return court;
  }

  async create(data: CreateCourtDto) {
    return this.prisma.courts.create({
      data: {
        ...data,
        is_available: true,
      },
    });
  }

  async update(id: string, data: UpdateCourtDto) {
    const court = await this.prisma.courts.findUnique({ where: { id } });
    if (!court) {
      throw new NotFoundException('Court not found');
    }

    return this.prisma.courts.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const court = await this.prisma.courts.findUnique({ where: { id } });
    if (!court) {
      throw new NotFoundException('Court not found');
    }

    return this.prisma.courts.delete({ where: { id } });
  }

  async createReview(
    courtId: string,
    userId: string,
    data: { rating: number; comment?: string },
  ) {
    const court = await this.prisma.courts.findUnique({ where: { id: courtId } });
    if (!court) {
      throw new NotFoundException('Court not found');
    }

    const review = await this.prisma.reviews.create({
      data: {
        court_id: courtId,
        user_id: userId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar_url: true },
        },
      },
    });

    const allReviews = await this.prisma.reviews.findMany({
      where: { court_id: courtId },
    });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await this.prisma.courts.update({
      where: { id: courtId },
      data: {
        rating: avgRating,
        reviews_count: allReviews.length,
      },
    });

    return review;
  }
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto, UpdateMatchDto } from './dto';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(sport?: string) {
    const where = sport ? { sport } : {};
    return this.prisma.matches.findMany({
      where,
      include: {
        court: true,
        creator: {
          select: { id: true, name: true, avatar_url: true },
        },
        match_participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar_url: true },
            },
          },
        },
        _count: {
          select: { match_participants: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id },
      include: {
        court: true,
        creator: {
          select: { id: true, name: true, avatar_url: true },
        },
        match_participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar_url: true },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  async create(data: CreateMatchDto, creatorId: string) {
    return this.prisma.matches.create({
      data: {
        ...data,
        creator_id: creatorId,
        status: 'OPEN',
      },
      include: {
        court: true,
        creator: {
          select: { id: true, name: true, avatar_url: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateMatchDto, userId: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.creator_id !== userId) {
      throw new ForbiddenException('You can only update your own matches');
    }

    return this.prisma.matches.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.creator_id !== userId) {
      throw new ForbiddenException('You can only delete your own matches');
    }

    return this.prisma.matches.delete({
      where: { id },
    });
  }

  async join(matchId: string, userId: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        match_participants: true,
        _count: { select: { match_participants: true } },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match._count.match_participants >= match.max_players) {
      throw new ForbiddenException('Match is full');
    }

    const existingParticipant = match.match_participants.find(
      (p) => p.user_id === userId,
    );

    if (existingParticipant) {
      throw new ForbiddenException('Already joined this match');
    }

    return this.prisma.match_participants.create({
      data: {
        match_id: matchId,
        user_id: userId,
        status: 'CONFIRMED',
      },
      include: {
        user: {
          select: { id: true, name: true, avatar_url: true },
        },
      },
    });
  }

  async leave(matchId: string, userId: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.creator_id === userId) {
      throw new ForbiddenException('Creator cannot leave the match');
    }

    return this.prisma.match_participants.deleteMany({
      where: {
        match_id: matchId,
        user_id: userId,
      },
    });
  }
}
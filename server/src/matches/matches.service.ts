// ============================================================
// matches.service.ts — Servicio de partidos
// CRUD con validación de propiedad, unirse/salir con raw queries
// ============================================================

import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMatchDto, UpdateMatchDto } from "./dto";

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(sport?: string) {
    try {
      if (sport) {
        return await this.prisma.$queryRawUnsafe(
          `SELECT id, title, sport, date, time, max_players, status, creator_id, court_id FROM matches WHERE sport = $1 LIMIT 50`,
          [sport],
        );
      }
      return await this.prisma.$queryRawUnsafe(
        `SELECT id, title, sport, date, time, max_players, status, creator_id, court_id FROM matches LIMIT 50`,
      );
    } catch (error) {
      console.error("MatchesService.findAll error:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      return match;
    } catch (error) {
      console.error("MatchesService.findOne error:", error);
      throw error;
    }
  }

  async create(data: CreateMatchDto, creatorId: string) {
    try {
      return await this.prisma.matches.create({
        data: {
          ...data,
          creator_id: creatorId,
          status: "OPEN",
        },
      });
    } catch (error) {
      console.error("MatchesService.create error:", error);
      throw error;
    }
  }

  async update(id: string, data: UpdateMatchDto, userId: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      if (match.creator_id !== userId) {
        throw new ForbiddenException("You can only update your own matches");
      }

      return await this.prisma.matches.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error("MatchesService.update error:", error);
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      if (match.creator_id !== userId) {
        throw new ForbiddenException("You can only delete your own matches");
      }

      return await this.prisma.matches.delete({
        where: { id },
      });
    } catch (error) {
      console.error("MatchesService.delete error:", error);
      throw error;
    }
  }

  async join(matchId: string, userId: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      return await this.prisma.match_participants.create({
        data: {
          match_id: matchId,
          user_id: userId,
          status: "CONFIRMED",
        },
      });
    } catch (error) {
      console.error("MatchesService.join error:", error);
      throw error;
    }
  }

  async leave(matchId: string, userId: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      if (match.creator_id === userId) {
        throw new ForbiddenException("Creator cannot leave the match");
      }

      return await this.prisma.match_participants.deleteMany({
        where: {
          match_id: matchId,
          user_id: userId,
        },
      });
    } catch (error) {
      console.error("MatchesService.leave error:", error);
      throw error;
    }
  }
}

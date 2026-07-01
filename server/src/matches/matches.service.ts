// ============================================================
// matches.service.ts — Servicio de partidos
// CRUD con validación de propiedad, unirse/salir con raw queries
// ============================================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMatchDto, UpdateMatchDto } from "./dto";

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sport?: string) {
    try {
      const matches = await this.prisma.matches.findMany({
        where: sport ? { sport } : undefined,
        include: {
          court: true,
          creator: true,
          match_participants: {
            include: {
              user: true,
            },
          },
        },
        take: 50,
      });

      // Mapear match_participants a current_players
      return matches.map((m) => {
        const players = m.match_participants ? m.match_participants.map((p) => p.user) : [];

        // Incluir también al creador en la lista de jugadores si no está ya
        if (m.creator && !players.some((p) => p.id === m.creator.id)) {
          players.unshift(m.creator);
        }

        return {
          ...m,
          current_players: players,
        };
      });
    } catch (error) {
      console.error("MatchesService.findAll error:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id },
        include: {
          court: true,
          creator: true,
          match_participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      const players = match.match_participants ? match.match_participants.map((p) => p.user) : [];
      if (match.creator && !players.some((p) => p.id === match.creator.id)) {
        players.unshift(match.creator);
      }

      return {
        ...match,
        current_players: players,
      };
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
          // El schema actual guarda date/time como texto estable.
          date: data.date,
          time: data.time,
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
        data: {
          ...data,
          // Mantener string evita errores de conversión cuando Supabase serializa DATE/TIME.
          date: data.date,
          time: data.time,
        },
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
        include: {
          match_participants: true,
        },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      // El creador no necesita unirse como participante adicional
      if (match.creator_id === userId) {
        throw new ConflictException("Eres el creador de este partido. Ya formas parte de él.");
      }

      // Verificar si ya está unido
      const existing = await this.prisma.match_participants.findUnique({
        where: {
          match_id_user_id: {
            match_id: matchId,
            user_id: userId,
          },
        },
      });

      if (existing) {
        throw new ConflictException("Ya estás inscrito en este partido.");
      }

      // Verificar capacidad: contar participantes actuales
      const currentParticipants = match.match_participants.length;
      // El creador cuenta como participante aunque no esté en match_participants
      const totalPlayers = currentParticipants + 1; // +1 por el creador
      if (totalPlayers >= match.max_players) {
        throw new BadRequestException(
          `El partido está completo (${totalPlayers}/${match.max_players} jugadores).`,
        );
      }

      const participant = await this.prisma.match_participants.create({
        data: {
          match_id: matchId,
          user_id: userId,
          status: "CONFIRMED",
        },
      });

      // Si después de unirse se llena, actualizar estado del partido
      if (totalPlayers + 1 >= match.max_players) {
        await this.prisma.matches.update({
          where: { id: matchId },
          data: { status: "FULL" },
        });
      }

      return participant;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error("MatchesService.join error:", error);
      throw error;
    }
  }

  async findRecommended(userId: string, sport?: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      // Obtener IDs de partidos donde el usuario ya es participante
      const userParticipations = await this.prisma.match_participants.findMany({
        where: { user_id: userId },
        select: { match_id: true },
      });
      const joinedMatchIds = userParticipations.map((p) => p.match_id);

      const matches = await this.prisma.matches.findMany({
        where: {
          status: "OPEN",
          creator_id: { not: userId },
          id: { notIn: joinedMatchIds },
          date: { gte: todayStr },
          ...(sport ? { sport } : {}),
        },
        include: {
          court: true,
          creator: true,
          match_participants: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { date: "asc" },
        take: 50,
      });

      return matches.map((m) => {
        const players = m.match_participants ? m.match_participants.map((p) => p.user) : [];
        if (m.creator && !players.some((p) => p.id === m.creator.id)) {
          players.unshift(m.creator);
        }

        return {
          ...m,
          current_players: players,
        };
      });
    } catch (error) {
      console.error("MatchesService.findRecommended error:", error);
      throw error;
    }
  }

  async leave(matchId: string, userId: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id: matchId },
        include: {
          match_participants: true,
        },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      if (match.creator_id === userId) {
        throw new ForbiddenException("Creator cannot leave the match");
      }

      const result = await this.prisma.match_participants.deleteMany({
        where: {
          match_id: matchId,
          user_id: userId,
        },
      });

      // Si el partido estaba lleno y alguien se va, reabrir
      if (match.status === "FULL" && result.count > 0) {
        await this.prisma.matches.update({
          where: { id: matchId },
          data: { status: "OPEN" },
        });
      }

      return result;
    } catch (error) {
      console.error("MatchesService.leave error:", error);
      throw error;
    }
  }
}

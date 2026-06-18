// ============================================================
// matches.service.ts — Servicio de partidos
// CRUD con validación de propiedad, unirse/salir con raw queries
// ============================================================

import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
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
          // La API recibe texto desde el formulario, pero la BD real guarda date/time tipados.
          date: this.toDatabaseDate(data.date),
          time: this.toDatabaseTime(data.time),
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
          // Convertimos solo cuando el usuario envia cambios de fecha u hora.
          date: data.date ? this.toDatabaseDate(data.date) : undefined,
          time: data.time ? this.toDatabaseTime(data.time) : undefined,
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
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      // Evitar error de clave duplicada si ya se encuentra unido
      const existing = await this.prisma.match_participants.findUnique({
        where: {
          match_id_user_id: {
            match_id: matchId,
            user_id: userId,
          },
        },
      });

      if (existing) {
        return existing;
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

  /**
   * PostgreSQL guarda matches.date como DATE. Usamos mediodia UTC para evitar
   * cambios de dia por zona horaria al serializar el Date en Node.
   */
  private toDatabaseDate(value: string): Date {
    return new Date(`${value}T12:00:00.000Z`);
  }

  /**
   * PostgreSQL guarda matches.time como TIME. Prisma lo representa como Date,
   * por eso fijamos una fecha neutra y conservamos solo hora/minuto/segundo.
   */
  private toDatabaseTime(value: string): Date {
    const normalized = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${normalized}.000Z`);
  }
}

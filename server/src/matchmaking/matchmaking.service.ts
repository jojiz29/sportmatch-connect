// ============================================================
// server/src/matchmaking/matchmaking.service.ts — Lógica de negocio
// Sprint V2.3 — Matchmaking & Elo System
// ============================================================
// Orquesta:
//   1. Cola de matchmaking (enter/leave/find) → RPCs SQL
//   2. Swipes (record, mutual_like detection) → tabla swipes + RPC
//   3. Resultados de partidos (report result + Elo) → RPC
//   4. Leaderboards + Elo por deporte → consultas Prisma + RPCs
// ============================================================

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  EnterQueueDto,
  SwipeDto,
  ReportResultDto,
  QueueEntryResponse,
  SwipeResponse,
  MatchResultResponse,
  FindMatchResponse,
  EloRatingResponse,
  LeaderboardEntry,
} from "./dto/matchmaking.dto";

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==============================================================
  // ENTER QUEUE
  // ==============================================================
  async enterQueue(userId: string, dto: EnterQueueDto): Promise<QueueEntryResponse> {
    if (dto.lat < -90 || dto.lat > 90) {
      throw new BadRequestException("Latitud inválida (debe estar entre -90 y 90)");
    }
    if (dto.lng < -180 || dto.lng > 180) {
      throw new BadRequestException("Longitud inválida (debe estar entre -180 y 180)");
    }

    try {
      const results = await this.prisma.$queryRawUnsafe<QueueEntryResponse[]>(
        `SELECT * FROM public.enter_queue($1::uuid, $2::text, $3::double precision, $4::double precision, $5::double precision)`,
        userId,
        dto.sport,
        dto.lat,
        dto.lng,
        dto.radius_km ?? 10.0,
      );

      const entry = results[0];
      if (entry) {
        return {
          user_id: entry.user_id,
          sport: entry.sport,
          status: entry.status,
          radius_km: entry.radius_km,
          entered_at: entry.entered_at,
        };
      }

      throw new InternalServerErrorException("Error al entrar en la cola");
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg.includes("Invalid latitude") || msg.includes("Invalid longitude")) {
        throw new BadRequestException(msg);
      }
      this.logger.error(`enterQueue failed for ${userId}: ${msg}`);
      throw new InternalServerErrorException("Error al entrar en la cola de matchmaking");
    }
  }

  // ==============================================================
  // LEAVE QUEUE
  // ==============================================================
  async leaveQueue(
    userId: string,
    sport: string,
  ): Promise<{ user_id: string; sport: string; status: string }> {
    try {
      const results = await this.prisma.$queryRawUnsafe<
        Array<{ user_id: string; sport: string; status: string }>
      >(`SELECT * FROM public.leave_queue($1::uuid, $2::text)`, userId, sport);
      return results[0] ?? { user_id: userId, sport, status: "NOT_IN_QUEUE" };
    } catch (err) {
      this.logger.error(`leaveQueue failed for ${userId}: ${(err as Error).message}`);
      throw new InternalServerErrorException("Error al salir de la cola");
    }
  }

  // ==============================================================
  // GET QUEUE STATUS
  // ==============================================================
  async getQueueStatus(userId: string, sport: string): Promise<QueueEntryResponse | null> {
    const results = await this.prisma.$queryRawUnsafe<QueueEntryResponse[]>(
      `SELECT user_id, sport, status, radius_km, created_at AS entered_at, matched_with, matched_at
       FROM public.matchmaking_queue
       WHERE user_id = $1::uuid AND sport = $2::text
       LIMIT 1`,
      userId,
      sport,
    );
    return results[0] ?? null;
  }

  // ==============================================================
  // FIND MATCH
  // ==============================================================
  async findMatch(userId: string, sport: string): Promise<FindMatchResponse> {
    try {
      const results = await this.prisma.$queryRawUnsafe<FindMatchResponse[]>(
        `SELECT * FROM public.find_match($1::uuid, $2::text)`,
        userId,
        sport,
      );
      return results[0] ?? { matched: false, reason: "error" };
    } catch (err) {
      this.logger.error(`findMatch failed for ${userId}: ${(err as Error).message}`);
      return { matched: false, reason: "error" };
    }
  }

  // ==============================================================
  // RECORD SWIPE
  // ==============================================================
  // Si mutual_like === true, crea automáticamente una conversación
  // directa llamando a la RPC create_direct_conversation.
  // ==============================================================
  async recordSwipe(actorId: string, dto: SwipeDto): Promise<SwipeResponse> {
    if (actorId === dto.target_id) {
      throw new BadRequestException("No puedes hacer swipe sobre ti mismo");
    }

    try {
      const results = await this.prisma.$queryRawUnsafe<SwipeResponse[]>(
        `SELECT * FROM public.record_swipe($1::uuid, $2::uuid, $3::text, $4::text)`,
        actorId,
        dto.target_id,
        dto.action,
        dto.sport,
      );
      const result = results[0];

      if (!result) {
        throw new InternalServerErrorException("Error al registrar swipe");
      }

      return {
        mutual_like: result.mutual_like ?? false,
        action: dto.action,
        conversation_id: result.conversation_id ?? null,
      };
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg.includes("Cannot swipe yourself")) {
        throw new BadRequestException(msg);
      }
      this.logger.error(`recordSwipe failed for ${actorId}: ${msg}`);
      throw new InternalServerErrorException("Error al registrar swipe");
    }
  }

  // ==============================================================
  // REPORT MATCH RESULT
  // ==============================================================
  async reportResult(userId: string, dto: ReportResultDto): Promise<MatchResultResponse> {
    try {
      const results = await this.prisma.$queryRawUnsafe<MatchResultResponse[]>(
        `SELECT * FROM public.record_match_result($1::uuid, $2::uuid, $3::integer, $4::integer)`,
        dto.match_id,
        dto.winner_id,
        dto.score_home ?? null,
        dto.score_away ?? null,
      );
      const result = results[0];

      if (!result) {
        throw new InternalServerErrorException("Error al registrar resultado");
      }

      return {
        match_id: result.match_id,
        winner_id: result.winner_id,
        status: result.status,
        score_home: result.score_home,
        score_away: result.score_away,
        elo_results: result.elo_results,
      };
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (
        msg.includes("not found") ||
        msg.includes("not OPEN") ||
        msg.includes("not a participant") ||
        msg.includes("already has a winner")
      ) {
        throw new BadRequestException(msg);
      }
      this.logger.error(`reportResult failed: ${msg}`);
      throw new InternalServerErrorException("Error al registrar resultado del partido");
    }
  }

  // ==============================================================
  // GET ELO RATING
  // ==============================================================
  async getElo(userId: string, sport: string): Promise<EloRatingResponse | null> {
    const results = await this.prisma.$queryRawUnsafe<EloRatingResponse[]>(
      `SELECT user_id, sport, elo_rating, matches_played, wins, losses, last_match_at
       FROM public.player_ratings
       WHERE user_id = $1::uuid AND sport = $2::text
       LIMIT 1`,
      userId,
      sport,
    );
    return results[0] ?? null;
  }

  // ==============================================================
  // GET LEADERBOARD
  // ==============================================================
  async getLeaderboard(sport: string, limit = 50): Promise<LeaderboardEntry[]> {
    try {
      const results = await this.prisma.$queryRawUnsafe<
        Array<LeaderboardEntry & { name: string | null; avatar_url: string | null }>
      >(
        `SELECT
           pr.user_id,
           pr.sport,
           p.name,
           p.avatar_url,
           pr.elo_rating,
           pr.matches_played,
           pr.wins,
           pr.losses,
           ROW_NUMBER() OVER (ORDER BY pr.elo_rating DESC)::integer AS rank
         FROM public.player_ratings pr
         LEFT JOIN public.profiles p ON p.id = pr.user_id
         WHERE pr.sport = $1::text
           AND pr.matches_played > 0
         ORDER BY pr.elo_rating DESC
         LIMIT $2::integer`,
        sport,
        limit,
      );
      return results;
    } catch (err) {
      this.logger.error(`getLeaderboard failed: ${(err as Error).message}`);
      return [];
    }
  }

  // ==============================================================
  // GET ALL USER ELO RATINGS (for profile display)
  // ==============================================================
  async getAllElo(userId: string): Promise<EloRatingResponse[]> {
    const results = await this.prisma.$queryRawUnsafe<EloRatingResponse[]>(
      `SELECT user_id, sport, elo_rating, matches_played, wins, losses, last_match_at
       FROM public.player_ratings
       WHERE user_id = $1::uuid
       ORDER BY elo_rating DESC`,
      userId,
    );
    return results;
  }
}

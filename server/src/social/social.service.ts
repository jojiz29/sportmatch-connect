// ============================================================
// server/src/social/social.service.ts — Servicio SocialGraph
// Sprint V2.1 — Social Graph & Followers
// ============================================================
// Operaciones: follow / unfollow / followers / following / stats /
// suggestions (discover). Usa PrismaService para tablas en el
// schema Prisma + $queryRawUnsafe para RPCs SQL nativas.
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
  FollowStatsResponse,
  FollowSuggestionsResponse,
  FollowUserResponse,
} from "./dto/social.dto";

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==============================================================
  // FOLLOW
  // ==============================================================
  async follow(followerId: string, followingId: string): Promise<FollowUserResponse> {
    if (!followerId || !followingId) {
      throw new BadRequestException("followerId y followingId son obligatorios");
    }
    if (followerId === followingId) {
      throw new BadRequestException("No puedes seguirte a ti mismo");
    }

    // Verificar que el usuario a seguir existe
    const target = await this.prisma.profiles.findUnique({
      where: { id: followingId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException("El usuario que intentas seguir no existe");
    }

    try {
      const follow = await this.prisma.followers.create({
        data: {
          follower_id: followerId,
          following_id: followingId,
        },
      });
      this.logger.log(`User ${followerId} followed ${followingId}`);
      return follow;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        throw new BadRequestException("Ya sigues a este usuario");
      }
      this.logger.error(`Failed to follow: ${(err as Error).message}`);
      throw new InternalServerErrorException("Error al seguir al usuario");
    }
  }

  // ==============================================================
  // UNFOLLOW
  // ==============================================================
  async unfollow(followerId: string, followingId: string): Promise<void> {
    if (!followerId || !followingId) {
      throw new BadRequestException("followerId y followingId son obligatorios");
    }

    try {
      await this.prisma.followers.delete({
        where: {
          follower_id_following_id: {
            follower_id: followerId,
            following_id: followingId,
          },
        },
      });
      this.logger.log(`User ${followerId} unfollowed ${followingId}`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "P2025") {
        throw new BadRequestException("No sigues a este usuario");
      }
      this.logger.error(`Failed to unfollow: ${(err as Error).message}`);
      throw new InternalServerErrorException("Error al dejar de seguir al usuario");
    }
  }

  // ==============================================================
  // GET FOLLOWERS (lista paginada)
  // ==============================================================
  async getFollowers(userId: string, page = 1, limit = 20) {
    if (!userId) throw new BadRequestException("userId es obligatorio");
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.followers.findMany({
        where: { following_id: userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              bio: true,
              preferred_sports: true,
              trust_score: true,
              city: true,
              matches_played: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.followers.count({
        where: { following_id: userId },
      }),
    ]);

    return {
      items: items.map((f) => f.follower),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==============================================================
  // GET FOLLOWING (lista paginada)
  // ==============================================================
  async getFollowing(userId: string, page = 1, limit = 20) {
    if (!userId) throw new BadRequestException("userId es obligatorio");
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.followers.findMany({
        where: { follower_id: userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              bio: true,
              preferred_sports: true,
              trust_score: true,
              city: true,
              matches_played: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.followers.count({
        where: { follower_id: userId },
      }),
    ]);

    return {
      items: items.map((f) => f.following),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==============================================================
  // GET FOLLOW STATS
  // ==============================================================
  async getFollowStats(userId: string): Promise<FollowStatsResponse> {
    if (!userId) throw new BadRequestException("userId es obligatorio");

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.followers.count({ where: { following_id: userId } }),
      this.prisma.followers.count({ where: { follower_id: userId } }),
    ]);

    return {
      followers_count: followersCount,
      following_count: followingCount,
    };
  }

  // ==============================================================
  // GET SUGGESTIONS (discover — usuarios que quizás conozcas)
  // ==============================================================
  // Usa la RPC SQL nativa get_follow_suggestions para cruzar
  // deportes preferidos y devolver coincidencias priorizadas.
  // ==============================================================
  async getSuggestions(
    userId: string,
    limit = 10,
    sport?: string,
  ): Promise<FollowSuggestionsResponse[]> {
    if (!userId) throw new BadRequestException("userId es obligatorio");

    try {
      const results = await this.prisma.$queryRawUnsafe<FollowSuggestionsResponse[]>(
        `SELECT * FROM public.get_follow_suggestions($1::uuid, $2::integer, $3::text)`,
        userId,
        limit,
        sport ?? null,
      );
      return results;
    } catch (err) {
      this.logger.error(
        `get_follow_suggestions RPC failed for user ${userId}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  // ==============================================================
  // IS FOLLOWING (check)
  // ==============================================================
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (!followerId || !followingId) return false;

    const count = await this.prisma.followers.count({
      where: {
        follower_id: followerId,
        following_id: followingId,
      },
    });
    return count > 0;
  }
}

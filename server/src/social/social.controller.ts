// ============================================================
// server/src/social/social.controller.ts — Endpoints Social Graph
// Sprint V2.1 — Social Graph & Followers
// ============================================================
// Rutas públicas:
//   GET  /social/followers/:userId  → lista de seguidores
//   GET  /social/following/:userId  → lista de seguidos
//   GET  /social/follow/stats/:userId → conteos
// Rutas autenticadas (SupabaseAuthGuard):
//   GET  /social/is-following/:userId → check boolean
//   GET  /social/suggestions        → discover (contextual)
//   POST /social/follow/:userId     → seguir
//   DELETE /social/follow/:userId    → dejar de seguir
// ============================================================

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { SocialService } from "./social.service";
import { PaginationQueryDto, SuggestionsQueryDto } from "./dto/social.dto";

@ApiTags("Social")
@Controller("social")
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ==============================================================
  // GET /social/followers/:userId — PÚBLICO
  // ==============================================================
  @Get("followers/:userId")
  @ApiOperation({ summary: "Lista paginada de seguidores (público)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getFollowers(@Param("userId") userId: string, @Query() query: PaginationQueryDto) {
    return this.socialService.getFollowers(userId, query.page, query.limit);
  }

  // ==============================================================
  // GET /social/following/:userId — PÚBLICO
  // ==============================================================
  @Get("following/:userId")
  @ApiOperation({ summary: "Lista paginada de seguidos (público)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getFollowing(@Param("userId") userId: string, @Query() query: PaginationQueryDto) {
    return this.socialService.getFollowing(userId, query.page, query.limit);
  }

  // ==============================================================
  // GET /social/follow/stats/:userId — PÚBLICO
  // ==============================================================
  @Get("follow/stats/:userId")
  @ApiOperation({ summary: "Conteo seguidores/seguidos (público)" })
  async getFollowStats(@Param("userId") userId: string) {
    return this.socialService.getFollowStats(userId);
  }

  // ==============================================================
  // GET /social/is-following/:userId — AUTENTICADO
  // ==============================================================
  @Get("is-following/:userId")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verificar si el usuario actual sigue a otro" })
  async isFollowing(
    @Param("userId") followingId: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.socialService.isFollowing(req.user.userId, followingId);
    return { following: result };
  }

  // ==============================================================
  // POST /social/follow/:userId — AUTENTICADO
  // ==============================================================
  @Post("follow/:userId")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Seguir a un usuario" })
  @HttpCode(HttpStatus.CREATED)
  async follow(@Param("userId") followingId: string, @Request() req: { user: { userId: string } }) {
    return this.socialService.follow(req.user.userId, followingId);
  }

  // ==============================================================
  // DELETE /social/follow/:userId — AUTENTICADO
  // ==============================================================
  @Delete("follow/:userId")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Dejar de seguir a un usuario" })
  @HttpCode(HttpStatus.NO_CONTENT)
  unfollow(@Param("userId") followingId: string, @Request() req: { user: { userId: string } }) {
    return this.socialService.unfollow(req.user.userId, followingId);
  }

  // ==============================================================
  // GET /social/suggestions — AUTENTICADO
  // ==============================================================
  @Get("suggestions")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sugerencias de usuarios — Discover (contextual)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sport", required: false, type: String })
  async getSuggestions(
    @Request() req: { user: { userId: string } },
    @Query() query: SuggestionsQueryDto,
  ) {
    return this.socialService.getSuggestions(req.user.userId, query.limit || 10, query.sport);
  }
}

// ============================================================
// server/src/matchmaking/matchmaking.controller.ts — Endpoints REST
// Sprint V2.3 — Matchmaking & Elo System
// ============================================================
// Rutas públicas:
//   GET  /matchmaking/leaderboard/:sport → top 50 Elo por deporte
// Rutas autenticadas (SupabaseAuthGuard):
//   POST   /matchmaking/queue/enter     → entrar a cola
//   DELETE /matchmaking/queue/leave/:sport → salir de cola
//   GET    /matchmaking/queue/status/:sport → estado en cola
//   POST   /matchmaking/queue/find/:sport → buscar partido
//   POST   /matchmaking/swipe          → registrar swipe
//   POST   /matchmaking/result         → reportar resultado
//   GET    /matchmaking/elo/:sport     → mi Elo en deporte
//   GET    /matchmaking/elo           → todos mis ratings
// ============================================================

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { MatchmakingService } from "./matchmaking.service";
import {
  EnterQueueDto,
  SwipeDto,
  ReportResultDto,
} from "./dto/matchmaking.dto";

@ApiTags("Matchmaking")
@Controller("matchmaking")
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  // ==============================================================
  // QUEUE — ENTER
  // ==============================================================
  @Post("queue/enter")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Entrar a la cola de matchmaking para un deporte" })
  @HttpCode(HttpStatus.CREATED)
  async enterQueue(
    @Body() dto: EnterQueueDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchmakingService.enterQueue(req.user.userId, dto);
  }

  // ==============================================================
  // QUEUE — LEAVE
  // ==============================================================
  @Delete("queue/leave/:sport")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Salir de la cola de matchmaking para un deporte" })
  async leaveQueue(
    @Param("sport") sport: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchmakingService.leaveQueue(req.user.userId, sport);
  }

  // ==============================================================
  // QUEUE — STATUS
  // ==============================================================
  @Get("queue/status/:sport")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Consultar estado actual en la cola" })
  async getQueueStatus(
    @Param("sport") sport: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchmakingService.getQueueStatus(req.user.userId, sport);
  }

  // ==============================================================
  // QUEUE — FIND MATCH
  // ==============================================================
  @Post("queue/find/:sport")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buscar partido en la cola (debe estar WAITING)" })
  @HttpCode(HttpStatus.OK)
  async findMatch(
    @Param("sport") sport: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchmakingService.findMatch(req.user.userId, sport);
  }

  // ==============================================================
  // SWIPE
  // ==============================================================
  @Post("swipe")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Registrar swipe (LIKE/PASS) y detectar mutual_like" })
  @HttpCode(HttpStatus.CREATED)
  async recordSwipe(
    @Body() dto: SwipeDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchmakingService.recordSwipe(req.user.userId, dto);
  }

  // ==============================================================
  // MATCH RESULT
  // ==============================================================
  @Post("result")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reportar resultado de partido (dispara Elo update)" })
  async reportResult(
    @Body() dto: ReportResultDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchmakingService.reportResult(req.user.userId, dto);
  }

  // ==============================================================
  // ELO — Por deporte (autenticado)
  // ==============================================================
  @Get("elo/:sport")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener mi rating Elo para un deporte" })
  async getElo(
    @Param("sport") sport: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchmakingService.getElo(req.user.userId, sport);
  }

  // ==============================================================
  // ELO — Todos mis ratings (autenticado)
  // ==============================================================
  @Get("elo")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener todos mis ratings Elo" })
  async getAllElo(@Request() req: { user: { userId: string } }) {
    return this.matchmakingService.getAllElo(req.user.userId);
  }

  // ==============================================================
  // LEADERBOARD — Público
  // ==============================================================
  @Get("leaderboard/:sport")
  @ApiOperation({ summary: "Top 50 jugadores por Elo en un deporte (público)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getLeaderboard(
    @Param("sport") sport: string,
    @Query("limit") limit?: number,
  ) {
    return this.matchmakingService.getLeaderboard(sport, limit || 50);
  }
}

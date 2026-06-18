import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import {
  CreateEngagementEventDto,
  SaveEngagementAchievementDto,
  SaveEngagementChallengeDto,
  SaveEngagementContentDto,
  SaveSmartNotificationDto,
} from "./dto";
import { EngagementService } from "./engagement.service";

interface AuthenticatedRequest {
  user: { userId: string };
}

@ApiTags("Engagement AI")
@Controller("engagement")
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post("events")
  @ApiOperation({ summary: "Registra una señal privada para personalización" })
  recordEvent(@Request() req: AuthenticatedRequest, @Body() dto: CreateEngagementEventDto) {
    return this.engagementService.recordEvent(req.user.userId, dto);
  }

  @Get("profile")
  @ApiOperation({ summary: "Obtiene el perfil estructurado previo a embeddings" })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.engagementService.getProfile(req.user.userId);
  }

  @Get("analytics")
  @ApiOperation({ summary: "Obtiene metricas privadas del motor de engagement" })
  getAnalytics(@Request() req: AuthenticatedRequest) {
    return this.engagementService.getAnalytics(req.user.userId);
  }

  @Get("diagnostics")
  @ApiOperation({ summary: "Verifica el estado operativo del modulo Engagement AI" })
  getDiagnostics(@Request() req: AuthenticatedRequest) {
    return this.engagementService.getDiagnostics(req.user.userId);
  }

  @Get("recommendations/today")
  @ApiOperation({ summary: "Obtiene o crea el paquete diario de recomendaciones" })
  getTodayRecommendations(@Request() req: AuthenticatedRequest): Promise<unknown> {
    return this.engagementService.getTodayRecommendationSnapshot(req.user.userId);
  }

  @Post("embedding/rebuild")
  @ApiOperation({ summary: "Reconstruye la huella vectorial privada de engagement" })
  rebuildEmbedding(@Request() req: AuthenticatedRequest) {
    return this.engagementService.rebuildEngagementEmbedding(req.user.userId);
  }

  @Post("smart-notification")
  @ApiOperation({ summary: "Guarda una notificacion inteligente generada por recomendaciones" })
  saveSmartNotification(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SaveSmartNotificationDto,
  ) {
    return this.engagementService.saveSmartNotification(req.user.userId, dto);
  }

  @Post("challenges")
  @ApiOperation({ summary: "Guarda un reto diario sugerido por recomendaciones" })
  saveChallenge(@Request() req: AuthenticatedRequest, @Body() dto: SaveEngagementChallengeDto) {
    return this.engagementService.saveChallenge(req.user.userId, dto);
  }

  @Get("challenges")
  @ApiOperation({ summary: "Lista los retos de engagement del usuario" })
  listChallenges(@Request() req: AuthenticatedRequest) {
    return this.engagementService.listChallenges(req.user.userId);
  }

  @Post("challenges/:challengeId/complete")
  @ApiOperation({ summary: "Marca como completado un reto de engagement" })
  completeChallenge(
    @Request() req: AuthenticatedRequest,
    @Param("challengeId") challengeId: string,
  ) {
    return this.engagementService.completeChallenge(req.user.userId, challengeId);
  }

  @Post("achievements")
  @ApiOperation({ summary: "Guarda un logro sugerido por recomendaciones" })
  saveAchievement(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SaveEngagementAchievementDto,
  ) {
    return this.engagementService.saveAchievement(req.user.userId, dto);
  }

  @Get("achievements")
  @ApiOperation({ summary: "Lista los logros de engagement del usuario" })
  listAchievements(@Request() req: AuthenticatedRequest) {
    return this.engagementService.listAchievements(req.user.userId);
  }

  @Post("achievements/evaluate")
  @ApiOperation({ summary: "Evalua y desbloquea logros guardados con actividad real" })
  evaluateAchievements(@Request() req: AuthenticatedRequest) {
    return this.engagementService.evaluateAchievements(req.user.userId);
  }

  @Post("contents")
  @ApiOperation({ summary: "Guarda contenido personalizado generado por recomendaciones" })
  saveContent(@Request() req: AuthenticatedRequest, @Body() dto: SaveEngagementContentDto) {
    return this.engagementService.saveContent(req.user.userId, dto);
  }

  @Get("contents")
  @ApiOperation({ summary: "Lista contenidos personalizados guardados" })
  listContents(@Request() req: AuthenticatedRequest) {
    return this.engagementService.listContents(req.user.userId);
  }
}

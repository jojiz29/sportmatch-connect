// ============================================================
// ai.controller.ts — Endpoints REST
// POST /api/v1/ai/chat                → Chat general
// POST /api/v1/ai/chat/welcome        → SCRUM-345 primer mensaje del LLM
// POST /api/v1/ai/text/comment-suggestion  → Feature #2 Smart Comments
// POST /api/v1/ai/text/hashtags      → Feature #3 Auto-Hashtags
// POST /api/v1/ai/text/moderate      → Feature #6 Content Moderation
// Todos protegidos por SupabaseAuthGuard
// ============================================================

import { Body, Controller, Post, Request, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { AiService } from "./ai.service";
import { ChatRequestDto, ChatResponseDto, WelcomeRequestDto } from "./dto/chat.dto";
import {
  CommentSuggestionDto,
  HashtagsDto,
  ModerateTextDto,
  ModerationResultDto,
  CoachRecommendationDto,
  ModerateAdvancedDto,
  ModerateAdvancedResultDto,
  CoachChatDto,
  RecommendSnackDto,
} from "./dto/ai.dto";


interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    [key: string]: unknown;
  };
}

@ApiTags("AI Assistant")
@Controller("ai")
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("chat")
  @ApiOperation({
    summary: "Chat general con el asistente deportivo IA (Sporty)",
  })
  async chat(
    @Body() dto: ChatRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ChatResponseDto> {
    const userId = req.user.sub;
    return this.aiService.chat(userId, dto.message, dto.history, dto.language);
  }

  @Post("chat/welcome")
  @ApiOperation({
    summary:
      "SCRUM-345 — Genera el primer mensaje de bienvenida dinámicamente con Vertex AI (no hardcoded)",
  })
  async welcome(
    @Body() dto: WelcomeRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ChatResponseDto> {
    const userId = req.user.sub;
    return this.aiService.welcome(userId, dto.language ?? "es");
  }

  @Post("coach/recommend")
  @ApiOperation({
    summary: "Sporty Coach — Recomienda canchas según preferencias del usuario",
  })
  async recommend(
    @Body() dto: CoachRecommendationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ChatResponseDto> {
    const userId = req.user.sub;
    return this.aiService.recommendCourts(userId, dto, dto.language);
  }

  @Post("text/comment-suggestion")
  @ApiOperation({
    summary: "Feature #2 — Genera 3 sugerencias contextuales para un comentario",
  })
  async commentSuggestion(
    @Body() dto: CommentSuggestionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    suggestions: string[];
    metadata: { tokens: number; model: string; latencyMs: number };
  }> {
    const userId = req.user.sub;
    return this.aiService.generateCommentSuggestions(
      userId,
      dto.postContext,
      dto.partialText,
      dto.language,
    );
  }

  @Post("text/hashtags")
  @ApiOperation({
    summary: "Feature #3 — Genera hashtags relevantes para un post (3-5 tags)",
  })
  async hashtags(
    @Body() dto: HashtagsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ tags: string[]; metadata: { tokens: number; model: string; latencyMs: number } }> {
    const userId = req.user.sub;
    return this.aiService.generateHashtags(userId, dto.content, {
      minTags: dto.minTags,
      maxTags: dto.maxTags,
      language: dto.language,
    });
  }

  @Post("text/moderate")
  @ApiOperation({
    summary: "Feature #6 — Modera un texto (toxicity, harassment, sexual, violence)",
  })
  async moderate(
    @Body() dto: ModerateTextDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ModerationResultDto> {
    const userId = req.user.sub;
    return this.aiService.moderateContent(userId, dto.text, dto.context ?? "post");
  }

  @Post("moderate/advanced")
  @ApiOperation({
    summary: "US-SEC-002 — Moderación avanzada con ensemble de modelos (IA, reglas y comportamiento)",
  })
  async moderateAdvanced(
    @Body() dto: ModerateAdvancedDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ModerateAdvancedResultDto> {
    const targetUserId = dto.userId || req.user.sub || (req.user as any).userId;
    return this.aiService.moderateAdvanced(
      targetUserId,
      dto.content,
      dto.contextType,
      dto.metadata,
    );
  }

  @Post("coach/chat")
  @ApiOperation({
    summary: "Premium Coach Chat — Chat 1-a-1 personalizado con telemetría para usuarios Premium",
  })
  async coachChat(
    @Body() dto: CoachChatDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = (req.user?.userId || req.user?.sub) as string;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }
    return this.aiService.coachChat(userId, dto.message, dto.history, dto.language);
  }

  @Post("premium/nutrition")
  @ApiOperation({
    summary: "Premium Nutrition — Recomendador de snacks post-entrenamiento en base a telemetría",
  })
  async recommendSnack(
    @Body() dto: RecommendSnackDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = (req.user?.userId || req.user?.sub) as string;
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }
    return this.aiService.recommendSnack(
      userId,
      dto.sport,
      dto.duration,
      dto.intensity,
      dto.matchId,
      dto.language,
    );
  }
}


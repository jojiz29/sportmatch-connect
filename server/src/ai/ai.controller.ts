// ============================================================
// ai.controller.ts — Endpoints REST
// POST /api/v1/ai/chat                → Chat general
// POST /api/v1/ai/text/comment-suggestion  → Feature #2 Smart Comments
// POST /api/v1/ai/text/hashtags      → Feature #3 Auto-Hashtags
// POST /api/v1/ai/text/moderate      → Feature #6 Content Moderation
// Todos protegidos por SupabaseAuthGuard
// ============================================================

import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { AiService } from "./ai.service";
import { ChatRequestDto, ChatResponseDto } from "./dto/chat.dto";
import {
  CommentSuggestionDto,
  HashtagsDto,
  ModerateTextDto,
  ModerationResultDto,
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
    return this.aiService.chat(userId, dto.message, dto.history);
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
}

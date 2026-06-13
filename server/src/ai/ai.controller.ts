// ============================================================
// ai.controller.ts — Endpoint REST
// POST /api/v1/ai/chat (protegido por SupabaseAuthGuard)
// ============================================================

import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { AiService } from "./ai.service";
import { ChatRequestDto, ChatResponseDto } from "./dto/chat.dto";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string; // userId de Supabase
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
    summary: "Envía un mensaje al asistente deportivo IA (Sporty)",
  })
  async chat(
    @Body() dto: ChatRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ChatResponseDto> {
    const userId = req.user.sub;
    return this.aiService.chat(userId, dto.message);
  }
}

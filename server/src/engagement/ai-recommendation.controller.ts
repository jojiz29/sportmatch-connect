import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { AiRecommendationRequestDto } from "./dto";
import { EngagementService } from "./engagement.service";

interface AuthenticatedRequest {
  user: { userId: string };
}

@ApiTags("AI Recommendations")
@Controller("ai")
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AiRecommendationController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post("recommend")
  @ApiOperation({
    summary: "Genera recomendaciones personalizadas de engagement con Vertex AI",
  })
  recommend(
    @Request() req: AuthenticatedRequest,
    @Body() dto: AiRecommendationRequestDto,
  ): Promise<unknown> {
    return this.engagementService.generateAiRecommendations(req.user.userId, dto);
  }
}

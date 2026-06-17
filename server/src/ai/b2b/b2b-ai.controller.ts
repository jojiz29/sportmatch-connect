// ============================================================
// server/src/ai/b2b/b2b-ai.controller.ts
// Endpoints REST para B2B Intelligence.
// POST /api/v1/ai/b2b/pricing         → Feature #9 Dynamic Pricing
// POST /api/v1/ai/b2b/ads/optimize    → Feature #21 Ads Optimizer
// POST /api/v1/ai/b2b/churn/predict   → Feature #23 Churn Predictor
// Todos protegidos por SupabaseAuthGuard + RolesGuard("BUSINESS")
// ============================================================

import { Body, Controller, Post, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { Roles, RolesGuard } from "../../auth/guards/roles.guard";
import { B2bAiService } from "./b2b-ai.service";
import { PricingRequestDto, PricingResponseDto } from "./dto/pricing.dto";
import { AdsOptimizeRequestDto, AdsOptimizeResponseDto } from "./dto/ads-optimizer.dto";
import { ChurnPredictRequestDto, ChurnPredictResponseDto } from "./dto/churn.dto";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role?: string;
    [key: string]: unknown;
  };
}

@ApiTags("B2B AI")
@Controller("ai/b2b")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles("BUSINESS")
export class B2bAiController {
  constructor(private readonly b2bAiService: B2bAiService) {}

  @Post("pricing")
  @ApiOperation({
    summary: "Feature #9 — Recomienda precio dinámico para una cancha/fecha/hora",
  })
  async pricing(
    @Body() dto: PricingRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PricingResponseDto> {
    const userId = req.user.sub;
    return this.b2bAiService.recommendPricing(userId, dto);
  }

  @Post("ads/optimize")
  @ApiOperation({
    summary:
      "Feature #21 — Genera variantes de un anuncio y recomienda la mejor (UCB1 bandit + LLM)",
  })
  async adsOptimize(
    @Body() dto: AdsOptimizeRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdsOptimizeResponseDto> {
    const userId = req.user.sub;
    return this.b2bAiService.optimizeAds(userId, dto);
  }

  @Post("churn/predict")
  @ApiOperation({
    summary: "Feature #23 — Predice riesgo de churn de un negocio (RFM-lite)",
  })
  async churnPredict(
    @Body() dto: ChurnPredictRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ChurnPredictResponseDto> {
    const userId = req.user.sub;
    return this.b2bAiService.predictChurn(userId, dto);
  }
}

// ============================================================
// server/src/ai/b2b/b2b-ai.controller.ts
// Endpoints REST para B2B Intelligence.
// POST /api/v1/ai/b2b/pricing    → Feature #9 Dynamic Pricing
// (Más endpoints se añadirán en D3-D4: ads/optimize, churn/predict)
// Todos protegidos por SupabaseAuthGuard + RolesGuard("BUSINESS")
// ============================================================

import { Body, Controller, Post, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { Roles, RolesGuard } from "../../auth/guards/roles.guard";
import { B2bAiService } from "./b2b-ai.service";
import { PricingRequestDto, PricingResponseDto } from "./dto/pricing.dto";

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
}

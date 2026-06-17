// ============================================================
// server/src/ai/b2b/b2b-ai.module.ts
// Módulo B2B-AI: contiene pricing + (en D3-D4) ads-optimizer + churn-predictor
// Importa PrismaModule (global) y AuthModule (para guards + SupabaseAuthService).
// El AiCoreModule provee VertexAiService + AiConfigService globalmente
// (ver AGENTS.md → sección NestJS DI), por eso no se importa AiModule aquí.
// ============================================================

import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { B2bAiController } from "./b2b-ai.controller";
import { B2bAiService } from "./b2b-ai.service";
import { DataPipelineService } from "./services/data-pipeline.service";
import { PricingEngineService } from "./services/pricing-engine.service";
import { AdsOptimizerService } from "./services/ads-optimizer.service";
import { ChurnPredictorService } from "./services/churn-predictor.service";
import { ShapExplainerService } from "./services/shap-explainer.service";

@Module({
  imports: [AuthModule],
  controllers: [B2bAiController],
  providers: [
    B2bAiService,
    DataPipelineService,
    PricingEngineService,
    AdsOptimizerService,
    ChurnPredictorService,
    ShapExplainerService,
  ],
  exports: [B2bAiService],
})
export class B2bAiModule {}

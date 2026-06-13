// ============================================================
// ai.module.ts — Empaqueta el módulo de IA
// ============================================================

import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiConfigService } from "./ai-config.service";
import { VertexAiService } from "./vertex-ai.service";

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [AiConfigService, VertexAiService, AiService],
  exports: [AiService],
})
export class AiModule {}

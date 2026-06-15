// ============================================================
// ai.module.ts — Empaqueta el módulo de IA (text + voice)
// ============================================================

import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiConfigService } from "./ai-config.service";
import { VertexAiService } from "./vertex-ai.service";
import { VoiceModule } from "./voice/voice.module";

@Module({
  imports: [AuthModule, VoiceModule],
  controllers: [AiController],
  providers: [AiConfigService, VertexAiService, AiService],
  exports: [AiService, VoiceModule],
})
export class AiModule {}

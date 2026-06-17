// ============================================================
// ai.module.ts — Empaqueta el módulo de IA (text + voice)
// ------------------------------------------------------------
// AiConfigService y VertexAiService ahora viven en AiCoreModule
// (marcado @Global) y están disponibles en TODA la aplicación.
// Solo AiService es provider local de este módulo.
// ============================================================

import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiCoreModule } from "./ai-core.module";
import { VoiceModule } from "./voice/voice.module";
import { VisionModule } from "./vision/vision.module";

@Module({
  imports: [AuthModule, AiCoreModule, VoiceModule, VisionModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService, VoiceModule, VisionModule],
})
export class AiModule {}

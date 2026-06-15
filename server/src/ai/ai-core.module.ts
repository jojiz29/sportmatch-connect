// ============================================================
// server/src/ai/ai-core.module.ts
// ------------------------------------------------------------
// Módulo @Global que provee los servicios compartidos de Vertex AI
// (AiConfigService y VertexAiService) a TODOS los módulos de la app.
//
// Por qué @Global:
// - AiConfigService valida credenciales y expone la configuración de
//   Google Gen AI. Se usa desde AiModule, VoiceModule y potencialmente
//   cualquier módulo futuro que consuma IA (ej. vision, embeddings).
// - VertexAiService es el cliente compartido de @google/genai.
//   VoiceService lo inyecta (con @Optional porque VoiceService
//   tiene su propio cliente STT/TTS) y AiService lo usa directamente.
//
// Sin @Global, los submódulos (VoiceModule) no pueden inyectar
// estos providers sin re-importar el módulo completo o duplicar
// las declaraciones. Esto causaba el error de DI en Render:
//
//   "Nest can't resolve dependencies of the VoiceService
//    (?, VertexAiService). Please make sure that the argument
//    AiConfigService at index [0] is available in the VoiceModule
//    context."
//
// Ver: docs/VERCEL_DEPLOY.md → sección "Lección NestJS DI" para más detalle.
// ============================================================

import { Global, Module } from "@nestjs/common";
import { AiConfigService } from "./ai-config.service";
import { VertexAiService } from "./vertex-ai.service";

@Global()
@Module({
  providers: [AiConfigService, VertexAiService],
  exports: [AiConfigService, VertexAiService],
})
export class AiCoreModule {}

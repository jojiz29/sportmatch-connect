// ============================================================
// server/src/ai/voice/voice.controller.ts — Endpoints STT + TTS
// POST /api/v1/ai/voice/transcribe  → Feature #10
// POST /api/v1/ai/voice/synthesize → Feature #13
// ============================================================

import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { VoiceService } from "./voice.service";

@ApiTags("AI Voice")
@Controller("ai/voice")
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post("transcribe")
  @ApiOperation({ summary: "Feature #10 — Speech-to-Text del audio grabado" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        audio: { type: "string", format: "binary" },
        language: { type: "string", enum: ["es", "en", "pt"] },
      },
    },
  })
  @UseInterceptors(FileInterceptor("audio", { limits: { fileSize: 10 * 1024 * 1024 } }))
  async transcribe(
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined,
    @Body("language") language?: string,
  ): Promise<{ text: string; confianza: number; language: string; latencyMs: number }> {
    if (!file) {
      throw new BadRequestException("No se proporcionó archivo de audio");
    }
    const lang = (language === "pt" || language === "en" ? language : "es") as "es" | "en" | "pt";
    return this.voiceService.transcribe(file.buffer, lang);
  }

  @Post("synthesize")
  @ApiOperation({ summary: "Feature #13 — Text-to-Speech (MP3 base64)" })
  async synthesize(
    @Body() body: { text: string; voice?: string; language?: "es" | "en" | "pt"; speed?: number },
  ): Promise<{ audioBase64: string; format: "mp3"; voice: string; latencyMs: number }> {
    if (!body.text || body.text.trim().length === 0) {
      throw new BadRequestException("El texto no puede estar vacío");
    }
    return this.voiceService.synthesize(body.text.slice(0, 2000), {
      voice: body.voice,
      language: body.language,
      speed: body.speed,
    });
  }
}

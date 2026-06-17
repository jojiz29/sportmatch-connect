// ============================================================
// server/src/ai/voice/voice.service.ts — STT + TTS via Google Cloud
// Feature #10 (STT) + #13 (TTS)
// ============================================================

import { Injectable, Logger, InternalServerErrorException, Optional } from "@nestjs/common";
import { VertexAiService } from "../vertex-ai.service";
import { SpeechClient, protos } from "@google-cloud/speech";
import { TextToSpeechClient, protos as ttsProtos } from "@google-cloud/text-to-speech";
import { AiConfigService, VertexAiConfig } from "../ai-config.service";

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private sttClient?: SpeechClient;
  private ttsClient?: TextToSpeechClient;
  private config!: VertexAiConfig;

  constructor(
    private readonly aiConfigService: AiConfigService,
    @Optional() private readonly vertexAiService?: VertexAiService,
  ) {}

  onModuleInit() {
    this.config = this.aiConfigService.getConfig();
    const opts: { credentials?: object; keyFile?: string; apiKey?: string } = {};
    if (this.config.apiKey) {
      opts.apiKey = this.config.apiKey;
    } else if (this.config.credentialsJson) {
      opts.credentials = this.config.credentialsJson as object;
    } else if (this.config.credentialsPath) {
      opts.keyFile = this.config.credentialsPath;
    }
    try {
      this.sttClient = new SpeechClient(opts);
      this.ttsClient = new TextToSpeechClient(opts);
      this.logger.log("Google Cloud Speech + TTS clients initialized");
    } catch (err) {
      this.logger.warn(
        `Google Cloud Speech/TTS no inicializados: ${err instanceof Error ? err.message : "Unknown"}. Se usará Web Speech API como fallback en el cliente.`,
      );
    }
  }

  /**
   * Transcribe audio (webm/wav/ogg) a texto usando Google Cloud Speech-to-Text.
   * Si el cliente no está disponible (cold start de Render o credenciales faltantes),
   * propaga un error que el cliente resolverá con Web Speech API.
   */
  async transcribe(
    audioBuffer: Buffer,
    language: "es" | "en" | "pt" = "es",
  ): Promise<{ text: string; confianza: number; language: string; latencyMs: number }> {
    const start = Date.now();
    if (!this.sttClient) {
      throw new InternalServerErrorException(
        "Servicio STT no disponible. Usa Web Speech API en el cliente.",
      );
    }
    try {
      const languageCode = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-ES";
      const [response] = await this.sttClient.recognize({
        config: {
          encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
          languageCode,
          model: "latest_long",
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
        },
        audio: { content: audioBuffer.toString("base64") },
      });
      const transcription = response.results
        ?.map((r) => r.alternatives?.[0]?.transcript ?? "")
        .filter(Boolean)
        .join(" ")
        .trim();
      const confianza = response.results?.[0]?.alternatives?.[0]?.confidence ?? 0.9;

      if (!transcription) {
        throw new InternalServerErrorException(
          "No se pudo transcribir el audio. Intenta de nuevo con mejor calidad.",
        );
      }
      return {
        text: transcription,
        confianza,
        language: languageCode,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`STT failed: ${err instanceof Error ? err.message : "Unknown"}`);
      throw new InternalServerErrorException(
        `Error en transcripción: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    }
  }

  /**
   * Sintetiza texto a audio (MP3) usando Google Cloud Text-to-Speech.
   */
  async synthesize(
    text: string,
    options: { voice?: string; language?: "es" | "en" | "pt"; speed?: number } = {},
  ): Promise<{ audioBase64: string; format: "mp3"; voice: string; latencyMs: number }> {
    const start = Date.now();
    if (!this.ttsClient) {
      throw new InternalServerErrorException(
        "Servicio TTS no disponible. Usa Web Speech API en el cliente.",
      );
    }
    const languageCode =
      options.language === "pt" ? "pt-BR" : options.language === "en" ? "en-US" : "es-ES";
    const voiceName = options.voice ?? "es-ES-Neural2-A";

    try {
      const [response] = await this.ttsClient.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: ttsProtos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
          speakingRate: options.speed ?? 1.0,
        },
      });
      const audioContent = response.audioContent;
      if (!audioContent) {
        throw new InternalServerErrorException("TTS no devolvió audio");
      }
      const audioBuffer = audioContent as Buffer;
      return {
        audioBase64: audioBuffer.toString("base64"),
        format: "mp3",
        voice: voiceName,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`TTS failed: ${err instanceof Error ? err.message : "Unknown"}`);
      throw new InternalServerErrorException(
        `Error en síntesis de voz: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    }
  }
}

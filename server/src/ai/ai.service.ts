// ============================================================
// server/src/ai/ai.service.ts — Capa de negocio
// Orquesta: rate limiting granular + Vertex AI + formateo por endpoint
// ============================================================

import {
  Injectable,
  Logger,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { VertexAiService, VertexAiGenerationResult } from "./vertex-ai.service";
import { ChatResponseDto } from "./dto/chat.dto";
import { ChatMessageDto, ModerationResultDto } from "./dto/ai.dto";
import { VisionAnalysisType } from "./dto/vision-analyze.dto";

interface UserRateLimit {
  count: number;
  resetTime: number;
}

type RateLimitBucket = "chat" | "hashtags" | "comments" | "moderation" | "vision";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly userRateLimits = new Map<string, Map<RateLimitBucket, UserRateLimit>>();
  private readonly rateLimitWindowMs = 60_000; // 1 minuto

  private readonly rateLimits: Record<RateLimitBucket, number> = {
    chat: 20,
    hashtags: 60,
    comments: 30,
    moderation: 100,
    vision: 30,
  };

  constructor(private readonly vertexAiService: VertexAiService) {}

  async chat(
    userId: string,
    message: string,
    history?: ChatMessageDto[],
  ): Promise<ChatResponseDto> {
    this.checkRateLimit(userId, "chat");

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(message, { history });
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      const friendlyMessage = this.parseVertexAiError(rawError);
      this.logger.error(`AI chat failed for user ${userId}: ${friendlyMessage}`);
      throw new InternalServerErrorException(friendlyMessage);
    }

    return {
      reply: result.text,
      suggestions: this.extractSuggestions(result.text),
      metadata: {
        tokens: result.tokens,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    };
  }

  async generateCommentSuggestions(
    userId: string,
    postContext: string,
    partialText: string,
    language?: "es" | "en" | "pt",
  ): Promise<{
    suggestions: string[];
    metadata: { tokens: number; model: string; latencyMs: number };
  }> {
    this.checkRateLimit(userId, "comments");

    const prompt = `Contexto del post: """${postContext.slice(0, 500)}"""

Comentario parcial del usuario: """${partialText.slice(0, 200)}"""

Genera 3 sugerencias cortas (máx 80 caracteres cada una) para completar este comentario.
Responde ÚNICAMENTE con un JSON array de strings en este formato exacto:
{"suggestions": ["sugerencia 1", "sugerencia 2", "sugerencia 3"]}`;

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(prompt, {
        language: language ?? "es",
        temperature: 0.7,
      });
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(this.parseVertexAiError(rawError));
    }

    const suggestions = this.parseSuggestionList(result.text, 3);
    return {
      suggestions,
      metadata: { tokens: result.tokens, model: result.model, latencyMs: result.latencyMs },
    };
  }

  async generateHashtags(
    userId: string,
    content: string,
    options?: { minTags?: number; maxTags?: number; language?: "es" | "en" | "pt" },
  ): Promise<{ tags: string[]; metadata: { tokens: number; model: string; latencyMs: number } }> {
    this.checkRateLimit(userId, "hashtags");

    const minTags = options?.minTags ?? 3;
    const maxTags = options?.maxTags ?? 5;
    const language = options?.language ?? "es";

    const prompt = `Contenido del post: """${content.slice(0, 1000)}"""

Genera entre ${minTags} y ${maxTags} hashtags relevantes en ${language === "es" ? "español" : language === "pt" ? "portugués" : "inglés"}.
Reglas estrictas:
- Sin acentos, en minúsculas
- Formato: "deporte-zona" (p. ej. "padel-lima"), "deporte-nivel" (p. ej. "tenis-intermedio") o términos genéricos (p. ej. "deporte", "amateur", "competitivo")
- Devuelve SOLO el JSON array: {"tags": ["padel", "lima", "competitivo"]}`;

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(prompt, {
        language,
        temperature: 0.5,
      });
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(this.parseVertexAiError(rawError));
    }

    const tags = this.parseHashtagsList(result.text, maxTags);
    return {
      tags,
      metadata: { tokens: result.tokens, model: result.model, latencyMs: result.latencyMs },
    };
  }

  async moderateContent(
    userId: string,
    text: string,
    context: "post" | "comment" | "bio" | "ad",
  ): Promise<ModerationResultDto> {
    this.checkRateLimit(userId, "moderation");

    const prompt = `Analiza el siguiente texto (contexto: ${context}) y clasifícalo en categorías de seguridad.

Texto: """${text.slice(0, 2000)}"""

Responde SOLO con un JSON en este formato exacto:
{
  "safe": boolean,
  "flagged": boolean,
  "categorias": {
    "toxicity": number,
    "harassment": number,
    "sexual": number,
    "violence": number
  },
  "confidencia": number
}

Reglas:
- "safe": true si ninguna categoría supera 0.7
- "flagged": true si "safe" es false
- "confidencia" >= 0.8 si hay indicadores claros`;

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(prompt, {
        language: "es",
        temperature: 0.1,
      });
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(this.parseVertexAiError(rawError));
    }

    return this.parseModerationResult(result.text, text);
  }

  private parseVertexAiError(rawError: string): string {
    if (rawError.includes("NOT_FOUND") || rawError.includes("was not found")) {
      return "El modelo de IA no está disponible. Por favor, contacta al administrador.";
    }
    if (rawError.includes("PERMISSION_DENIED") || rawError.includes("permission")) {
      return "No tienes permisos para usar el asistente de IA.";
    }
    if (rawError.includes("UNAUTHENTICATED") || rawError.includes("credentials")) {
      return "Error de autenticación con el servicio de IA. Por favor, contacta al administrador.";
    }
    if (rawError.includes("RESOURCE_EXHAUSTED") || rawError.includes("quota")) {
      return "Se ha alcanzado el límite de uso de IA. Por favor, intenta más tarde.";
    }
    if (rawError.includes("DEADLINE_EXCEEDED") || rawError.includes("timeout")) {
      return "La IA tardó demasiado en responder. Por favor, intenta de nuevo.";
    }
    return "No se pudo procesar tu solicitud en este momento. Por favor, intenta de nuevo.";
  }

  private checkRateLimit(userId: string, bucket: RateLimitBucket): void {
    const now = Date.now();
    let userBuckets = this.userRateLimits.get(userId);
    if (!userBuckets) {
      userBuckets = new Map();
      this.userRateLimits.set(userId, userBuckets);
    }
    const userLimit = userBuckets.get(bucket);
    const max = this.rateLimits[bucket];

    if (!userLimit || now > userLimit.resetTime) {
      userBuckets.set(bucket, { count: 1, resetTime: now + this.rateLimitWindowMs });
      return;
    }

    if (userLimit.count >= max) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Has excedido el límite de ${max} operaciones de ${bucket} por minuto. Por favor, espera un momento.`,
          bucket,
          retryAfterMs: this.rateLimitWindowMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    userLimit.count++;
  }

  private extractSuggestions(reply: string): string[] {
    return this.parseSuggestionList(reply, 4, [
      "Buscar canchas cerca",
      "Ver mi racha",
      "Recomiéndame un partido",
    ]);
  }

  private parseSuggestionList(text: string, max: number, fallback?: string[]): string[] {
    const fallbackArr = fallback ?? [
      "Buscar canchas cerca",
      "Ver mi racha",
      "Recomiéndame un partido",
    ];
    try {
      const trimmed = text.trim();
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/) ?? trimmed.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { suggestions?: unknown; tags?: unknown };
        const arr = parsed.suggestions ?? parsed.tags;
        if (Array.isArray(arr)) {
          return arr.filter((s): s is string => typeof s === "string").slice(0, max);
        }
      }
    } catch {
      // No era JSON
    }
    return fallbackArr;
  }

  private parseHashtagsList(text: string, max: number): string[] {
    const tags = this.parseSuggestionList(text, max, []);
    return tags.map((t) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }

  private parseModerationResult(text: string, originalText: string): ModerationResultDto {
    try {
      const trimmed = text.trim();
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          safe?: boolean;
          flagged?: boolean;
          categorias?: {
            toxicity?: number;
            harassment?: number;
            sexual?: number;
            violence?: number;
          };
          confidencia?: number;
        };
        return {
          safe: parsed.safe ?? true,
          flagged: parsed.flagged ?? false,
          categorias: {
            toxicity: parsed.categorias?.toxicity ?? 0,
            harassment: parsed.categorias?.harassment ?? 0,
            sexual: parsed.categorias?.sexual ?? 0,
            violence: parsed.categorias?.violence ?? 0,
          },
          confidencia: parsed.confidencia ?? 0.5,
          preview: originalText.slice(0, 80),
        };
      }
    } catch {
      // No era JSON, fall back a permissive defaults
    }
    return {
      safe: true,
      flagged: false,
      categorias: { toxicity: 0, harassment: 0, sexual: 0, violence: 0 },
      confidencia: 0.3,
      preview: originalText.slice(0, 80),
    };
  }

  async analyzeVision(
    userId: string,
    imageUrl: string,
    analysisType: VisionAnalysisType,
  ): Promise<{ result: unknown; confidence: number }> {
    this.checkRateLimit(userId, "vision");

    // Descargar imagen
    let imageBuffer: Buffer;
    let mimeType = "image/jpeg";

    try {
      if (imageUrl.startsWith("data:")) {
        const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) throw new BadRequestException("Formato de imagen data URL inválido");
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], "base64");
      } else if (imageUrl.startsWith("http")) {
        const res = await fetch(imageUrl);
        if (!res.ok) {
          throw new BadRequestException(
            `No se pudo descargar la imagen desde la URL: ${res.statusText}`,
          );
        }
        const arrayBuffer = await res.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        mimeType = res.headers.get("content-type") || "image/jpeg";
      } else {
        throw new BadRequestException("URL de imagen inválida o no soportada.");
      }
    } catch (err) {
      throw new BadRequestException(
        `Error al procesar la imagen: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Definir prompt según tipo de análisis
    let prompt = "";
    if (analysisType === VisionAnalysisType.FAKE_PROFILE) {
      prompt = `Analiza esta fotografía de perfil.
Determina si presenta señales típicas de imágenes generadas por inteligencia artificial (IA).

Evalúa detalladamente:
- Ojos: anomalías en pupilas, reflejos extraños, falta de simetría en el iris.
- Dientes: fusión de dientes, formas poco naturales.
- Manos visibles (si las hay): dedos extra, formas distorsionadas.
- Fondo: desenfoque incoherente, deformaciones geométricas, texturas extrañas.
- Iluminación y sombras: inconsistencias en la fuente de luz, sombras anómalas en el rostro.
- Consistencia facial: orejas asimétricas, accesorios (aretes, lentes) que no coinciden o se funden con la piel.
- Textura de piel: excesivamente lisa (estilo plástico/porcelana) o patrones repetitivos.
- Artefactos visuales: distorsiones de compresión localizadas.

Responde ÚNICAMENTE con un objeto JSON en el siguiente formato exacto:
{
  "isLikelyAIGenerated": boolean,
  "confidence": number,
  "reasons": string[]
}

Reglas:
- isLikelyAIGenerated: true si la probabilidad de ser generada por IA es mayor al 50%
- confidence: número entre 0 y 1 que indica tu confianza en el análisis
- reasons: un array de strings en español explicando brevemente cada señal detectada (máximo 3-4 razones)`;
    } else {
      prompt = `Analiza la postura deportiva de la persona en la imagen.

Evalúa detalladamente:
- Alineación corporal: ángulo de la columna, posición de la cabeza, hombros y cadera.
- Equilibrio y centro de gravedad: distribución del peso.
- Postura general y biomecánica según el deporte observable (fútbol, tenis, padel, etc.).
- Estabilidad de las articulaciones de apoyo.
- Errores visibles en la ejecución de la postura.

Responde ÚNICAMENTE con un objeto JSON en el siguiente formato exacto:
{
  "score": number,
  "strengths": string[],
  "improvements": string[],
  "confidence": number
}

Reglas:
- score: número entero entre 0 y 100 indicando la calidad de la postura
- strengths: un array de strings en español con las fortalezas observadas (máximo 3)
- improvements: un array de strings en español con los errores o puntos de mejora (máximo 3)
- confidence: número entre 0 y 1 que indica tu confianza en el análisis`;
    }

    try {
      const response = await this.vertexAiService.analyzeImage(
        {
          mimeType,
          base64Data: imageBuffer.toString("base64"),
        },
        prompt,
        0.1,
      );

      // Si no hay confianza mapeada directamente, usar la devuelta por analyzeImage
      const resultObj = response.result as { confidence?: number } | null | undefined;
      const confidence =
        resultObj && typeof resultObj.confidence === "number"
          ? resultObj.confidence
          : response.confidence;
      return { result: response.result, confidence };
    } catch (err) {
      this.logger.error(
        `AI vision analysis failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new InternalServerErrorException("No se pudo completar el análisis visual.");
    }
  }
}

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
} from "@nestjs/common";
import { VertexAiService, VertexAiGenerationResult } from "./vertex-ai.service";
import { ChatResponseDto } from "./dto/chat.dto";
import { ChatMessageDto, ModerationResultDto, CoachRecommendationDto } from "./dto/ai.dto";

interface UserRateLimit {
  count: number;
  resetTime: number;
}

type RateLimitBucket = "chat" | "hashtags" | "comments" | "moderation";

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
  };

  constructor(private readonly vertexAiService: VertexAiService) {}

  async chat(
    userId: string,
    message: string,
    history?: ChatMessageDto[],
    language?: "es" | "en" | "pt",
  ): Promise<ChatResponseDto> {
    this.checkRateLimit(userId, "chat");

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(message, {
        history,
        language: language ?? "es",
      });
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

  // ==============================================================
  // SCRUM-345 — welcome(): Genera el primer mensaje de Sporty
  // dinámicamente con Vertex AI. NO devuelve texto hardcoded.
  // El LLM produce el contenido en el idioma solicitado.
  // ==============================================================
  async welcome(userId: string, language: "es" | "en" | "pt"): Promise<ChatResponseDto> {
    this.checkRateLimit(userId, "chat");

    // Prompt que induce al LLM a generar un saludo natural, corto
    // y con la personalidad de Sporty (amigable, cercano, no formal).
    const welcomePrompt =
      language === "en"
        ? "You are Sporty, greeting a user who just opened the chat for the first time. Keep it super short (1-2 sentences, max 40 words). Sound like a friend texting, not a corporate bot. Mention ONE thing you can help with (e.g. finding a match, checking their streak). Don't list everything. Don't start with 'Hi!'. Respond in English only."
        : language === "pt"
          ? "Você é o Sporty, dando oi pra um usuário que acabou de abrir o chat pela primeira vez. Seja bem curto (1-2 frases, máx 40 palavras). Fale como um amigo mandando zap, não como bot corporativo. Mencione UMA coisa que você pode ajudar (tipo achar uma partida, ver a sequência). Não liste tudo. Não comece com 'Olá!'. Responda só em português."
          : "Eres Sporty, saludando a un usuario que acaba de abrir el chat por primera vez. Sé bien corto (1-2 frases, máx 40 palabras). Habla como amigo mandando WhatsApp, no como bot corporativo. Menciona UNA sola cosa en la que puedes ayudar (ej. encontrar un partido, ver su racha). No listes todo. No arranques con '¡Hola!'. Responde solo en español.";

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(welcomePrompt, {
        language,
        temperature: 0.8,
      });
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      const friendlyMessage = this.parseVertexAiError(rawError);
      this.logger.error(`AI welcome failed for user ${userId}: ${friendlyMessage}`);
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

  async recommendCourts(
    userId: string,
    preferences: CoachRecommendationDto,
    language: "es" | "en" | "pt" = "es",
  ): Promise<ChatResponseDto> {
    this.checkRateLimit(userId, "chat");

    const promptLang =
      language === "en" ? "English" : language === "pt" ? "Portuguese" : "Spanish";
    const parts: string[] = [];
    if (preferences.sport) parts.push(`Sport: ${preferences.sport}`);
    if (preferences.location) parts.push(`Location: ${preferences.location}`);
    if (preferences.level) parts.push(`Level: ${preferences.level}`);
    if (preferences.preferences) parts.push(`Preferences: ${preferences.preferences}`);
    const userContext = parts.length > 0 ? parts.join(", ") : "no specific preferences";

    const prompt = `You are Sporty, an expert sports coach giving court recommendations. A user with these preferences — ${userContext} — wants your advice.

Keep your response short (max 80 words), natural, and conversational. Sound like a friend giving tips, not a corporate bot.

Structure your response as:
1. A brief personal recommendation (2-3 sentences)
2. A suggestion of what type of court to look for
3. A practical tip (e.g. best time to book, what to bring)

Respond in ${promptLang} only. Do NOT list courts by name.`;

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(prompt, {
        language,
        temperature: 0.7,
      });
    } catch (err) {
      const rawError = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(this.parseVertexAiError(rawError));
    }

    return {
      reply: result.text,
      suggestions: [
        language === "en"
          ? "Show me available courts"
          : language === "pt"
            ? "Mostrar quadras disponíveis"
            : "Mostrar canchas disponibles",
        language === "en"
          ? "I need a different sport"
          : language === "pt"
            ? "Quero outro esporte"
            : "Necesito otro deporte",
        language === "en"
          ? "More details please"
          : language === "pt"
            ? "Mais detalhes por favor"
            : "Más detalles por favor",
      ],
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

  /**
   * Mapea errores del SDK de Vertex AI / Gen AI a mensajes amigables.
   *
   * IMPORTANTE: distinguir entre errores REALES de permisos (IAM
   * del Service Account) y errores transitorios que contienen la
   * palabra "permission" en su mensaje (rate limits, timeouts, etc.).
   * El mapeo anterior era demasiado laxo y mostraba
   * "No tienes permisos para usar el asistente de IA" incluso
   * para errores 503 transitorios del servicio.
   *
   * Estrategia: detectar el código/status HTTP/SDK PRIMERO, luego
   * hacer fallback a la búsqueda de palabras clave.
   */
  private parseVertexAiError(rawError: string): string {
    const lower = rawError.toLowerCase();

    // 1. Modelos / recursos no encontrados (404)
    if (lower.includes("not_found") || lower.includes("was not found") || lower.includes("404")) {
      return "El modelo de IA no está disponible. Por favor, contacta al administrador.";
    }

    // 2. Errores de autenticación del SERVICE ACCOUNT (401/403 IAM)
    //    Diferenciar de errores genéricos que mencionan "permission".
    if (lower.includes("unauthenticated") || lower.includes("401")) {
      return "Error de autenticación con el servicio de IA. Por favor, contacta al administrador.";
    }
    if (
      lower.includes("permission_denied") ||
      lower.includes("iam") ||
      lower.includes("service account") ||
      lower.includes("caller does not have permission")
    ) {
      return "El servicio de IA no tiene permisos configurados. Por favor, contacta al administrador.";
    }
    if (lower.includes("403") && !lower.includes("rate") && !lower.includes("quota")) {
      return "Acceso denegado al servicio de IA. Por favor, contacta al administrador.";
    }

    // 3. Rate limit / cuota (429)
    if (
      lower.includes("resource_exhausted") ||
      lower.includes("429") ||
      lower.includes("quota exceeded") ||
      lower.includes("rate limit")
    ) {
      return "Se ha alcanzado el límite de uso de IA. Por favor, intenta más tarde.";
    }

    // 4. Timeouts / deadline (504)
    if (lower.includes("deadline_exceeded") || lower.includes("504") || lower.includes("timeout")) {
      return "La IA tardó demasiado en responder. Por favor, intenta de nuevo.";
    }

    // 5. Errores transitorios del servidor (500/502/503)
    if (
      lower.includes("internal") ||
      lower.includes("unavailable") ||
      lower.includes("500") ||
      lower.includes("502") ||
      lower.includes("503") ||
      lower.includes("service is currently unavailable")
    ) {
      return "El servicio de IA está temporalmente no disponible. Por favor, intenta en unos segundos.";
    }

    // 6. Network errors (cliente no pudo alcanzar el servicio)
    if (
      lower.includes("econnrefused") ||
      lower.includes("enotfound") ||
      lower.includes("network") ||
      lower.includes("fetch failed")
    ) {
      return "No se pudo conectar con el servicio de IA. Verifica tu conexión e intenta de nuevo.";
    }

    // 7. Errores residuales que mencionan "permission" genéricamente
    //    (los más laxa posible: solo si NO se clasificó antes)
    if (lower.includes("permission")) {
      return "El servicio de IA reportó un error de permisos. Si persiste, contacta al administrador.";
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
}

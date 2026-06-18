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
import {
  VertexAiService,
  VertexAiGenerationResult,
  UserPersonalizedContext,
} from "./vertex-ai.service";
import { ChatResponseDto } from "./dto/chat.dto";
import {
  ChatMessageDto,
  ModerationResultDto,
  CoachRecommendationDto,
  ModerateAdvancedResultDto,
} from "./dto/ai.dto";
import { PrismaService } from "../prisma/prisma.service";

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

  constructor(
    private readonly vertexAiService: VertexAiService,
    private readonly prisma: PrismaService,
  ) {}

  async getUserPersonalizedContext(userId: string): Promise<UserPersonalizedContext> {
    const defaultContext: UserPersonalizedContext = {
      name: "",
      city: "",
      preferredSports: [],
      mutualMatches: [],
      recommendedCourts: [],
      activeMatches: [],
    };

    let isDbHealthy = this.prisma.isHealthy();
    if (!isDbHealthy) {
      this.logger.warn(
        "Database connection is down, trying manual reconnect in getUserPersonalizedContext...",
      );
      isDbHealthy = await this.prisma.tryReconnect();
    }

    if (!isDbHealthy) {
      return defaultContext;
    }

    try {
      // 1. Obtener perfil
      const profile = await this.prisma.profiles.findUnique({
        where: { id: userId },
        select: {
          name: true,
          city: true,
          preferred_sports: true,
          user_sports: true,
        },
      });

      if (!profile) {
        return defaultContext;
      }

      // Procesar deportes preferidos y niveles
      const preferredSports: { sport: string; level: string }[] = [];
      const sportsList: string[] = [];

      if (profile.user_sports && Array.isArray(profile.user_sports)) {
        const userSportsArr = profile.user_sports as any[];
        for (const item of userSportsArr) {
          const sportName = item.sport_id || item.sport;
          if (sportName) {
            const levelNum = item.level;
            const levelLabel =
              levelNum === 3 ? "Avanzado" : levelNum === 2 ? "Intermedio" : "Principiante";
            preferredSports.push({ sport: sportName, level: levelLabel });
            sportsList.push(sportName);
          }
        }
      }

      // Fallback a preferred_sports si user_sports está vacío
      if (
        preferredSports.length === 0 &&
        profile.preferred_sports &&
        profile.preferred_sports.length > 0
      ) {
        for (const s of profile.preferred_sports) {
          preferredSports.push({ sport: s, level: "No especificado" });
          sportsList.push(s);
        }
      }

      // 2. Obtener matches mutuos (likes recíprocos en public.swipes)
      let mutualMatches: { name: string; sport: string; targetId: string }[] = [];
      try {
        const rawMatches = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT DISTINCT p.id as target_id, p.name, s1.sport
           FROM public.swipes s1
           JOIN public.swipes s2 ON s1.actor_id = s2.target_id AND s1.target_id = s2.actor_id
           JOIN public.profiles p ON p.id = s1.target_id
           WHERE s1.actor_id = $1::uuid
             AND s1.action = 'LIKE'
             AND s2.action = 'LIKE'
           LIMIT 5`,
          userId,
        );

        if (Array.isArray(rawMatches)) {
          mutualMatches = rawMatches.map((m) => ({
            name: m.name || "Otro jugador",
            sport: m.sport || "Deporte general",
            targetId: m.target_id || "",
          }));
        }
      } catch (err) {
        this.logger.warn(
          `Failed to fetch mutual matches for context: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      const searchSports = sportsList.length > 0 ? sportsList : ["Fútbol", "Pádel", "Tenis"];

      // 3. Obtener canchas recomendadas para sus deportes preferidos
      let recommendedCourts: {
        name: string;
        sport: string;
        price: number;
        rating: number;
        district: string;
      }[] = [];
      try {
        const courts = await this.prisma.courts.findMany({
          where: {
            sport: { in: searchSports },
            is_available: true,
          },
          orderBy: { rating: "desc" },
          take: 5,
        });

        recommendedCourts = courts.map((c) => ({
          name: c.name,
          sport: c.sport,
          price: c.price_per_hour,
          rating: c.rating,
          district: c.district || "zona cercana",
        }));
      } catch (err) {
        this.logger.warn(
          `Failed to fetch recommended courts for context: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      // 4. Obtener pichangas/partidos abiertos programados
      let activeMatches: {
        title: string;
        sport: string;
        date: string;
        time: string;
        requiredLevel: string;
        courtName: string;
      }[] = [];
      try {
        const matches = await this.prisma.matches.findMany({
          where: {
            sport: { in: searchSports },
            status: "OPEN",
          },
          include: {
            court: true,
          },
          orderBy: { date: "asc" },
          take: 3,
        });

        activeMatches = matches.map((m) => ({
          title: m.title,
          sport: m.sport,
          date: m.date,
          time: m.time,
          requiredLevel: m.required_level || "Todos los niveles",
          courtName: m.court?.name || "Cancha externa",
        }));
      } catch (err) {
        this.logger.warn(
          `Failed to fetch active matches for context: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      return {
        name: profile.name || "",
        city: profile.city || "",
        preferredSports,
        mutualMatches,
        recommendedCourts,
        activeMatches,
      };
    } catch (err) {
      this.logger.error(
        `Error building personalized context for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return defaultContext;
    }
  }

  async chat(
    userId: string,
    message: string,
    history?: ChatMessageDto[],
    language?: "es" | "en" | "pt",
  ): Promise<ChatResponseDto> {
    this.checkRateLimit(userId, "chat");

    const context = await this.getUserPersonalizedContext(userId);

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(message, {
        history,
        language: language ?? "es",
        userContext: context,
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

    const context = await this.getUserPersonalizedContext(userId);
    const name =
      context.name || (language === "en" ? "Athlete" : language === "pt" ? "Atleta" : "Atleta");
    const sportsText =
      context.preferredSports.length > 0
        ? context.preferredSports.map((s) => s.sport).join(", ")
        : "";

    let welcomePrompt = "";
    if (language === "en") {
      welcomePrompt = `You are Sporty, greeting the user ${name} who just opened the chat for the first time. Keep it super short (1-2 sentences, max 40 words). Sound like a friend texting, not a corporate bot.
User plays: ${sportsText || "sports"}.
Mention ONE highly personalized thing you can help with, using their name ${name} naturally. For example, if they play soccer, ask if they want to find a match or recommend a nearby court. Don't start with 'Hi!'. Respond in English only.`;
    } else if (language === "pt") {
      welcomePrompt = `Você é o Sporty, dando oi para o usuário ${name} que acabou de abrir o chat pela primeira vez. Seja bem curto (1-2 frases, máx 40 palavras). Fale como um amigo mandando zap, não como bot corporativo.
O usuário joga: ${sportsText || "esportes"}.
Mencione UMA coisa bem personalizada em que você pode ajudar usando o nome ${name} naturalmente. Ex: se ele joga futebol, pergunte se quer achar uma pelada hoje ou recomenda uma quadra. Não comece com 'Olá!'. Responda só em português.`;
    } else {
      welcomePrompt = `Eres Sporty, saludando al usuario ${name} que acaba de abrir el chat por primera vez. Sé bien corto (1-2 frases, máx 40 palabras). Habla como amigo mandando WhatsApp, no como bot corporativo.
El usuario juega: ${sportsText || "deportes"}.
Menciona UNA sola cosa súper personalizada en la que puedes ayudar usando el nombre ${name} de forma natural (ej. encontrar una pichanga de ${context.preferredSports[0]?.sport || "su deporte preferido"} para hoy o recomendarle una de las canchas disponibles). No listes todo. No arranques con '¡Hola!'. Responde solo en español.`;
    }

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(welcomePrompt, {
        language,
        temperature: 0.8,
        userContext: context,
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

    const promptLang = language === "en" ? "English" : language === "pt" ? "Portuguese" : "Spanish";
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

  async moderateAdvanced(
    userId: string,
    content: string,
    contextType: "mensaje" | "comentario" | "perfil",
    metadata?: Record<string, any>,
  ): Promise<ModerateAdvancedResultDto> {
    this.checkRateLimit(userId, "moderation");

    let isDbHealthy = this.prisma.isHealthy();
    if (!isDbHealthy) {
      this.logger.warn(
        "Database connection is down, attempting manual reconnect in moderateAdvanced...",
      );
      isDbHealthy = await this.prisma.tryReconnect();
    }

    // 1. Detección de IA (Vertex AI)
    let aiScore = 0;
    let aiReason = "Contenido limpio analizado por IA.";
    try {
      const aiResult = await this.moderateContent(userId, content, "post");
      const maxAiCategory = Math.max(
        aiResult.categorias.toxicity,
        aiResult.categorias.harassment,
        aiResult.categorias.sexual,
        aiResult.categorias.violence,
      );
      aiScore = Math.round(maxAiCategory * 100);
      if (aiScore > 50) {
        aiReason = `Modelos de IA detectaron riesgo alto (${aiScore}/100) en categorías de seguridad.`;
      }
    } catch (err) {
      this.logger.warn(`Vertex AI content moderation fallback due to error: ${err.message}`);
    }

    // 2. Reglas de Negocio / Spam / Keyword checks
    let rulesScore = 0;
    let rulesReason = "";

    // Check de Insultos / Spam
    const toxicKeywords = [
      "tonto",
      "estupido",
      "estúpido",
      "imbecil",
      "imbécil",
      "basura",
      "mierda",
    ];
    const contentLower = content.toLowerCase();
    const hasToxicWord = toxicKeywords.some((word) => contentLower.includes(word));

    // Check de enlaces / spam
    const hasSpamPattern =
      contentLower.includes("http") || contentLower.includes("www") || content.includes("!!!");

    if (hasToxicWord) {
      rulesScore = 90;
      rulesReason = "Se detectó el uso de lenguaje vulgar o insultos en el texto.";
    } else if (hasSpamPattern) {
      rulesScore = 55;
      rulesReason = "Se detectaron posibles patrones de spam o enlaces sospechosos.";
    }

    // 3. Comportamiento del usuario (trust_score de la base de datos)
    let behaviorScore = 0;
    let behaviorReason = "Historial del usuario confiable.";
    if (isDbHealthy) {
      try {
        const profile = await this.prisma.profiles.findUnique({
          where: { id: userId },
          select: { trust_score: true },
        });
        const trustScore = profile?.trust_score ?? 100;
        behaviorScore = 100 - trustScore;
        if (behaviorScore > 30) {
          behaviorReason = `El usuario tiene un puntaje de confianza bajo en el sistema (${trustScore}/100).`;
        }
      } catch (err) {
        this.logger.warn(`Could not read trust_score from DB: ${err.message}`);
      }
    } else {
      this.logger.warn("Skipping trust_score DB check in degraded mode.");
    }

    // 4. Ensemble Score Calculation
    // ensemble_score es el máximo de las señales individuales y del promedio ponderado
    const weightedAvg = Math.round(0.4 * aiScore + 0.3 * rulesScore + 0.3 * behaviorScore);
    const ensembleScore = Math.max(aiScore, rulesScore, behaviorScore, weightedAvg);

    // Determinar la acción recomendada
    let actionRecommended: "allow" | "warn" | "block" = "allow";
    if (ensembleScore >= 75) {
      actionRecommended = "block";
    } else if (ensembleScore >= 40) {
      actionRecommended = "warn";
    }

    // Compilar razonamiento
    const reasoningParts = [];
    if (aiScore > 50) reasoningParts.push(aiReason);
    if (rulesScore > 0) reasoningParts.push(rulesReason);
    if (behaviorScore > 30) reasoningParts.push(behaviorReason);
    if (reasoningParts.length === 0) {
      reasoningParts.push(
        "Todas las señales analizadas indican comportamiento seguro y contenido limpio.",
      );
    }
    const reasoning = reasoningParts.join(" ");

    const result: ModerateAdvancedResultDto = {
      ensemble_score: ensembleScore,
      signals: [
        { name: "Modelos IA (Vertex)", score: aiScore, description: aiReason },
        {
          name: "Reglas y Palabras Clave",
          score: rulesScore,
          description: rulesReason || "Sin coincidencias de reglas.",
        },
        { name: "Historial de Comportamiento", score: behaviorScore, description: behaviorReason },
      ],
      action_recommended: actionRecommended,
      reasoning: reasoning,
    };

    // 5. Registro en moderation_logs
    if (isDbHealthy) {
      try {
        await this.prisma.moderation_logs.create({
          data: {
            user_id: userId,
            content: content,
            context_type: contextType,
            ensemble_score: ensembleScore,
            action_recommended: actionRecommended,
            reasoning: reasoning,
          },
        });
      } catch (err) {
        this.logger.error(`Failed to write to moderation_logs: ${err.message}`);
      }
    } else {
      this.logger.warn("Skipping moderation logs creation since DB is down.");
    }

    // 6. Si la acción recomendada es "block", aplicar Smart Block (solo si DB es accesible)
    if (actionRecommended === "block" && isDbHealthy) {
      try {
        let blockerId = userId;
        // Buscar un admin para registrar como blocker
        const admin = await this.prisma.profiles.findFirst({
          where: { is_admin: true },
          select: { id: true },
        });
        if (admin) {
          blockerId = admin.id;
        } else {
          // Si no hay admin, buscar cualquier otro perfil para no violar blocker_id <> blocked_id
          const anyOther = await this.prisma.profiles.findFirst({
            where: { id: { not: userId } },
            select: { id: true },
          });
          if (anyOther) {
            blockerId = anyOther.id;
          }
        }

        if (blockerId !== userId) {
          // Bloqueo temporal para pruebas de 2 minutos (originalmente 24 horas)
          const timestampFin = new Date(Date.now() + 2 * 60 * 1000);
          await this.prisma.user_blocks.upsert({
            where: {
              blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: userId },
            },
            create: {
              blocker_id: blockerId,
              blocked_id: userId,
              reason:
                "Bloqueo automático de seguridad IA por comportamiento abusivo o contenido inapropiado.",
              ensemble_score: ensembleScore,
              timestamp_inicio: new Date(),
              timestamp_fin: timestampFin,
            },
            update: {
              reason:
                "Bloqueo automático de seguridad IA por comportamiento abusivo o contenido inapropiado.",
              ensemble_score: ensembleScore,
              timestamp_inicio: new Date(),
              timestamp_fin: timestampFin,
            },
          });
          this.logger.log(
            `User ${userId} automatically blocked by system (ensemble_score=${ensembleScore}) until ${timestampFin.toISOString()}`,
          );
        }
      } catch (err) {
        this.logger.error(`Failed to apply automated block for user ${userId}: ${err.message}`);
      }
    }

    return result;
  }

  async coachChat(
    userId: string,
    message: string,
    history?: ChatMessageDto[],
    language: "es" | "en" | "pt" = "es",
  ): Promise<ChatResponseDto & { messagesRemaining: number }> {
    let isDbHealthy = this.prisma.isHealthy();
    if (!isDbHealthy) {
      this.logger.warn("Database connection is down, attempting manual reconnect...");
      isDbHealthy = await this.prisma.tryReconnect();
    }

    let isPremium = true; // Default to true if DB is down to allow testing/offline usage
    let messageCount = 0;
    let telemetryContext: Array<{ deporte: string; fecha: string; hora: string; cancha: string }> =
      [];

    if (isDbHealthy) {
      try {
        // 1. Verificar si el usuario es PREMIUM
        const profile = await this.prisma.profiles.findUnique({
          where: { id: userId },
          select: { tier: true },
        });

        isPremium = profile?.tier === "PREMIUM";

        // 2. Límite diario: 20 mensajes al día (últimas 24 horas)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        messageCount = await this.prisma.moderation_logs.count({
          where: {
            user_id: userId,
            context_type: "coach",
            created_at: {
              gte: twentyFourHoursAgo,
            },
          },
        });

        // 3. Telemetría de partidos jugados
        const lastMatches = await this.prisma.match_participants.findMany({
          where: { user_id: userId },
          include: {
            match: {
              include: {
                court: true,
              },
            },
          },
          orderBy: { joined_at: "desc" },
          take: 3,
        });

        telemetryContext = lastMatches.map((p) => ({
          deporte: p.match.sport,
          fecha: p.match.date,
          hora: p.match.time,
          cancha: p.match.court?.name || "Cancha genérica",
        }));
      } catch (dbErr) {
        this.logger.error(`Database query failed in coachChat: ${dbErr.message}`);
        // Keep fallback values to avoid crashing/hanging the request
      }
    } else {
      this.logger.warn("Database is unreachable. Running coachChat in degraded mode.");
    }

    if (!isPremium) {
      throw new HttpException(
        "Este servicio requiere una suscripción Premium activa.",
        HttpStatus.FORBIDDEN,
      );
    }

    // Limit check bypassed as requested by user
    /*
    if (messageCount >= 20) {
      throw new HttpException(
        "Has superado el límite diario de 20 mensajes con el Coach IA.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    */

    // 4. Prompt de Vertex AI
    const coachPrompt = `Eres Sporty Coach, un entrenador e instructor de alto rendimiento deportivo. Estás chateando 1-a-1 con un atleta PREMIUM de SportMatch Connect.
Tus respuestas deben ser motivadoras, analíticas, profesionales y llenas de energía.

Información y telemetría de sus últimos partidos:
${telemetryContext.length > 0 ? JSON.stringify(telemetryContext, null, 2) : "Aún no ha participado en partidos recientemente."}

Mensaje del atleta: "${message}"

Responde en el idioma ${language === "en" ? "English" : language === "pt" ? "Portuguese" : "Spanish"}.
Mantén la respuesta concisa y al grano (máx 150 palabras). Da consejos prácticos basados en el deporte que practica o el tema de su pregunta.`;

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(coachPrompt, {
        history: history,
        language: language,
        temperature: 0.7,
      });
    } catch (err) {
      // Fallback local por si Vertex AI falla o no está configurado (por ejemplo, en modo Demo sin API keys)
      this.logger.warn(`Vertex AI coachChat failed, using local mock fallback: ${err}`);
      result = {
        text: `¡Hola! Como tu Coach Sporty, veo que has estado activo. Basado en tu desempeño, te recomiendo mantener una buena hidratación y enfocar tu entrenamiento en la agilidad y técnica de tu deporte. ¡Sigue así!`,
        tokens: 50,
        model: "mock-gemini",
        latencyMs: 150,
      };
    }

    // 5. Registrar en moderation_logs (para llevar la cuenta del límite diario de 20)
    if (isDbHealthy) {
      try {
        await this.prisma.moderation_logs.create({
          data: {
            user_id: userId,
            content: message,
            context_type: "coach",
            ensemble_score: 0,
            action_recommended: "allow",
            reasoning: "Interacción con Coach Premium registrada.",
          },
        });
      } catch (err) {
        this.logger.error(`Failed to register Coach Chat log: ${err.message}`);
      }
    } else {
      this.logger.warn("Skipping moderation log registration since DB is down.");
    }

    return {
      reply: result.text,
      suggestions: [
        "¿Cómo mejoro mi racha?",
        "Recomiéndame una rutina",
        "Dame consejos de nutrición",
      ],
      metadata: {
        tokens: result.tokens,
        model: result.model,
        latencyMs: result.latencyMs,
      },
      messagesRemaining: 20 - (messageCount + 1),
    };
  }

  async recommendSnack(
    userId: string,
    sport: string,
    duration: number,
    intensity: string,
    matchId?: string,
    language: "es" | "en" | "pt" = "es",
  ) {
    let isDbHealthy = this.prisma.isHealthy();
    if (!isDbHealthy) {
      this.logger.warn("Database connection is down, attempting manual reconnect...");
      isDbHealthy = await this.prisma.tryReconnect();
    }

    let isPremium = true; // Default to true if DB is down to allow testing/offline usage

    if (isDbHealthy) {
      try {
        // 1. Verificar si es PREMIUM
        const profile = await this.prisma.profiles.findUnique({
          where: { id: userId },
          select: { tier: true },
        });

        isPremium = profile?.tier === "PREMIUM";
      } catch (dbErr) {
        this.logger.error(`Database query failed in recommendSnack: ${dbErr.message}`);
      }
    } else {
      this.logger.warn("Database is unreachable. Running recommendSnack in degraded mode.");
    }

    if (!isPremium) {
      throw new HttpException(
        "Este servicio requiere una suscripción Premium activa.",
        HttpStatus.FORBIDDEN,
      );
    }

    // 2. Prompt para recomendación de nutrición
    const nutritionPrompt = `Eres un nutricionista deportivo de élite. Genera una recomendación de snack post-entrenamiento altamente personalizada.
Datos del entrenamiento reciente:
- Deporte: ${sport}
- Duración: ${duration} minutos
- Intensidad: ${intensity}

Genera una recomendación de snack ideal en formato JSON exacto:
{
  "snack_name": "Nombre corto y atractivo del snack",
  "calories": número entero estimado de calorías,
  "ingredients": ["ingrediente 1", "ingrediente 2", ...],
  "reasoning": "Explicación breve de por qué este snack ayuda a recuperar según el deporte y la intensidad en el idioma ${language} (máx 60 palabras)"
}

Devuelve ÚNICAMENTE el objeto JSON. Sin formato Markdown ni texto extra.`;

    let resultText = "";
    let parsedData: {
      snack_name: string;
      calories: number;
      ingredients: string[];
      reasoning: string;
    };

    try {
      const response = await this.vertexAiService.generateContent(nutritionPrompt, {
        language,
        temperature: 0.5,
      });
      resultText = response.text;

      const trimmed = resultText.trim();
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON format found in response");
      }
    } catch (err) {
      this.logger.warn(`Vertex AI recommendSnack failed, using fallback mock: ${err}`);
      parsedData = {
        snack_name: "Tazón Recuperador de Avena y Plátano",
        calories: 320,
        ingredients: [
          "Avena en hojuelas",
          "1 Plátano maduro",
          "Miel de abejas",
          "Semillas de chía",
        ],
        reasoning: `Después de un entrenamiento de ${sport} de ${duration} minutos a intensidad ${intensity}, necesitas carbohidratos de absorción rápida y potasio para recuperar electrolitos y reponer el glucógeno muscular rápidamente.`,
      };
    }

    // Guardar en base de datos
    let caloriesBurned = Math.round(
      duration *
        (intensity === "alta" || intensity === "high"
          ? 10
          : intensity === "media" || intensity === "medium"
            ? 7
            : 5),
    );
    if (sport.toLowerCase().includes("fútbol") || sport.toLowerCase().includes("soccer")) {
      caloriesBurned = Math.round(caloriesBurned * 1.2);
    }

    if (isDbHealthy) {
      try {
        await this.prisma.premium_nutrition_logs.create({
          data: {
            user_id: userId,
            match_id: matchId || null,
            sport,
            duration,
            intensity,
            calories_burned: caloriesBurned,
            snack_name: parsedData.snack_name,
            snack_image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop`,
            calories: parsedData.calories,
            ingredients: parsedData.ingredients,
            reasoning: parsedData.reasoning,
          },
        });
      } catch (dbErr) {
        this.logger.error(`Failed to save premium_nutrition_logs: ${dbErr.message}`);
      }
    } else {
      this.logger.warn("Skipping nutrition log registration since DB is down.");
    }

    return {
      ...parsedData,
      calories_burned: caloriesBurned,
      snack_image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop`,
    };
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

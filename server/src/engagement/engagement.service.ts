import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { VertexAiService } from "../ai/vertex-ai.service";
import {
  AiRecommendationRequestDto,
  CreateEngagementEventDto,
  SaveEngagementAchievementDto,
  SaveEngagementChallengeDto,
  SaveEngagementContentDto,
  SaveSmartNotificationDto,
  UpdateBusinessChallengeValidationDto,
} from "./dto";

interface RecommendationCard {
  id: string;
  type: "player" | "sport" | "challenge" | "achievement" | "content" | "venue";
  title: string;
  description: string;
  score: number;
  reasons: string[];
  actionLabel: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

interface AiRecommendationResponse {
  summary: string;
  recommendations: RecommendationCard[];
  dailyChallenge: {
    title: string;
    description: string;
    rewardHint: string;
  };
  achievementIdea: {
    name: string;
    description: string;
    unlockCondition: string;
  };
  weeklyBrief: string;
  tourNarrative: string;
  notificationDraft: {
    title: string;
    body: string;
  };
  metadata: {
    model: string;
    latencyMs: number;
    tokens: number;
    algorithmVersion: string;
    experimentVariant: string;
    cacheStatus?: "hit" | "miss";
    snapshotId?: string;
    expiresAt?: string;
    generatedAt: string;
  };
}

interface RankingSignals {
  likedTypes: Set<string>;
  dismissedTypes: Set<string>;
  embeddingVector: number[];
}

interface CrossSportSuggestion {
  sport: string;
  score: number;
  reasons: string[];
}

interface DailyRecommendationCronOptions {
  limit?: number;
  dryRun?: boolean;
}

interface VenueChallengeMetadata extends Record<string, unknown> {
  selectedVenueId?: string;
  challengeIndex?: number;
  weekKey?: string;
  validationStatus?: "pending" | "approved" | "rejected";
  rewardFitcoins?: number;
  trophyName?: string;
  validationNote?: string;
  validatedAt?: string;
  validatedByBusinessId?: string;
  rewardGrantedAt?: string;
  rejectedAt?: string;
  retryAllowed?: boolean;
}

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vertexAiService: VertexAiService,
  ) {}

  /**
   * Guarda una señal de manera idempotente cuando existe dedupeKey.
   * Esto evita duplicar eventos por reintentos de red del frontend.
   */
  async recordEvent(userId: string, dto: CreateEngagementEventDto) {
    const data = {
      user_id: userId,
      event_type: dto.eventType,
      entity_type: dto.entityType,
      entity_id: dto.entityId,
      metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      dedupe_key: dto.dedupeKey,
    };

    if (dto.dedupeKey) {
      return this.prisma.engagement_events.upsert({
        where: {
          user_id_dedupe_key: {
            user_id: userId,
            dedupe_key: dto.dedupeKey,
          },
        },
        create: data,
        update: {},
      });
    }

    return this.prisma.engagement_events.create({ data });
  }

  /**
   * Construye un resumen explicable de actividad. Este perfil estructurado será
   * la entrada controlada para generar embeddings en la siguiente entrega.
   */
  async getProfile(userId: string) {
    const [profile, events, groupedEvents, embedding] = await Promise.all([
      this.prisma.profiles.findUnique({
        where: { id: userId },
        select: {
          id: true,
          preferred_sports: true,
          level: true,
          city: true,
          trust_score: true,
          matches_played: true,
        },
      }),
      this.prisma.engagement_events.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 100,
        select: { event_type: true, metadata: true, created_at: true },
      }),
      this.prisma.engagement_events.groupBy({
        by: ["event_type"],
        where: { user_id: userId },
        _count: { event_type: true },
      }),
      this.prisma.engagement_embeddings.findUnique({
        where: { user_id: userId },
        select: {
          provider: true,
          dimension: true,
          generated_at: true,
          updated_at: true,
        },
      }),
    ]);

    const sportScores = new Map<string, number>();
    for (const sport of profile?.preferred_sports ?? []) {
      sportScores.set(sport, 5);
    }

    for (const event of events) {
      const metadata = this.asMetadata(event.metadata);
      const sport = typeof metadata.sport === "string" ? metadata.sport.trim() : "";
      if (!sport) continue;
      sportScores.set(sport, (sportScores.get(sport) ?? 0) + this.eventWeight(event.event_type));
    }

    const sportAffinities = [...sportScores.entries()]
      .map(([sport, score]) => ({ sport, score }))
      .sort((a, b) => b.score - a.score);

    return {
      userId,
      generatedAt: new Date().toISOString(),
      baseProfile: profile,
      sportAffinities,
      eventCounts: Object.fromEntries(
        groupedEvents.map((event) => [event.event_type, event._count.event_type]),
      ),
      recentActivityAt: events[0]?.created_at ?? null,
      sampleSize: events.length,
      readyForEmbedding: events.length >= 3 || sportAffinities.length > 0,
      embedding: embedding
        ? {
            provider: embedding.provider,
            dimension: embedding.dimension,
            generatedAt: embedding.generated_at,
            updatedAt: embedding.updated_at,
          }
        : null,
    };
  }

  /**
   * Reconstruye la huella vectorial privada del usuario.
   * MVP: generamos un vector deterministico de 32 dimensiones desde senales
   * estructuradas. Cuando Vertex Embeddings este disponible, este metodo puede
   * reemplazar solo buildDeterministicEmbedding por el proveedor real.
   */
  async rebuildEngagementEmbedding(userId: string) {
    const profile = await this.getProfile(userId);
    const embeddingText = JSON.stringify({
      sports: profile.sportAffinities,
      eventCounts: profile.eventCounts,
      sampleSize: profile.sampleSize,
      readyForEmbedding: profile.readyForEmbedding,
    });
    const vector = this.buildDeterministicEmbedding(embeddingText, 32);

    const embedding = await this.prisma.engagement_embeddings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        embedding_vector: vector,
        provider: "deterministic-local-v1",
        dimension: vector.length,
        metadata: {
          sampleSize: profile.sampleSize,
          topSports: profile.sportAffinities.slice(0, 5),
          reason: "local_mvp_until_vertex_embeddings",
        } as Prisma.InputJsonValue,
      },
      update: {
        embedding_vector: vector,
        provider: "deterministic-local-v1",
        dimension: vector.length,
        metadata: {
          sampleSize: profile.sampleSize,
          topSports: profile.sportAffinities.slice(0, 5),
          reason: "local_mvp_until_vertex_embeddings",
        } as Prisma.InputJsonValue,
        generated_at: new Date(),
      },
    });

    await this.recordEvent(userId, {
      eventType: "ENGAGEMENT_EMBEDDING_REBUILT",
      entityType: "engagement_embedding",
      entityId: embedding.id,
      metadata: {
        provider: embedding.provider,
        dimension: embedding.dimension,
        sampleSize: profile.sampleSize,
      },
    });

    return {
      id: embedding.id,
      provider: embedding.provider,
      dimension: embedding.dimension,
      generatedAt: embedding.generated_at,
      sampleSize: profile.sampleSize,
    };
  }

  /**
   * Resume el rendimiento privado del motor de engagement para el usuario.
   * Sirve como primera capa de A/B testing y diagnostico sin exponer datos globales.
   */
  async getAnalytics(userId: string) {
    const events = await this.prisma.engagement_events.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 500,
      select: {
        event_type: true,
        metadata: true,
        created_at: true,
      },
    });

    const counts = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
      return acc;
    }, {});

    const generated = counts.AI_RECOMMENDATION_GENERATED ?? 0;
    const opened = counts.AI_RECOMMENDATION_OPENED ?? 0;
    const liked = counts.AI_RECOMMENDATION_LIKED ?? 0;
    const dismissed = counts.AI_RECOMMENDATION_DISMISSED ?? 0;
    const completedChallenges = counts.CHALLENGE_COMPLETED ?? 0;
    const savedSignals =
      (counts.ACHIEVEMENT_SAVED ?? 0) +
      (counts.SMART_NOTIFICATION_SAVED ?? 0) +
      (counts.TOUR_NARRATIVE_SAVED ?? 0);

    const variantCounts = events.reduce<Record<string, number>>((acc, event) => {
      const metadata = this.asMetadata(event.metadata);
      const variant =
        typeof metadata.experimentVariant === "string" ? metadata.experimentVariant : "unknown";
      if (event.event_type === "AI_RECOMMENDATION_GENERATED") {
        acc[variant] = (acc[variant] ?? 0) + 1;
      }
      return acc;
    }, {});
    const variantPerformance = this.buildVariantPerformance(events);

    return {
      generatedAt: new Date().toISOString(),
      sampleSize: events.length,
      counts,
      funnel: {
        generated,
        opened,
        liked,
        dismissed,
        completedChallenges,
        savedSignals,
      },
      rates: {
        openRate: this.safeRate(opened, generated),
        likeRate: this.safeRate(liked, opened),
        dismissRate: this.safeRate(dismissed, opened),
        challengeCompletionRate: this.safeRate(completedChallenges, generated),
      },
      experiment: {
        variants: variantCounts,
        currentVariant: this.getExperimentVariant(userId),
        performance: variantPerformance,
      },
      recentEvents: events.slice(0, 8).map((event) => ({
        eventType: event.event_type,
        createdAt: event.created_at,
      })),
    };
  }

  /**
   * Diagnostico operativo del modulo. No expone secretos; solo confirma si
   * las piezas minimas existen para probar recomendaciones, eventos y progreso.
   */
  async getDiagnostics(userId: string) {
    const checks = await Promise.allSettled([
      this.prisma.profiles.count({ where: { id: userId } }),
      this.prisma.engagement_events.count({ where: { user_id: userId } }),
      this.prisma.engagement_embeddings.count({ where: { user_id: userId } }),
      this.prisma.engagement_challenges.count({ where: { user_id: userId } }),
      this.prisma.engagement_achievements.count({ where: { user_id: userId } }),
      this.prisma.engagement_contents.count({ where: { user_id: userId } }),
      this.prisma.matches.count(),
      this.prisma.courts.count(),
    ]);

    const names = [
      "profile",
      "events",
      "embeddings",
      "challenges",
      "achievements",
      "contents",
      "matches",
      "courts",
    ];

    const databaseChecks = Object.fromEntries(
      checks.map((result, index) => [
        names[index],
        {
          status: result.status === "fulfilled" ? "ok" : "warning",
          count: result.status === "fulfilled" ? result.value : 0,
          message:
            result.status === "fulfilled"
              ? "Disponible"
              : "No se pudo consultar esta tabla o relacion",
        },
      ]),
    );

    const vertexConfigured = Boolean(
      process.env.GOOGLE_CLOUD_PROJECT &&
      process.env.VERTEX_AI_LOCATION &&
      process.env.VERTEX_AI_MODEL_ID &&
      (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    );
    const hasWarnings =
      !vertexConfigured || Object.values(databaseChecks).some((check) => check.status !== "ok");

    return {
      generatedAt: new Date().toISOString(),
      status: hasWarnings ? "warning" : "ok",
      database: databaseChecks,
      vertexAi: {
        status: vertexConfigured ? "ok" : "warning",
        model: process.env.VERTEX_AI_MODEL_ID ?? "not-configured",
        location: process.env.VERTEX_AI_LOCATION ?? "not-configured",
        message: vertexConfigured
          ? "Configuracion local presente"
          : "Faltan variables del servicio de recomendaciones o credenciales locales",
      },
      nextRecommendedAction: hasWarnings
        ? "Revisar configuracion/migraciones antes de validar con usuario real"
        : "Listo para prueba funcional con usuario autenticado",
    };
  }

  /**
   * Devuelve el paquete diario de recomendaciones.
   * Si ya existe para hoy, no llama al generador y evita consumir tokens.
   * Si no existe, genera una sola vez y persiste el snapshot hasta manana.
   */
  async getTodayRecommendationSnapshot(userId: string): Promise<AiRecommendationResponse> {
    const recommendationDate = this.getBogotaDateOnly();
    const now = new Date();

    const existing = await this.prisma.engagement_recommendation_snapshots.findFirst({
      where: {
        user_id: userId,
        recommendation_date: recommendationDate,
        type: "overview",
        language: "es",
        status: "ready",
        expires_at: { gt: now },
      },
      orderBy: { generated_at: "desc" },
    });

    if (existing) {
      const payload = existing.payload as unknown as AiRecommendationResponse;
      // Los primeros snapshots del MVP podian contener retos de app/notificacion.
      // Si detectamos ese texto antiguo, regeneramos para entregar un reto deportivo real.
      if (!this.isLegacyActivationChallenge(payload)) {
        return {
          ...payload,
          metadata: {
            ...payload.metadata,
            cacheStatus: "hit",
            snapshotId: existing.id,
            generatedAt: existing.generated_at.toISOString(),
            expiresAt: existing.expires_at.toISOString(),
          },
        };
      }
    }

    const generated = await this.generateAiRecommendations(userId, {
      type: "overview",
      limit: 6,
      language: "es",
    });

    const expiresAt = this.getNextBogotaMidnight();
    const snapshot = await this.prisma.engagement_recommendation_snapshots.upsert({
      where: {
        user_id_recommendation_date_type_language: {
          user_id: userId,
          recommendation_date: recommendationDate,
          type: "overview",
          language: "es",
        },
      },
      create: {
        user_id: userId,
        recommendation_date: recommendationDate,
        type: "overview",
        language: "es",
        payload: generated as unknown as Prisma.InputJsonValue,
        model: generated.metadata.model,
        experiment_variant: generated.metadata.experimentVariant,
        status: "ready",
        expires_at: expiresAt,
      },
      update: {
        payload: generated as unknown as Prisma.InputJsonValue,
        model: generated.metadata.model,
        experiment_variant: generated.metadata.experimentVariant,
        status: "ready",
        stale_reason: null,
        expires_at: expiresAt,
        generated_at: new Date(),
      },
    });

    return {
      ...generated,
      metadata: {
        ...generated.metadata,
        cacheStatus: "miss",
        snapshotId: snapshot.id,
        generatedAt: snapshot.generated_at.toISOString(),
        expiresAt: snapshot.expires_at.toISOString(),
      },
    };
  }

  /**
   * Job programado para preparar recomendaciones antes de que el usuario entre.
   * Procesa solo usuarios recientes/activos para controlar costos del generador.
   */
  async runDailyRecommendationCron(options: DailyRecommendationCronOptions = {}) {
    const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const recommendationDate = this.getBogotaDateOnly();
    const now = new Date();

    const recentProfiles = await this.prisma.profiles.findMany({
      where: {
        user_role: { not: "BUSINESS" },
        OR: [{ created_at: { gte: cutoff } }, { updated_at: { gte: cutoff } }],
      },
      select: { id: true, preferred_sports: true, onboarding_completed: true },
      take: limit * 2,
    });

    const recentEvents = await this.prisma.engagement_events.findMany({
      where: { created_at: { gte: cutoff } },
      distinct: ["user_id"],
      select: { user_id: true },
      take: limit * 2,
    });

    const candidateIds = new Set<string>([
      ...recentProfiles.map((profile) => profile.id),
      ...recentEvents.map((event) => event.user_id),
    ]);

    const existingSnapshots = await this.prisma.engagement_recommendation_snapshots.findMany({
      where: {
        user_id: { in: [...candidateIds] },
        recommendation_date: recommendationDate,
        type: "overview",
        language: "es",
        status: "ready",
        expires_at: { gt: now },
      },
      select: { user_id: true },
    });
    const usersWithSnapshot = new Set(existingSnapshots.map((snapshot) => snapshot.user_id));

    const eligibleProfiles = await this.prisma.profiles.findMany({
      where: {
        id: { in: [...candidateIds].filter((userId) => !usersWithSnapshot.has(userId)) },
        user_role: { not: "BUSINESS" },
      },
      select: {
        id: true,
        preferred_sports: true,
        onboarding_completed: true,
      },
      take: limit,
    });

    const eligibleUsers = eligibleProfiles
      .filter(
        (profile) =>
          profile.onboarding_completed === true || (profile.preferred_sports?.length ?? 0) > 0,
      )
      .slice(0, limit);

    if (options.dryRun) {
      return {
        mode: "dry-run",
        cutoff,
        recommendationDate,
        candidates: candidateIds.size,
        skippedExistingSnapshot: usersWithSnapshot.size,
        eligible: eligibleUsers.length,
        generated: 0,
        failed: 0,
      };
    }

    const results: Array<{ userId: string; status: "generated" | "failed"; error?: string }> = [];
    for (const user of eligibleUsers) {
      try {
        await this.getTodayRecommendationSnapshot(user.id);
        results.push({ userId: user.id, status: "generated" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Cron diario de Engagement fallo para ${user.id}: ${message}`);
        results.push({ userId: user.id, status: "failed", error: message });
      }
    }

    return {
      mode: "execute",
      cutoff,
      recommendationDate,
      candidates: candidateIds.size,
      skippedExistingSnapshot: usersWithSnapshot.size,
      eligible: eligibleUsers.length,
      generated: results.filter((result) => result.status === "generated").length,
      failed: results.filter((result) => result.status === "failed").length,
      results,
    };
  }

  /**
   * Convierte una recomendacion personalizada en una notificacion in-app real.
   * La notificacion lleva al Home porque ahi vive el resumen deportivo para el usuario.
   */
  async saveSmartNotification(userId: string, dto: SaveSmartNotificationDto) {
    const notification = await this.prisma.notifications.create({
      data: {
        user_id: userId,
        type: "MATCH_ALERT",
        title: dto.title,
        content: dto.body,
        link: "/app",
        is_read: false,
      },
    });

    await this.recordEvent(userId, {
      eventType: "SMART_NOTIFICATION_SAVED",
      entityType: "smart_notification",
      entityId: notification.id,
      dedupeKey: `smart-notification:${userId}:${notification.id}`,
      metadata: {
        title: dto.title,
        source: dto.source ?? "engagement_page",
      },
    });

    return notification;
  }

  /**
   * Persiste un reto diario para que el usuario pueda retomarlo y completarlo.
   * Ademas registra la senal historica que alimenta analytics y recomendaciones.
   */
  async saveChallenge(userId: string, dto: SaveEngagementChallengeDto) {
    const challenge = await this.prisma.engagement_challenges.create({
      data: {
        user_id: userId,
        title: dto.title,
        description: dto.description,
        reward_hint: dto.rewardHint,
        status: "started",
        source: "engagement_page",
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.recordEvent(userId, {
      eventType: "DAILY_CHALLENGE_STARTED",
      entityType: "engagement_challenge",
      entityId: challenge.id,
      metadata: {
        title: dto.title,
        source: "engagement_page",
      },
    });

    return challenge;
  }

  async listChallenges(userId: string) {
    return this.prisma.engagement_challenges.findMany({
      where: { user_id: userId },
      orderBy: { started_at: "desc" },
      take: 12,
    });
  }

  /**
   * Muestra a la empresa los retos que usuarios asignaron a sus sedes.
   * La relacion se guarda en metadata.selectedVenueId para no crear una tabla extra en el MVP.
   */
  async listBusinessVenueChallenges(businessId: string) {
    const venues = await this.prisma.courts.findMany({
      where: { owner_id: businessId },
      select: {
        id: true,
        name: true,
        sport: true,
        district: true,
        address: true,
      },
    });
    const venueById = new Map(venues.map((venue) => [venue.id, venue]));

    if (venueById.size === 0) return [];

    const recentChallenges = await this.prisma.engagement_challenges.findMany({
      orderBy: { started_at: "desc" },
      take: 150,
      select: {
        id: true,
        user_id: true,
        title: true,
        description: true,
        reward_hint: true,
        status: true,
        source: true,
        metadata: true,
        started_at: true,
        completed_at: true,
      },
    });

    const venueChallenges = recentChallenges
      .map((challenge) => {
        const metadata = this.asVenueChallengeMetadata(challenge.metadata);
        const venue = metadata.selectedVenueId ? venueById.get(metadata.selectedVenueId) : null;
        return venue ? { challenge, metadata, venue } : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const userIds = [...new Set(venueChallenges.map((item) => item.challenge.user_id))];
    const users = await this.prisma.profiles.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatar_url: true,
        city: true,
        level: true,
        preferred_sports: true,
      },
    });
    const userById = new Map(users.map((profile) => [profile.id, profile]));

    return venueChallenges.map(({ challenge, metadata, venue }) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      reward_hint: challenge.reward_hint,
      status: challenge.status,
      validationStatus: metadata.validationStatus ?? "pending",
      validationNote: metadata.validationNote ?? null,
      rewardFitcoins: this.getChallengeReward(metadata),
      started_at: challenge.started_at,
      completed_at: challenge.completed_at,
      metadata,
      user: userById.get(challenge.user_id) ?? null,
      venue,
    }));
  }

  /**
   * Permite a la empresa aprobar/rechazar un reto asociado a una sede propia.
   * Al aprobar, se suman FitCoins y se crea un trofeo desbloqueado para el perfil.
   */
  async updateBusinessVenueChallengeStatus(
    businessId: string,
    challengeId: string,
    dto: UpdateBusinessChallengeValidationDto,
  ) {
    const challenge = await this.prisma.engagement_challenges.findUniqueOrThrow({
      where: { id: challengeId },
    });
    const metadata = this.asVenueChallengeMetadata(challenge.metadata);

    if (!metadata.selectedVenueId) {
      throw new Error("El reto no tiene una sede seleccionada para validar.");
    }

    const venue = await this.prisma.courts.findFirst({
      where: { id: metadata.selectedVenueId, owner_id: businessId },
      select: { id: true, name: true },
    });

    if (!venue) {
      throw new Error("No tienes permisos para validar retos de esta sede.");
    }

    const nowIso = new Date().toISOString();
    const nextMetadata: VenueChallengeMetadata = {
      ...metadata,
      validationStatus: dto.status,
      validationNote: dto.note,
      validatedAt: nowIso,
      validatedByBusinessId: businessId,
      retryAllowed: dto.status === "rejected",
    };

    if (dto.status === "rejected") {
      nextMetadata.rejectedAt = nowIso;
    }

    const shouldGrantReward = dto.status === "approved" && !metadata.rewardGrantedAt;
    const rewardFitcoins = this.getChallengeReward(metadata);
    const trophyName = this.getChallengeTrophyName(challenge.title, metadata);

    const updatedChallenge = await this.prisma.$transaction(async (tx) => {
      if (shouldGrantReward) {
        // La transaccion queda como fuente auditable para que el balance acumulado se sincronice.
        await tx.wallet_transactions.create({
          data: {
            user_id: challenge.user_id,
            amount: rewardFitcoins,
            type: "EARN",
            description: `Reto validado en ${venue.name}: ${challenge.title}`,
          },
        });

        await tx.engagement_achievements.create({
          data: {
            user_id: challenge.user_id,
            name: trophyName,
            description: `Trofeo obtenido por completar un reto validado por ${venue.name}.`,
            unlock_condition: `Empresa valida cumplimiento en ${venue.name}.`,
            status: "unlocked",
            source: "business_validation",
            unlocked_at: new Date(),
            metadata: {
              challengeId: challenge.id,
              venueId: venue.id,
              venueName: venue.name,
              rewardFitcoins,
            } as Prisma.InputJsonValue,
          },
        });

        nextMetadata.rewardGrantedAt = nowIso;
      }

      return tx.engagement_challenges.update({
        where: { id: challenge.id },
        data: {
          status:
            dto.status === "approved"
              ? "completed"
              : dto.status === "rejected"
                ? "dismissed"
                : "started",
          completed_at: dto.status === "approved" ? new Date() : null,
          metadata: nextMetadata as Prisma.InputJsonValue,
        },
      });
    });

    await this.recordEvent(challenge.user_id, {
      eventType: dto.status === "approved" ? "CHALLENGE_COMPLETED" : "DAILY_CHALLENGE_STARTED",
      entityType: "engagement_challenge",
      entityId: challenge.id,
      dedupeKey: `business-validation:${challenge.id}:${dto.status}:${nowIso}`,
      metadata: {
        validationStatus: dto.status,
        venueId: venue.id,
        venueName: venue.name,
        rewardFitcoins: shouldGrantReward ? rewardFitcoins : 0,
      },
    });

    return updatedChallenge;
  }

  /**
   * Marca un reto persistido como completado. La condicion por user_id evita
   * completar retos de otro usuario aunque se conozca el id.
   */
  async completeChallenge(userId: string, challengeId: string) {
    await this.prisma.engagement_challenges.updateMany({
      where: { id: challengeId, user_id: userId },
      data: {
        status: "completed",
        completed_at: new Date(),
      },
    });
    const challenge = await this.prisma.engagement_challenges.findFirstOrThrow({
      where: { id: challengeId, user_id: userId },
    });

    await this.recordEvent(userId, {
      eventType: "CHALLENGE_COMPLETED",
      entityType: "engagement_challenge",
      entityId: challenge.id,
      metadata: {
        title: challenge.title,
        source: "engagement_page",
      },
    });

    return challenge;
  }

  /**
   * Persiste un logro sugerido por recomendaciones. Guardarlo no significa desbloquearlo:
   * solo crea el objetivo para que luego reglas reales puedan completarlo.
   */
  async saveAchievement(userId: string, dto: SaveEngagementAchievementDto) {
    const achievement = await this.prisma.engagement_achievements.create({
      data: {
        user_id: userId,
        name: dto.name,
        description: dto.description,
        unlock_condition: dto.unlockCondition,
        status: "saved",
        source: "engagement_page",
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.recordEvent(userId, {
      eventType: "ACHIEVEMENT_SAVED",
      entityType: "engagement_achievement",
      entityId: achievement.id,
      metadata: {
        name: dto.name,
        unlockCondition: dto.unlockCondition,
        source: "engagement_page",
      },
    });

    return achievement;
  }

  async listAchievements(userId: string) {
    return this.prisma.engagement_achievements.findMany({
      where: { user_id: userId },
      orderBy: { saved_at: "desc" },
      take: 12,
    });
  }

  /**
   * Evalua logros guardados contra senales reales del usuario.
   * En MVP usamos reglas explicables: actividad reciente, retos completados
   * y cantidad de interacciones privadas registradas.
   */
  async evaluateAchievements(userId: string) {
    const [savedAchievements, events, completedChallenges] = await Promise.all([
      this.prisma.engagement_achievements.findMany({
        where: { user_id: userId, status: "saved" },
        orderBy: { saved_at: "asc" },
        take: 20,
      }),
      this.prisma.engagement_events.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 200,
        select: { event_type: true, created_at: true },
      }),
      this.prisma.engagement_challenges.count({
        where: { user_id: userId, status: "completed" },
      }),
    ]);

    const unlockable = savedAchievements.filter((achievement) =>
      this.shouldUnlockAchievement(achievement.unlock_condition, events, completedChallenges),
    );

    const unlocked = await Promise.all(
      unlockable.map((achievement) =>
        this.prisma.engagement_achievements.update({
          where: { id: achievement.id },
          data: {
            status: "unlocked",
            unlocked_at: new Date(),
          },
        }),
      ),
    );

    for (const achievement of unlocked) {
      await this.recordEvent(userId, {
        eventType: "ACHIEVEMENT_UNLOCKED",
        entityType: "engagement_achievement",
        entityId: achievement.id,
        dedupeKey: `achievement-unlocked:${userId}:${achievement.id}`,
        metadata: {
          name: achievement.name,
          unlockCondition: achievement.unlock_condition,
        },
      });
    }

    return {
      evaluated: savedAchievements.length,
      unlockedCount: unlocked.length,
      achievements: unlocked,
    };
  }

  /**
   * Persiste contenido largo de recomendaciones. A diferencia de una notificacion,
   * este registro vive en Engagement AI para consultarlo como historial propio.
   */
  async saveContent(userId: string, dto: SaveEngagementContentDto) {
    const content = await this.prisma.engagement_contents.create({
      data: {
        user_id: userId,
        content_type: dto.contentType,
        title: dto.title,
        body: dto.body,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.recordEvent(userId, {
      eventType: "ENGAGEMENT_CONTENT_SAVED",
      entityType: "engagement_content",
      entityId: content.id,
      metadata: {
        contentType: content.content_type,
        source: content.source,
      },
    });

    return content;
  }

  async listContents(userId: string) {
    return this.prisma.engagement_contents.findMany({
      where: { user_id: userId },
      orderBy: { saved_at: "desc" },
      take: 12,
    });
  }

  /**
   * Genera una respuesta de personalizacion usando datos reales como contexto
   * y Vertex AI como capa generativa. La IA no recibe texto completo de posts:
   * solo señales estructuradas, afinidades y candidatos pre-filtrados.
   */
  async generateAiRecommendations(
    userId: string,
    dto: AiRecommendationRequestDto,
  ): Promise<AiRecommendationResponse> {
    const limit = dto.limit ?? 6;
    const language = dto.language ?? "es";
    const engagementProfile = await this.getProfile(userId);
    const context = await this.buildRecommendationContext(userId, limit);
    const experimentVariant = this.getExperimentVariant(userId);
    const rankingSignals = await this.getRankingSignals(userId);
    const deterministicCards = this.applyPersonalizedRanking(
      this.buildDeterministicCards(context, limit * 2),
      rankingSignals,
    ).slice(0, limit);

    const prompt = this.buildRecommendationPrompt({
      type: dto.type ?? "overview",
      limit,
      language,
      engagementProfile,
      context,
      deterministicCards,
    });

    const startedAt = Date.now();
    let result: { text: string; tokens: number; model: string; latencyMs: number };
    let aiPayload: Omit<AiRecommendationResponse, "metadata">;

    try {
      result = await this.vertexAiService.generateContent(prompt, {
        language,
        temperature: 0.55,
      });
      aiPayload = this.parseRecommendationJson(result.text, deterministicCards, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Vertex AI no disponible para recomendaciones; usando fallback deterministico: ${message}`,
      );

      // Fallback para MVP/local: si Vertex no tiene billing, permisos o cuota,
      // igual devolvemos recomendaciones explicables calculadas con datos reales.
      result = {
        text: "",
        tokens: 0,
        model: "deterministic-engagement-fallback",
        latencyMs: Date.now() - startedAt,
      };
      aiPayload = this.buildFallbackRecommendationPayload(deterministicCards, context);
    }

    await this.recordEvent(userId, {
      eventType: "AI_RECOMMENDATION_GENERATED",
      entityType: "engagement_ai",
      entityId: `recommend-${Date.now()}`,
      metadata: {
        type: dto.type ?? "overview",
        limit,
        model: result.model,
        candidateCount: context.players.length + context.matches.length + context.courts.length,
        experimentVariant,
      },
    });

    const filteredRecommendations = this.filterCardsByRequestType(
      aiPayload.recommendations,
      dto.type ?? "overview",
    );

    return {
      ...aiPayload,
      recommendations: filteredRecommendations.slice(0, limit),
      metadata: {
        model: result.model,
        latencyMs: result.latencyMs,
        tokens: result.tokens,
        algorithmVersion: "engagement-ai-v1",
        experimentVariant,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Variante estable por usuario para pruebas A/B simples.
   * A prioriza compatibilidad; B permite observar exploracion y contenido.
   */
  private getExperimentVariant(userId: string): "A_COMPATIBILITY" | "B_EXPLORATION" {
    const checksum = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return checksum % 2 === 0 ? "A_COMPATIBILITY" : "B_EXPLORATION";
  }

  private asMetadata(value: Prisma.JsonValue): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private asVenueChallengeMetadata(value: Prisma.JsonValue): VenueChallengeMetadata {
    return this.asMetadata(value) as VenueChallengeMetadata;
  }

  private getChallengeReward(metadata: VenueChallengeMetadata): number {
    return typeof metadata.rewardFitcoins === "number" && metadata.rewardFitcoins > 0
      ? Math.min(Math.round(metadata.rewardFitcoins), 120)
      : 50;
  }

  private getChallengeTrophyName(title: string, metadata: VenueChallengeMetadata): string {
    return typeof metadata.trophyName === "string" && metadata.trophyName.trim()
      ? metadata.trophyName.trim()
      : `Trofeo ${title.slice(0, 70)}`;
  }

  private safeRate(numerator: number, denominator: number): number {
    if (!denominator) return 0;
    return Number(((numerator / denominator) * 100).toFixed(1));
  }

  /**
   * Agrupa el embudo por variante A/B. Si un evento antiguo no trae variante,
   * queda en "unknown" para no perder trazabilidad historica.
   */
  private buildVariantPerformance(
    events: Array<{ event_type: string; metadata: Prisma.JsonValue }>,
  ): Record<
    string,
    {
      generated: number;
      opened: number;
      liked: number;
      dismissed: number;
      openRate: number;
      likeRate: number;
      dismissRate: number;
    }
  > {
    const performance: Record<
      string,
      { generated: number; opened: number; liked: number; dismissed: number }
    > = {};

    for (const event of events) {
      const metadata = this.asMetadata(event.metadata);
      const variant =
        typeof metadata.experimentVariant === "string" ? metadata.experimentVariant : "unknown";
      performance[variant] ??= { generated: 0, opened: 0, liked: 0, dismissed: 0 };

      if (event.event_type === "AI_RECOMMENDATION_GENERATED") performance[variant].generated += 1;
      if (event.event_type === "AI_RECOMMENDATION_OPENED") performance[variant].opened += 1;
      if (event.event_type === "AI_RECOMMENDATION_LIKED") performance[variant].liked += 1;
      if (event.event_type === "AI_RECOMMENDATION_DISMISSED") performance[variant].dismissed += 1;
    }

    return Object.fromEntries(
      Object.entries(performance).map(([variant, data]) => [
        variant,
        {
          ...data,
          openRate: this.safeRate(data.opened, data.generated),
          likeRate: this.safeRate(data.liked, data.opened),
          dismissRate: this.safeRate(data.dismissed, data.opened),
        },
      ]),
    );
  }

  /**
   * Lee feedback y embedding local para ajustar el ranking antes de llamar al LLM.
   * Esto hace que el motor aprenda de "me interesa" y "no me sirve".
   */
  private async getRankingSignals(userId: string): Promise<RankingSignals> {
    const [feedbackEvents, embedding] = await Promise.all([
      this.prisma.engagement_events.findMany({
        where: {
          user_id: userId,
          event_type: {
            in: ["AI_RECOMMENDATION_LIKED", "AI_RECOMMENDATION_DISMISSED"],
          },
        },
        orderBy: { created_at: "desc" },
        take: 100,
        select: { event_type: true, metadata: true },
      }),
      this.prisma.engagement_embeddings.findUnique({
        where: { user_id: userId },
        select: { embedding_vector: true },
      }),
    ]);

    const likedTypes = new Set<string>();
    const dismissedTypes = new Set<string>();
    for (const event of feedbackEvents) {
      const metadata = this.asMetadata(event.metadata);
      const cardType = typeof metadata.cardType === "string" ? metadata.cardType : "";
      if (!cardType) continue;
      if (event.event_type === "AI_RECOMMENDATION_LIKED") likedTypes.add(cardType);
      if (event.event_type === "AI_RECOMMENDATION_DISMISSED") dismissedTypes.add(cardType);
    }

    return {
      likedTypes,
      dismissedTypes,
      embeddingVector: embedding?.embedding_vector ?? [],
    };
  }

  /**
   * Reordena tarjetas con señales personales. Es deliberadamente explicable:
   * agrega motivos visibles cuando el score sube o baja por feedback/embedding.
   */
  private applyPersonalizedRanking(
    cards: RecommendationCard[],
    signals: RankingSignals,
  ): RecommendationCard[] {
    return cards
      .map((card) => {
        let score = card.score;
        const reasons = [...card.reasons];

        if (signals.likedTypes.has(card.type)) {
          score += 8;
          reasons.push("Sube porque marcaste recomendaciones similares como interesantes");
        }

        if (signals.dismissedTypes.has(card.type)) {
          score -= 10;
          reasons.push("Baja porque marcaste recomendaciones similares como poco utiles");
        }

        if (signals.embeddingVector.length > 0) {
          const embeddingBoost = Math.round(
            Math.abs(
              signals.embeddingVector[card.id.length % signals.embeddingVector.length] ?? 0,
            ) * 6,
          );
          score += embeddingBoost;
          if (embeddingBoost > 0) {
            reasons.push("Ajustada con tu huella vectorial privada");
          }
        }

        return {
          ...card,
          score: Math.max(0, Math.min(100, Math.round(score))),
          reasons: reasons.slice(0, 4),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private eventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      POST_CREATED: 2,
      RECOMMENDATION_VIEWED: 1,
      PLAYER_CONNECTED: 4,
      PLAYER_DISMISSED: -1,
      MATCH_JOINED: 5,
      MATCH_COMPLETED: 8,
      SPORT_SELECTED: 3,
      DAILY_CHALLENGE_STARTED: 2,
      CHALLENGE_COMPLETED: 4,
      ACHIEVEMENT_SAVED: 3,
      ACHIEVEMENT_UNLOCKED: 6,
      SMART_NOTIFICATION_SAVED: 2,
      TOUR_NARRATIVE_SAVED: 2,
      ENGAGEMENT_CONTENT_SAVED: 2,
      ENGAGEMENT_EMBEDDING_REBUILT: 1,
      AI_RECOMMENDATION_OPENED: 1,
      AI_RECOMMENDATION_LIKED: 4,
      AI_RECOMMENDATION_DISMISSED: -2,
    };
    return weights[eventType] ?? 0;
  }

  /**
   * Crea un vector estable y normalizado desde texto estructurado.
   * No intenta simular semantica real; solo permite persistir una huella
   * comparable para probar el pipeline antes de activar embeddings reales.
   */
  private buildDeterministicEmbedding(input: string, dimensions: number): number[] {
    const vector = Array.from({ length: dimensions }, () => 0);
    for (let index = 0; index < input.length; index += 1) {
      const bucket = index % dimensions;
      const charCode = input.charCodeAt(index);
      vector[bucket] += ((charCode % 31) - 15) / 15;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => Number((value / magnitude).toFixed(6)));
  }

  /**
   * Interpreta condiciones generadas por IA de manera defensiva.
   * Si la condicion menciona un numero, exigimos al menos esa cantidad de senales.
   */
  private shouldUnlockAchievement(
    unlockCondition: string | null,
    events: Array<{ event_type: string; created_at: Date }>,
    completedChallenges: number,
  ): boolean {
    if (events.length === 0 && completedChallenges === 0) return false;

    const normalizedCondition = (unlockCondition ?? "").toLowerCase();
    const requestedAmount = Number(normalizedCondition.match(/\d+/)?.[0] ?? 1);
    const meaningfulEvents = events.filter((event) =>
      [
        "PLAYER_CONNECTED",
        "MATCH_JOINED",
        "MATCH_COMPLETED",
        "AI_RECOMMENDATION_OPENED",
        "AI_RECOMMENDATION_LIKED",
        "ENGAGEMENT_CONTENT_SAVED",
      ].includes(event.event_type),
    );

    if (normalizedCondition.includes("reto")) {
      return completedChallenges >= Math.max(1, requestedAmount);
    }

    if (normalizedCondition.includes("semana")) {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return meaningfulEvents.some((event) => event.created_at.getTime() >= weekAgo);
    }

    return meaningfulEvents.length + completedChallenges >= Math.max(1, requestedAmount);
  }

  /**
   * Los filtros visuales no deben depender totalmente del LLM. Aplicamos una
   * capa deterministica para que "Retos", "Logros" y demas siempre sean coherentes.
   */
  private filterCardsByRequestType(
    cards: RecommendationCard[],
    type: AiRecommendationRequestDto["type"],
  ): RecommendationCard[] {
    if (!type || type === "overview") return cards;
    const allowedByType: Record<
      Exclude<AiRecommendationRequestDto["type"], undefined | "overview">,
      RecommendationCard["type"][]
    > = {
      players: ["player"],
      sports: ["sport"],
      challenges: ["challenge"],
      achievements: ["achievement"],
      content: ["content", "venue"],
    };
    const allowed = allowedByType[type];
    return cards.filter((card) => allowed.includes(card.type));
  }

  /**
   * Respuesta de respaldo para pruebas locales o ambientes sin generador disponible.
   * No inventa entidades: usa las tarjetas ya calculadas con perfiles, partidos y canchas reales.
   */
  private buildFallbackRecommendationPayload(
    deterministicCards: RecommendationCard[],
    context: Awaited<ReturnType<EngagementService["buildRecommendationContext"]>>,
  ): Omit<AiRecommendationResponse, "metadata"> {
    const topDistrict = context.profile?.city ?? context.courts[0]?.district ?? "tu zona";
    const dailyChallenge = this.buildProceduralDailyChallenge(context);

    return {
      summary:
        "El servicio de recomendaciones no esta disponible en este momento, asi que se muestran sugerencias calculadas con datos reales de SportMatch.",
      recommendations:
        deterministicCards.length > 0
          ? deterministicCards
          : [
              {
                id: "fallback-activity",
                type: "challenge",
                title: "Completa tu actividad deportiva",
                description:
                  "Agrega deportes, conecta con jugadores o unete a un partido para mejorar tus recomendaciones.",
                score: 60,
                reasons: ["Faltan senales de actividad para personalizar mejor"],
                actionLabel: "Explorar",
              },
            ],
      dailyChallenge: {
        title: dailyChallenge.title,
        description: dailyChallenge.description,
        rewardHint: dailyChallenge.rewardHint,
      },
      achievementIdea: {
        name: `Explorador deportivo de ${topDistrict}`,
        description: "Reconoce a usuarios que prueban sedes, jugadores o partidos en su zona.",
        unlockCondition: "Interactuar con 3 recomendaciones reales en una semana.",
      },
      weeklyBrief:
        "Todavia estamos reuniendo senales de actividad. Mientras mas partidos, conexiones y deportes registres, mas preciso sera el motor.",
      tourNarrative: `Tu recorrido deportivo empieza en ${topDistrict}. El siguiente paso es convertir una recomendacion en una actividad real.`,
      notificationDraft: {
        title: "Tienes nuevas recomendaciones deportivas",
        body: "Revisa jugadores, partidos y sedes compatibles con tu perfil.",
      },
    };
  }

  /**
   * Genera retos deportivos procedurales cuando la IA no responde o devuelve texto generico.
   * La variacion usa usuario + fecha local para que cambie por dia sin gastar tokens extra.
   */
  private buildProceduralDailyChallenge(
    context: Awaited<ReturnType<EngagementService["buildRecommendationContext"]>>,
  ): AiRecommendationResponse["dailyChallenge"] {
    const sport =
      context.profile?.preferred_sports?.find((item) => this.isPhysicalSport(item)) ??
      context.matches.find((match) => this.isPhysicalSport(match.sport))?.sport ??
      context.courts.find((court) => this.isPhysicalSport(court.sport))?.sport ??
      "entrenamiento fisico";
    const district = context.profile?.city ?? context.courts[0]?.district ?? "tu zona";
    const court = context.courts.find((item) => this.isPhysicalSport(item.sport));
    const match = context.matches.find((item) => this.isPhysicalSport(item.sport));
    const player = context.players.find((item) =>
      item.sharedSports.some((sharedSport) => this.isPhysicalSport(sharedSport)),
    );
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const seed = `${context.profile?.id ?? "guest"}-${dateKey}-${sport}`;
    const index =
      [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      this.getDailyChallengeVariants(sport, district, court, match, player).length;

    return this.getDailyChallengeVariants(sport, district, court, match, player)[index];
  }

  private isPhysicalSport(sport: string | null | undefined): boolean {
    const normalized = (sport ?? "").toLowerCase();
    if (!normalized) return false;
    const nonPhysicalKeywords = [
      "e-sport",
      "esport",
      "gaming",
      "videojuego",
      "valorant",
      "lol",
      "league of legends",
      "dota",
      "counter",
      "fortnite",
      "fifa",
      "fc 24",
      "rocket league",
      "iracing",
      "i racing",
      "simracing",
      "sim racing",
      "f1 sim",
      "f1sim",
      "formula 1 sim",
      "simulador",
      "simulator",
      "simulation",
      "gran turismo",
      "assetto",
    ];
    return !nonPhysicalKeywords.some((keyword) => normalized.includes(keyword));
  }

  private getDailyChallengeVariants(
    sport: string,
    district: string,
    court: { name: string | null; district: string | null } | undefined,
    match:
      | { title: string; sport: string; date: Date | string; time: Date | string | null }
      | undefined,
    player: { name: string | null; sharedSports: string[] } | undefined,
  ): Array<AiRecommendationResponse["dailyChallenge"]> {
    return [
      {
        title: `Circuito de precision ${sport}`,
        description: `Completa 3 bloques de 8 minutos: calentamiento tecnico, repeticion de una habilidad clave y reto final de 10 intentos medibles. El objetivo es registrar al menos 7 ejecuciones limpias sin forzar intensidad.`,
        rewardHint: "+55 FitCoins sugeridos si completas el circuito y registras el resultado.",
      },
      {
        title: `Mision sede testigo`,
        description: `Elige una sede deportiva disponible desde el mapa de SportMatch. Realiza 25 minutos de ${sport}: 8 de entrada en calor, 12 de tecnica y 5 de cierre. La empresa elegida valida asistencia y cumplimiento.`,
        rewardHint: "+50 FitCoins sugeridos cuando la empresa valide la actividad.",
      },
      {
        title: `Reto ritmo de partido`,
        description: match
          ? `Usa "${match.title}" como objetivo: antes del ${this.formatMatchDate(match.date)} a las ${this.formatMatchTime(match.time)}, completa una sesion de preparacion con 10 minutos de movilidad, 15 de tecnica y 5 jugadas o intentos finales medibles.`
          : `Prepara tu proximo partido de ${sport}: 10 minutos de movilidad, 15 de tecnica y 5 jugadas o intentos finales medibles. El reto se cumple si anotas tu mejor resultado.`,
        rewardHint: "+60 FitCoins sugeridos si conviertes la preparacion en actividad real.",
      },
      {
        title: "Reto dupla tactica",
        description: player
          ? `Invita a ${player.name ?? "un jugador compatible"} a una practica corta de ${player.sharedSports[0] ?? sport}: 5 minutos de objetivo comun, 15 minutos de ejercicio alternado y 5 minutos para comparar resultados.`
          : `Haz una practica tipo dupla en ${sport}: define un objetivo, completa 15 minutos de ejercicio alternado y registra que mejorarias para el siguiente encuentro.`,
        rewardHint: "+45 FitCoins sugeridos por completar un reto colaborativo.",
      },
      {
        title: `Marca personal segura en ${sport}`,
        description: `Elige una metrica simple de ${sport}: aciertos, tiempo controlado, vueltas suaves o repeticiones tecnicas. Haz 2 rondas, descansa 2 minutos entre rondas y busca mejorar solo un 10% sin excederte.`,
        rewardHint: "+55 FitCoins sugeridos por registrar una mejora medible.",
      },
    ];
  }

  private async buildRecommendationContext(userId: string, limit: number) {
    const [profile, players, matches, courts, recentEvents] = await Promise.all([
      this.prisma.profiles.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          city: true,
          level: true,
          trust_score: true,
          preferred_sports: true,
          matches_played: true,
          last_location_lat: true,
          last_location_lng: true,
          sport_preferences: true,
        },
      }),
      this.prisma.profiles.findMany({
        where: { id: { not: userId }, user_role: { not: "BUSINESS" } },
        select: {
          id: true,
          name: true,
          city: true,
          level: true,
          trust_score: true,
          preferred_sports: true,
          matches_played: true,
          last_location_lat: true,
          last_location_lng: true,
        },
        take: Math.max(limit * 4, 20),
      }),
      this.prisma.matches.findMany({
        where: { status: { not: "CANCELLED" } },
        select: {
          id: true,
          title: true,
          sport: true,
          date: true,
          time: true,
          required_level: true,
          max_players: true,
          creator_id: true,
        },
        orderBy: { created_at: "desc" },
        take: Math.max(limit * 2, 10),
      }),
      this.prisma.courts.findMany({
        where: { is_available: true },
        select: {
          id: true,
          name: true,
          sport: true,
          district: true,
          rating: true,
          price_per_hour: true,
          is_sponsored: true,
        },
        orderBy: [{ rating: "desc" }, { reviews_count: "desc" }],
        take: Math.max(limit * 2, 10),
      }),
      this.prisma.engagement_events.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 25,
        select: { event_type: true, entity_type: true, metadata: true, created_at: true },
      }),
    ]);

    const currentSports = new Set(profile?.preferred_sports ?? []);
    const rankedPlayers = players
      .map((player) => ({
        ...player,
        compatibilityScore: this.scorePlayer(profile, player),
        sharedSports: player.preferred_sports.filter((sport) => currentSports.has(sport)),
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    const currentLevelLabel = this.normalizeLevel(profile?.level);
    const rankedMatches = matches
      .map((match) => ({
        ...match,
        compatibilityScore:
          (currentSports.has(match.sport) ? 55 : 15) +
          (currentLevelLabel === this.normalizeLevel(match.required_level) ? 25 : 5),
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    const relatedSports = this.buildCrossSportSuggestions(profile, players, matches, courts).slice(
      0,
      limit,
    );

    return {
      profile,
      players: rankedPlayers,
      matches: rankedMatches,
      courts,
      relatedSports,
      recentEvents: recentEvents.map((event) => ({
        eventType: event.event_type,
        entityType: event.entity_type,
        metadata: this.asMetadata(event.metadata),
        createdAt: event.created_at,
      })),
    };
  }

  private buildDeterministicCards(
    context: Awaited<ReturnType<EngagementService["buildRecommendationContext"]>>,
    limit: number,
  ): RecommendationCard[] {
    const cards: RecommendationCard[] = [];

    for (const player of context.players.slice(0, 3)) {
      cards.push({
        id: `player-${player.id}`,
        type: "player",
        title: player.name ?? "Jugador recomendado",
        description: `Compatibilidad deportiva estimada: ${player.compatibilityScore}%.`,
        score: player.compatibilityScore,
        reasons: [
          player.sharedSports.length > 0
            ? `Comparten ${player.sharedSports.join(", ")}`
            : "Tiene actividad deportiva compatible",
          player.level ? `Nivel ${this.normalizeLevel(player.level)}` : "Nivel por confirmar",
          player.city ? `Zona: ${player.city}` : "Ubicacion por confirmar",
        ],
        actionLabel: "Ver perfil",
        entityId: player.id,
        metadata: { sharedSports: player.sharedSports },
      });
    }

    for (const match of context.matches.slice(0, 2)) {
      cards.push({
        id: `match-${match.id}`,
        type: "challenge",
        title: match.title,
        description: `${match.sport} el ${this.formatMatchDate(match.date)} a las ${this.formatMatchTime(
          match.time,
        )}.`,
        score: match.compatibilityScore,
        reasons: [`Deporte: ${match.sport}`, `Nivel requerido: ${match.required_level}`],
        actionLabel: "Ver partido",
        entityId: match.id,
      });
    }

    const preferredCourt = context.courts[0];
    if (preferredCourt) {
      cards.push({
        id: `venue-${preferredCourt.id}`,
        type: "venue",
        title: preferredCourt.name,
        description: `${preferredCourt.sport} en ${preferredCourt.district ?? "zona por confirmar"}.`,
        score: Math.round((preferredCourt.rating ?? 4) * 20),
        reasons: [`Rating ${preferredCourt.rating}`, `Precio S/ ${preferredCourt.price_per_hour}`],
        actionLabel: "Ver cancha",
        entityId: preferredCourt.id,
      });
    }

    const preferredSport = context.profile?.preferred_sports?.[0] ?? context.matches[0]?.sport;
    if (preferredSport) {
      cards.push({
        id: `sport-${preferredSport.toLowerCase()}`,
        type: "sport",
        title: `Impulsa tu semana de ${preferredSport}`,
        description:
          "Actividad sugerida a partir de tus deportes preferidos y oportunidades cercanas.",
        score: 72,
        reasons: [
          "Basado en tus preferencias deportivas",
          "Ayuda a mejorar futuras recomendaciones",
        ],
        actionLabel: "Explorar",
        metadata: { sport: preferredSport },
      });
    }

    for (const suggestion of context.relatedSports.slice(0, 2)) {
      cards.push({
        id: `cross-sport-${suggestion.sport.toLowerCase().replace(/\s+/g, "-")}`,
        type: "sport",
        title: `Prueba ${suggestion.sport}`,
        description:
          "Deporte sugerido por patrones de usuarios parecidos, partidos activos y sedes disponibles.",
        score: suggestion.score,
        reasons: suggestion.reasons,
        actionLabel: "Explorar deporte",
        metadata: {
          sport: suggestion.sport,
          source: "cross_sport_recommender",
        },
      });
    }

    cards.push({
      id: "achievement-weekly-activation",
      type: "achievement",
      title: "Logro sugerido: Semana en movimiento",
      description:
        "Completa una accion deportiva esta semana para alimentar tu historial de engagement.",
      score: 68,
      reasons: ["Premia actividad constante", "No depende de IA externa para calcularse"],
      actionLabel: "Guardar logro",
      metadata: { unlockCondition: "Registrar una accion deportiva durante la semana" },
    });

    return cards.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Recomendador cross-sport del MVP.
   * Combina co-ocurrencia en perfiles similares, partidos activos y sedes reales
   * para sugerir deportes nuevos sin depender solo del LLM.
   */
  private buildCrossSportSuggestions(
    profile: {
      city: string | null;
      level: number | null;
      preferred_sports: string[];
    } | null,
    players: Array<{
      city: string | null;
      level: number | null;
      preferred_sports: string[];
    }>,
    matches: Array<{ sport: string }>,
    courts: Array<{ sport: string | null; district: string | null; rating: number | null }>,
  ): CrossSportSuggestion[] {
    const currentSports = new Set(profile?.preferred_sports ?? []);
    const scores = new Map<string, { score: number; reasons: Set<string> }>();

    const addSignal = (sport: string | null | undefined, points: number, reason: string) => {
      const normalizedSport = sport?.trim();
      if (!normalizedSport || currentSports.has(normalizedSport)) return;

      const current = scores.get(normalizedSport) ?? { score: 0, reasons: new Set<string>() };
      current.score += points;
      current.reasons.add(reason);
      scores.set(normalizedSport, current);
    };

    for (const player of players) {
      const sameDistrict =
        profile?.city &&
        player.city &&
        profile.city.trim().toLowerCase() === player.city.trim().toLowerCase();
      const sameLevel = this.normalizeLevel(profile?.level) === this.normalizeLevel(player.level);
      const hasSharedSport = player.preferred_sports.some((sport) => currentSports.has(sport));

      // Usuarios similares son buena pista para descubrir deportes adyacentes.
      const similarity = (sameDistrict ? 10 : 0) + (sameLevel ? 8 : 0) + (hasSharedSport ? 12 : 0);
      if (similarity === 0) continue;

      for (const sport of player.preferred_sports) {
        addSignal(sport, similarity, "Usuarios parecidos tambien practican este deporte");
      }
    }

    for (const match of matches) {
      addSignal(match.sport, 10, "Hay partidos activos disponibles");
    }

    for (const court of courts) {
      const ratingBoost = Math.round((court.rating ?? 4) * 2);
      addSignal(court.sport, 6 + ratingBoost, "Existen sedes bien valoradas para practicarlo");
    }

    return [...scores.entries()]
      .map(([sport, data]) => ({
        sport,
        score: Math.max(45, Math.min(92, Math.round(data.score))),
        reasons: [...data.reasons].slice(0, 3),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private scorePlayer(
    current: {
      city: string | null;
      level: number | null;
      trust_score: number | null;
      preferred_sports: string[];
    } | null,
    candidate: {
      city: string | null;
      level: number | null;
      trust_score: number | null;
      preferred_sports: string[];
    },
  ): number {
    if (!current) return 50;
    const currentSports = new Set(current.preferred_sports ?? []);
    const sharedSports = candidate.preferred_sports.filter((sport) => currentSports.has(sport));
    const sportScore = sharedSports.length > 0 ? 40 : 10;
    const levelScore =
      this.normalizeLevel(current.level) === this.normalizeLevel(candidate.level) ? 25 : 10;
    const cityScore =
      current.city && candidate.city && current.city.toLowerCase() === candidate.city.toLowerCase()
        ? 20
        : 8;
    const trustScore = Math.round(((candidate.trust_score ?? 80) / 100) * 15);

    return Math.min(100, sportScore + levelScore + cityScore + trustScore);
  }

  /**
   * La BD historica guarda profiles.level como numero, mientras otras pantallas
   * usan etiquetas. Normalizamos aqui para comparar y mostrar sin mutar datos.
   */
  private normalizeLevel(level: number | string | null | undefined): string {
    const value = typeof level === "string" ? level.trim().toLowerCase() : level;
    if (value === 1 || value === "1" || value === "amateur" || value === "principiante") {
      return "Principiante";
    }
    if (value === 2 || value === "2" || value === "intermediate" || value === "intermedio") {
      return "Intermedio";
    }
    if (value === 3 || value === "3" || value === "advanced" || value === "avanzado") {
      return "Avanzado";
    }
    if (value === 4 || value === "4" || value === "pro" || value === "elite") {
      return "Elite";
    }
    return "Por confirmar";
  }

  /**
   * Prisma representa el DATE de PostgreSQL como Date. Para la IA y la UI
   * mandamos una fecha corta, estable y facil de leer.
   */
  private formatMatchDate(value: Date | string | null | undefined): string {
    if (!value) return "fecha por confirmar";
    if (typeof value === "string") return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  }

  /**
   * PostgreSQL TIME tambien llega como Date en Prisma. Extraemos HH:mm para
   * evitar mostrar una fecha artificial como 1970-01-01.
   */
  private formatMatchTime(value: Date | string | null | undefined): string {
    if (!value) return "hora por confirmar";
    if (typeof value === "string") return value.slice(0, 5);
    return value.toISOString().slice(11, 16);
  }

  private buildRecommendationPrompt(input: {
    type: string;
    limit: number;
    language: "es" | "en" | "pt";
    engagementProfile: unknown;
    context: unknown;
    deterministicCards: RecommendationCard[];
  }): string {
    const compactContext = JSON.stringify(input).slice(0, 12000);
    return `Eres el motor real de Personalization & Engagement de SportMatch.

Usa SOLO el contexto estructurado entregado. No inventes IDs, usuarios, canchas ni partidos.
Puedes mejorar nombres, descripciones y motivos, pero conserva entityId cuando exista.

Objetivo: generar recomendaciones deportivas personalizadas, reto diario, logro sugerido,
resumen semanal, narrativa de distritos y borrador de notificacion inteligente.

Definicion obligatoria de reto deportivo:
- Un reto NO debe ser "conecta", "coordina", "crea publicacion" ni una tarea administrativa.
- Debe sentirse como una mision deportiva entretenida, concreta y segura.
- Debe incluir: nombre memorable, deporte o habilidad objetivo, duracion o repeticiones,
  criterio medible de exito y modo de validacion si aplica una sede.
- Debe ser exigente pero NO extremo: evita lesion, castigos, ayunos, sobreentrenamiento
  o cualquier lenguaje de riesgo.
- Si el usuario practica deportes fisicos, prioriza retos presenciales en cancha, gym,
  club o sede cercana. Si solo hay e-sports, crea reto de practica tecnica, estrategia
  o consistencia sin pedir sede fisica.
- No nombres una sede especifica dentro del reto diario si el usuario aun no la eligio.
  Es correcto decir "elige una sede desde el mapa"; la sede real se asigna despues en UI.
- Para recomendaciones type="challenges", devuelve al menos 2 cards de type "challenge".
- Las cards challenge deben tener metadata.rewardHint con FitCoins sugeridos.

Ejemplos de estilo esperado:
- "Circuito Primer Toque 3x8": 3 bloques de 8 minutos para control orientado, pase contra pared
  y definicion suave; exito si registra 30 acciones limpias.
- "Duelo de Precision en Sede": 20 minutos de tiros/servicios a zonas marcadas; exito si alcanza
  12 aciertos y la empresa valida asistencia.
- "Mision Ritmo de Partido": calentamiento 8 min, bloque tecnico 15 min y mini reto final de
  10 intentos medibles segun el deporte.

Responde UNICAMENTE JSON valido, sin markdown, con esta forma exacta:
{
  "summary": "string",
  "recommendations": [
    {
      "id": "string",
      "type": "player|sport|challenge|achievement|content|venue",
      "title": "string",
      "description": "string",
      "score": 0,
      "reasons": ["string"],
      "actionLabel": "string",
      "entityId": "string opcional",
      "metadata": {}
    }
  ],
  "dailyChallenge": {
    "title": "string",
    "description": "string",
    "rewardHint": "string"
  },
  "achievementIdea": {
    "name": "string",
    "description": "string",
    "unlockCondition": "string"
  },
  "weeklyBrief": "string",
  "tourNarrative": "string",
  "notificationDraft": {
    "title": "string",
    "body": "string"
  }
}

Reglas:
- Idioma de salida: ${input.language}.
- Maximo ${input.limit} recomendaciones.
- Si hay pocos datos, explica que el perfil esta aprendiendo y usa señales disponibles.
- Nunca digas que eres un mock.
- No expongas datos sensibles ni texto completo de publicaciones.

Contexto:
${compactContext}`;
  }

  private parseRecommendationJson(
    text: string,
    fallbackCards: RecommendationCard[],
    context: Awaited<ReturnType<EngagementService["buildRecommendationContext"]>>,
  ): Omit<AiRecommendationResponse, "metadata"> {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Respuesta sin JSON");
      const parsed = JSON.parse(jsonMatch[0]) as Partial<
        Omit<AiRecommendationResponse, "metadata">
      >;
      const proceduralChallenge = this.buildProceduralDailyChallenge(context);
      const parsedDailyChallenge = {
        title: this.stringOrFallback(parsed.dailyChallenge?.title, proceduralChallenge.title),
        description: this.stringOrFallback(
          parsed.dailyChallenge?.description,
          proceduralChallenge.description,
        ),
        rewardHint: this.stringOrFallback(
          parsed.dailyChallenge?.rewardHint,
          proceduralChallenge.rewardHint,
        ),
      };
      return {
        summary: this.stringOrFallback(
          parsed.summary,
          "Tu perfil deportivo ya esta listo para personalizar recomendaciones.",
        ),
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map((card, index) => this.normalizeCard(card, index))
          : fallbackCards,
        dailyChallenge: this.isLegacyActivationChallenge({
          dailyChallenge: parsedDailyChallenge,
        } as AiRecommendationResponse)
          ? proceduralChallenge
          : parsedDailyChallenge,
        achievementIdea: {
          name: this.stringOrFallback(parsed.achievementIdea?.name, "Impulso Deportivo"),
          description: this.stringOrFallback(
            parsed.achievementIdea?.description,
            "Reconoce actividad reciente y constancia deportiva.",
          ),
          unlockCondition: this.stringOrFallback(
            parsed.achievementIdea?.unlockCondition,
            "Completar 3 acciones deportivas relevantes.",
          ),
        },
        weeklyBrief: this.stringOrFallback(
          parsed.weeklyBrief,
          "Esta semana puedes reforzar tus deportes favoritos.",
        ),
        tourNarrative: this.stringOrFallback(
          parsed.tourNarrative,
          "Tu mapa deportivo empieza a tomar forma con cada sede, partido y reto.",
        ),
        notificationDraft: {
          title: this.stringOrFallback(
            parsed.notificationDraft?.title,
            "Nueva recomendacion deportiva",
          ),
          body: this.stringOrFallback(
            parsed.notificationDraft?.body,
            "SportMatch encontro una oportunidad compatible para ti.",
          ),
        },
      };
    } catch {
      const proceduralChallenge = this.buildProceduralDailyChallenge(context);
      return {
        summary:
          text.slice(0, 280) ||
          "El servicio de recomendaciones respondio, pero no devolvio un formato util.",
        recommendations: fallbackCards,
        dailyChallenge: proceduralChallenge,
        achievementIdea: {
          name: "Trofeo de Constancia Deportiva",
          description: "Primer logro basado en señales reales de engagement.",
          unlockCondition: "Completar un reto deportivo validado o registrar 3 acciones reales.",
        },
        weeklyBrief: "Tu perfil esta aprendiendo de tus acciones reales.",
        tourNarrative: "Cada accion suma a tu historia deportiva dentro de SportMatch.",
        notificationDraft: {
          title: "SportMatch tiene una idea para ti",
          body: "Revisa tus recomendaciones personalizadas.",
        },
      };
    }
  }

  private normalizeCard(value: unknown, index: number): RecommendationCard {
    const card = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const rawType = typeof card.type === "string" ? card.type : "content";
    const allowedTypes = ["player", "sport", "challenge", "achievement", "content", "venue"];
    return {
      id: this.stringOrFallback(card.id, `ai-card-${index}`),
      type: allowedTypes.includes(rawType) ? (rawType as RecommendationCard["type"]) : "content",
      title: this.stringOrFallback(card.title, "Recomendacion deportiva"),
      description: this.stringOrFallback(card.description, "Sugerencia personalizada por IA."),
      score:
        typeof card.score === "number" ? Math.max(0, Math.min(100, Math.round(card.score))) : 70,
      reasons: Array.isArray(card.reasons)
        ? card.reasons.filter((reason): reason is string => typeof reason === "string").slice(0, 4)
        : ["Basado en tu perfil deportivo"],
      actionLabel: this.stringOrFallback(card.actionLabel, "Ver detalle"),
      entityId: typeof card.entityId === "string" ? card.entityId : undefined,
      metadata:
        card.metadata && typeof card.metadata === "object" && !Array.isArray(card.metadata)
          ? (card.metadata as Record<string, unknown>)
          : undefined,
    };
  }

  private isLegacyActivationChallenge(
    payload: Pick<AiRecommendationResponse, "dailyChallenge">,
  ): boolean {
    const title = payload.dailyChallenge?.title?.toLowerCase() ?? "";
    const description = payload.dailyChallenge?.description?.toLowerCase() ?? "";
    const combined = `${title} ${description}`;
    return (
      title.includes("reto de activacion") ||
      title.includes("reto de activación") ||
      description.includes("crea una publicacion") ||
      description.includes("crea una publicación") ||
      description.includes("conecta con un jugador recomendado") ||
      !this.isPhysicalSport(combined)
    );
  }

  private stringOrFallback(value: unknown, fallback: string): string {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
  }

  /**
   * Identidad diaria en zona Lima/Bogota para que el cache cambie a medianoche local.
   */
  private getBogotaDateOnly(): Date {
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return new Date(`${dateKey}T00:00:00.000Z`);
  }

  private getNextBogotaMidnight(): Date {
    const today = this.getBogotaDateOnly();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow;
  }
}

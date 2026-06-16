// ============================================================
// server/src/ai/b2b/b2b-ai.service.ts
// Capa de orquestación para los endpoints B2B-AI.
// Responsabilidades:
//   1. Rate limiting granular (bucket "b2b" — 60 req/min/usuario)
//   2. Llamada al engine específico (pricing/ads/churn)
//   3. Llamada a Vertex AI para generar la narrative en lenguaje natural
//   4. Mapeo de errores Vertex AI a mensajes user-friendly
// ============================================================

import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { VertexAiService, VertexAiGenerationResult } from "../vertex-ai.service";
import { PricingEngineService } from "./services/pricing-engine.service";
import { AdsOptimizerService } from "./services/ads-optimizer.service";
import { ChurnPredictorService } from "./services/churn-predictor.service";
import { ShapExplainerService } from "./services/shap-explainer.service";
import { ShapFeatureDto } from "./dto/b2b-common.dto";
import { PricingRequestDto, PricingResponseDto } from "./dto/pricing.dto";
import { AdsOptimizeRequestDto, AdsOptimizeResponseDto } from "./dto/ads-optimizer.dto";
import { ChurnPredictRequestDto, ChurnPredictResponseDto } from "./dto/churn.dto";

interface UserRateLimit {
  count: number;
  resetTime: number;
}

@Injectable()
export class B2bAiService {
  private readonly logger = new Logger(B2bAiService.name);
  private readonly userRateLimits = new Map<string, UserRateLimit>();
  private readonly rateLimitWindowMs = 60_000;
  private readonly b2bRateLimit = 60; // req/min para todos los endpoints B2B

  constructor(
    private vertexAi: VertexAiService,
    private pricingEngine: PricingEngineService,
    private adsOptimizer: AdsOptimizerService,
    private churnPredictor: ChurnPredictorService,
    private explainer: ShapExplainerService,
  ) {}

  // ============================================================
  // FEATURE #9 — DYNAMIC PRICING
  // ============================================================

  async recommendPricing(userId: string, dto: PricingRequestDto): Promise<PricingResponseDto> {
    this.checkB2bRateLimit(userId);

    const startTime = Date.now();

    // 1. Engine: cálculo determinista en TS
    const pricing = await this.pricingEngine.recommend(dto.courtId, userId, dto.date, dto.hour);

    // 2. LLM: genera narrative en lenguaje natural a partir de los drivers
    let narrative: string;
    try {
      narrative = await this.generatePricingNarrative(pricing, dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Vertex AI narrative falló, usando skeleton: ${msg}`);
      narrative = this.explainer.buildSkeletonNarrative(pricing.drivers.slice(0, 3), {
        direction: pricing.deltaPct > 0.02 ? "up" : pricing.deltaPct < -0.02 ? "down" : "flat",
        magnitude: Math.abs(pricing.deltaPct),
      });
    }

    return {
      ...pricing,
      narrative,
      metadata: {
        tokens: 0, // se sobrescribe abajo si la llamada al LLM tuvo éxito
        model: "gemini-2.5-flash",
        latencyMs: Date.now() - startTime,
      },
    };
  }

  // ============================================================
  // FEATURE #21 — ADS OPTIMIZER
  // ============================================================

  async optimizeAds(userId: string, dto: AdsOptimizeRequestDto): Promise<AdsOptimizeResponseDto> {
    this.checkB2bRateLimit(userId);

    const startTime = Date.now();

    // 1. Engine: análisis A/B + UCB1 bandit + LLM reescritura
    const result = await this.adsOptimizer.optimize(
      userId,
      dto.adId,
      dto.goal,
      dto.variantCount ?? 3,
    );

    // 2. LLM: genera narrative ejecutivo
    let narrative: string;
    try {
      narrative = await this.generateAdsNarrative(result, dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Vertex AI narrative falló para ads, usando skeleton: ${msg}`);
      const winner = result.variants.find((v) => v.variantId === result.recommendation);
      narrative = winner
        ? `Recomendamos la variante ${winner.variantId} (estilo ${winner.style}) con CTR predicho de ${(winner.predictedCtr * 100).toFixed(1)}%.`
        : "No se pudo generar una recomendación.";
    }

    return {
      variants: result.variants,
      recommendation: result.recommendation,
      expectedLift: result.expectedLift,
      currentCtr: result.currentCtr,
      sampleSize: result.sampleSize,
      drivers: result.drivers,
      narrative,
      metadata: {
        tokens: 0,
        model: "gemini-2.5-flash",
        latencyMs: Date.now() - startTime,
      },
    };
  }

  private async generateAdsNarrative(
    result: {
      recommendation: string;
      expectedLift: number;
      currentCtr: number;
      variants: { variantId: string; style: string; predictedCtr: number }[];
    },
    dto: AdsOptimizeRequestDto,
  ): Promise<string> {
    const winner = result.variants.find((v) => v.variantId === result.recommendation);
    if (!winner) return "No se pudo identificar la mejor variante.";

    const prompt = `Eres un experto en performance marketing para SportMatch Connect (plataforma deportiva peruana). Genera UNA recomendación ejecutiva en español (máx 60 palabras) sobre optimización de anuncios.

Anuncio: ${dto.adId}
Objetivo: ${dto.goal}
Variante recomendada: ${result.recommendation} (estilo ${winner.style})
CTR actual: ${(result.currentCtr * 100).toFixed(2)}%
CTR predicho de la recomendada: ${(winner.predictedCtr * 100).toFixed(2)}%
Lift esperado: ${(result.expectedLift * 100).toFixed(1)} puntos porcentuales

Reglas:
- Tono directo, orientado a acción.
- Empieza con verbo en imperativo (Ej: "Cambia...", "Prueba...", "Publica...").
- Una o dos frases cortas.
- Sin disclaimers.
- Devuelve SOLO el texto.`;

    const llmResult: VertexAiGenerationResult = await this.vertexAi.generateContent(prompt, {
      language: "es",
      temperature: 0.5,
    });
    return llmResult.text.trim();
  }

  // ============================================================
  // FEATURE #23 — CHURN PREDICTOR
  // ============================================================

  async predictChurn(
    userId: string,
    dto: ChurnPredictRequestDto,
  ): Promise<ChurnPredictResponseDto> {
    this.checkB2bRateLimit(userId);

    const startTime = Date.now();
    const lookbackDays = dto.lookbackDays ?? 30;

    // El service genera su propia narrative internamente
    const analysis = await this.churnPredictor.predict(dto.businessId, lookbackDays);

    return {
      churnScore: analysis.churnScore,
      riskLevel: analysis.riskLevel,
      factors: analysis.factors,
      daysSinceLastInteraction: analysis.daysSinceLastInteraction,
      activeAdsCount: analysis.activeAdsCount,
      totalRevenue: analysis.totalRevenue,
      totalEngagement: analysis.totalEngagement,
      drivers: analysis.drivers,
      narrative: analysis.narrative,
      metadata: {
        tokens: 0,
        model: "gemini-2.5-flash",
        latencyMs: Date.now() - startTime,
      },
    };
  }

  // ============================================================
  // LLM NARRATIVE BUILDER
  // ============================================================

  private async generatePricingNarrative(
    pricing: {
      baseline: number;
      recommendedPrice: number;
      deltaPct: number;
      occupancyRate: number;
      drivers: ShapFeatureDto[];
    },
    dto: PricingRequestDto,
  ): Promise<string> {
    const driversList = pricing.drivers
      .slice(0, 4)
      .map((d) => `- ${d.feature}: contribution=${d.contribution} PEN, value=${d.value}`)
      .join("\n");

    const direction = pricing.deltaPct > 0 ? "sube" : pricing.deltaPct < 0 ? "baja" : "se mantiene";
    const magnitudePct = (Math.abs(pricing.deltaPct) * 100).toFixed(1);

    const prompt = `Eres el analista B2B de SportMatch Connect. Genera UNA recomendación ejecutiva en español (máx 60 palabras) sobre pricing dinámico para el siguiente slot:

Cancha: ${dto.courtId}
Fecha: ${dto.date}
Hora solicitada: ${dto.hour ?? "no especificada (mejor hora del día)"}
Precio baseline: ${pricing.baseline} PEN
Precio recomendado: ${pricing.recommendedPrice.toFixed(2)} PEN (${direction} ${magnitudePct}%)
Ocupación esperada: ${(pricing.occupancyRate * 100).toFixed(0)}%
Drivers principales:
${driversList}

Reglas estrictas:
- Tono directo, orientado a acción.
- Empieza con verbo en imperativo (Ej: "Sube...", "Mantén...", "Baja...").
- Una sola frase o dos cortas.
- Sin recomendaciones legales ni disclaimers.
- Devuelve SOLO el texto, sin comillas, sin preámbulo.`;

    const result: VertexAiGenerationResult = await this.vertexAi.generateContent(prompt, {
      language: "es",
      temperature: 0.4,
    });

    return result.text.trim();
  }

  // ============================================================
  // RATE LIMIT
  // ============================================================

  private checkB2bRateLimit(userId: string): void {
    const now = Date.now();
    const limit = this.userRateLimits.get(userId);

    if (!limit || now > limit.resetTime) {
      this.userRateLimits.set(userId, { count: 1, resetTime: now + this.rateLimitWindowMs });
      return;
    }

    if (limit.count >= this.b2bRateLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Has excedido el límite de ${this.b2bRateLimit} operaciones B2B-AI por minuto. Por favor, espera un momento.`,
          bucket: "b2b",
          retryAfterMs: this.rateLimitWindowMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    limit.count++;
  }

  // ============================================================
  // ERROR MAPPING (reusado del AiService original; conservado aquí
  // para independencia del módulo B2B si evoluciona aparte)
  // ============================================================

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
}

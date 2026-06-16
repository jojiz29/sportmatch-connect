// ============================================================
// server/src/ai/b2b/services/churn-predictor.service.ts
// Feature #23 — Churn Predictor
// Modelo RFM-lite (Recency, Frequency, Monetary) adaptado a B2B:
//   R: días desde la última interacción
//   F: frecuencia de publicaciones (ads activos)
//   M: revenue acumulado en el período
//   + engagement via usage_metrics
// Score 0-1: 0 = super activo, 1 = altísimo riesgo de churn
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import { DataPipelineService, AdMetricsSummary, UsageSummary } from "./data-pipeline.service";
import { ShapExplainerService, ShapInputFeature } from "./shap-explainer.service";
import { ChurnFactorDto } from "../dto/churn.dto";
import { ShapFeatureDto } from "../dto/b2b-common.dto";
import { VertexAiService } from "../../vertex-ai.service";

export interface ChurnAnalysis {
  churnScore: number;
  riskLevel: "low" | "medium" | "high";
  factors: ChurnFactorDto[];
  daysSinceLastInteraction: number;
  activeAdsCount: number;
  totalRevenue: number;
  totalEngagement: number;
  drivers: ShapFeatureDto[];
  narrative: string;
}

/**
 * Constantes del modelo. Documentadas en docs/b2b-ai/churn-predictor.md.
 */
const CHURN_CONSTANTS = {
  /** Umbrales de riskLevel */
  MEDIUM_THRESHOLD: 0.4,
  HIGH_THRESHOLD: 0.7,
  /** Días desde la última interacción que consideramos "muerto" */
  DEAD_DAYS: 30,
  /** Frecuencia mínima esperada de ads activos (por lookbackDays) */
  MIN_ADS_ACTIVE: 3,
  /** Revenue mínimo mensual esperado para considerar un negocio "vivo" (PEN) */
  MIN_MONTHLY_REVENUE: 500,
  /** Pesos del modelo RFM-lite */
  WEIGHTS: {
    RECENCY: 0.4,
    FREQUENCY: 0.25,
    MONETARY: 0.2,
    ENGAGEMENT: 0.15,
  },
};

@Injectable()
export class ChurnPredictorService {
  private readonly logger = new Logger(ChurnPredictorService.name);

  constructor(
    private dataPipeline: DataPipelineService,
    private explainer: ShapExplainerService,
    private vertexAi: VertexAiService,
  ) {}

  /**
   * Predice el riesgo de churn de un negocio.
   */
  async predict(businessId: string, lookbackDays = 30): Promise<ChurnAnalysis> {
    // 1. Cargar datos
    const [adMetrics, usageSummary] = await Promise.all([
      this.dataPipeline.getAdMetricsForBusiness(businessId),
      this.dataPipeline.getUsageSummary(businessId, lookbackDays),
    ]);

    // Si no hay datos, asumimos negocio "nuevo" → score medio-bajo con caveat
    if (adMetrics.totalAds === 0 && usageSummary.profileViews === 0) {
      this.logger.warn(`No data found for business ${businessId}; returning cold-start result`);
    }

    // 2. Calcular recency (días desde la última interacción)
    const daysSinceLastInteraction = this.computeRecency(adMetrics);

    // 3. Calcular componentes
    const recencyScore = this.scoreRecency(daysSinceLastInteraction, lookbackDays);
    const frequencyScore = this.scoreFrequency(adMetrics.totalAds, lookbackDays);
    const monetaryScore = await this.scoreMonetary(businessId, lookbackDays);
    const engagementScore = this.scoreEngagement(usageSummary, lookbackDays);

    // 4. Score final ponderado
    const churnScore = this.aggregate({
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      engagement: engagementScore,
    });

    // 5. Risk level
    const riskLevel: "low" | "medium" | "high" =
      churnScore < CHURN_CONSTANTS.MEDIUM_THRESHOLD
        ? "low"
        : churnScore < CHURN_CONSTANTS.HIGH_THRESHOLD
          ? "medium"
          : "high";

    // 6. Generar factores explicativos (rule-based, ordenados por severity)
    const factors = this.buildFactors({
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      engagement: engagementScore,
      daysSinceLastInteraction,
      activeAdsCount: adMetrics.totalAds,
      totalRevenue: monetaryScore * CHURN_CONSTANTS.MIN_MONTHLY_REVENUE * 5, // back-approx
      usageSummary,
    });

    // 7. SHAP-style drivers
    const drivers = this.buildDrivers({
      recencyScore,
      frequencyScore,
      monetaryScore,
      engagementScore,
      daysSinceLastInteraction,
    });

    // 8. Generar narrative con LLM
    const narrative = await this.generateNarrative(
      { churnScore, riskLevel, factors, daysSinceLastInteraction },
      businessId,
    );

    return {
      churnScore: +churnScore.toFixed(3),
      riskLevel,
      factors,
      daysSinceLastInteraction,
      activeAdsCount: adMetrics.totalAds,
      totalRevenue: monetaryScore * CHURN_CONSTANTS.MIN_MONTHLY_REVENUE * 5,
      totalEngagement:
        usageSummary.profileViews +
        usageSummary.adViews +
        usageSummary.adClicks +
        usageSummary.mapPinClicks,
      drivers,
      narrative,
    };
  }

  // ============================================================
  // COMPONENTES DEL SCORE
  // ============================================================

  private computeRecency(adMetrics: AdMetricsSummary): number {
    // Encuentra la fecha de creación más reciente
    if (adMetrics.perAd.length === 0) return Infinity;
    const lastDates = adMetrics.perAd
      .map((a) => a.lastInteractionAt)
      .filter((d): d is string => d !== null)
      .sort()
      .reverse();
    if (lastDates.length === 0) return Infinity;

    const lastDate = new Date(lastDates[0]);
    const now = new Date();
    const days = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  /**
   * Recency score: 0 si muy reciente, 1 si muy antiguo.
   * Función sigmoide: a los 7 días = 0.3, a los 30 días = 0.85
   */
  private scoreRecency(days: number, lookbackDays: number): number {
    if (days === Infinity) return 0.9; // sin datos = asumimos riesgo alto
    if (days <= 1) return 0.05;
    if (days >= lookbackDays) return 1.0;
    // Interpolación logarítmica
    return Math.min(1, Math.log10(days + 1) / Math.log10(lookbackDays + 1));
  }

  /**
   * Frequency score: 0 si publica mucho, 1 si no publica.
   * Normalizado por lookbackDays (30d por defecto → espera ~3 ads mínimo).
   */
  private scoreFrequency(activeAds: number, lookbackDays: number): number {
    const expectedMin = (lookbackDays / 30) * CHURN_CONSTANTS.MIN_ADS_ACTIVE;
    if (activeAds >= expectedMin) return 0.1;
    if (activeAds === 0) return 1.0;
    return Math.max(0.1, 1 - activeAds / expectedMin);
  }

  /**
   * Monetary score: 0 si genera ingresos, 1 si no.
   * Usa las bookings del business en el período.
   */
  private async scoreMonetary(businessId: string, lookbackDays: number): Promise<number> {
    // Suma total_cobrado de bookings del business en el período.
    // Como bookings no tiene business_id directo (solo court_id → owner_id),
    // hacemos query a través de courts.
    try {
      const result = await this.aggregateRevenue(businessId, lookbackDays);
      if (result >= CHURN_CONSTANTS.MIN_MONTHLY_REVENUE) return 0.1;
      if (result === 0) return 1.0;
      return Math.max(0.1, 1 - result / CHURN_CONSTANTS.MIN_MONTHLY_REVENUE);
    } catch (err) {
      this.logger.warn(
        `Revenue query failed for ${businessId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return 0.5; // neutral si no podemos calcular
    }
  }

  private async aggregateRevenue(businessId: string, lookbackDays: number): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);
    const sinceStr = since.toISOString().slice(0, 10);

    // Query a través de courts.owner_id → bookings.court_id
    const rows = await this.dataPipeline["prisma"].$queryRaw<Array<{ total: number | null }>>`
      SELECT COALESCE(SUM(b.total_cobrado), 0)::numeric AS total
      FROM bookings b
      INNER JOIN courts c ON c.id = b.court_id
      WHERE c.owner_id = ${businessId}::uuid
        AND b.date >= ${sinceStr}
    `;

    if (!rows || rows.length === 0) return 0;
    return Number(rows[0].total) || 0;
  }

  /**
   * Engagement score: 0 si hay interacción de usuarios, 1 si está desierto.
   */
  private scoreEngagement(usage: UsageSummary, lookbackDays: number): number {
    const total = usage.profileViews + usage.adViews + usage.adClicks + usage.mapPinClicks;
    // Esperado: al menos 1 vista/día = lookbackDays vistas
    const expected = lookbackDays;
    if (total >= expected) return 0.1;
    if (total === 0) return 1.0;
    return Math.max(0.1, 1 - total / expected);
  }

  // ============================================================
  // AGGREGATE
  // ============================================================

  private aggregate(scores: {
    recency: number;
    frequency: number;
    monetary: number;
    engagement: number;
  }): number {
    const w = CHURN_CONSTANTS.WEIGHTS;
    return Math.min(
      1,
      Math.max(
        0,
        scores.recency * w.RECENCY +
          scores.frequency * w.FREQUENCY +
          scores.monetary * w.MONETARY +
          scores.engagement * w.ENGAGEMENT,
      ),
    );
  }

  // ============================================================
  // FACTORES EXPLICATIVOS (reglas deterministas)
  // ============================================================

  private buildFactors(input: {
    recency: number;
    frequency: number;
    monetary: number;
    engagement: number;
    daysSinceLastInteraction: number;
    activeAdsCount: number;
    totalRevenue: number;
    usageSummary: UsageSummary;
  }): ChurnFactorDto[] {
    const factors: ChurnFactorDto[] = [];

    if (input.recency > 0.5) {
      factors.push({
        name: `Sin actividad hace ${input.daysSinceLastInteraction} días`,
        description: `El último anuncio del negocio fue creado hace ${input.daysSinceLastInteraction} días. Negocios activos publican al menos 1 anuncio/semana.`,
        severity: input.recency,
        suggestedAction:
          "Publicar un anuncio nuevo en la próxima semana para mantener la visibilidad en el feed.",
      });
    }

    if (input.frequency > 0.5) {
      factors.push({
        name: `Solo ${input.activeAdsCount} anuncios activos`,
        description: `El negocio tiene ${input.activeAdsCount} anuncios cuando el mínimo recomendado es 3 por mes.`,
        severity: input.frequency,
        suggestedAction:
          "Crear 2-3 anuncios nuevos este mes, idealmente rotando formatos (torneos, descuentos, clases).",
      });
    }

    if (input.monetary > 0.6) {
      factors.push({
        name: "Ingresos bajos este período",
        description: `El revenue acumulado en el período (S/ ${input.totalRevenue.toFixed(0)}) está por debajo del umbral mínimo esperado (S/ 500/mes).`,
        severity: input.monetary,
        suggestedAction:
          "Activar campañas de Ads Optimizer y considerar descuentos en horarios valle para atraer tráfico.",
      });
    }

    if (input.engagement > 0.7) {
      factors.push({
        name: "Engagement de usuarios casi nulo",
        description: `Solo ${input.usageSummary.profileViews + input.usageSummary.adViews} interacciones registradas en los últimos 30 días.`,
        severity: input.engagement,
        suggestedAction:
          "Revisar la imagen y copy del perfil comercial. Pedir reseñas a clientes recurrentes para mejorar la tasa de clics.",
      });
    }

    // Si todo OK, mensaje positivo
    if (factors.length === 0) {
      factors.push({
        name: "Engagement saludable",
        description: "El negocio mantiene actividad regular y engagement con usuarios.",
        severity: 0.1,
        suggestedAction:
          "Continuar con la estrategia actual. Considera probar Ads Optimizer para maximizar conversiones.",
      });
    }

    return factors.sort((a, b) => b.severity - a.severity);
  }

  // ============================================================
  // SHAP-STYLE DRIVERS
  // ============================================================

  private buildDrivers(input: {
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    engagementScore: number;
    daysSinceLastInteraction: number;
  }): ShapFeatureDto[] {
    const features: ShapInputFeature[] = [
      {
        name: "Recencia (días desde última actividad)",
        value: input.daysSinceLastInteraction,
        weight: CHURN_CONSTANTS.WEIGHTS.RECENCY,
        positiveDirection: true,
        baseline: 7,
      },
      {
        name: "Frecuencia de publicaciones",
        value: input.frequencyScore,
        weight: CHURN_CONSTANTS.WEIGHTS.FREQUENCY,
        positiveDirection: true,
        baseline: 0.3,
      },
      {
        name: "Revenue (bookings)",
        value: input.monetaryScore,
        weight: CHURN_CONSTANTS.WEIGHTS.MONETARY,
        positiveDirection: true,
        baseline: 0.3,
      },
      {
        name: "Engagement de usuarios",
        value: input.engagementScore,
        weight: CHURN_CONSTANTS.WEIGHTS.ENGAGEMENT,
        positiveDirection: true,
        baseline: 0.3,
      },
    ];

    return this.explainer.computeContributions(features, 0.5); // outputScale 0-0.5
  }

  // ============================================================
  // LLM NARRATIVE
  // ============================================================

  private async generateNarrative(
    summary: {
      churnScore: number;
      riskLevel: string;
      factors: ChurnFactorDto[];
      daysSinceLastInteraction: number;
    },
    businessId: string,
  ): Promise<string> {
    const factorList = summary.factors
      .slice(0, 3)
      .map(
        (f) => `- ${f.name} (severidad: ${(f.severity * 100).toFixed(0)}%): ${f.suggestedAction}`,
      )
      .join("\n");

    const prompt = `Eres el analista de retención B2B de SportMatch Connect. Genera UNA recomendación ejecutiva en español (máx 80 palabras) sobre el riesgo de churn de un negocio.

Negocio: ${businessId}
Churn score: ${(summary.churnScore * 100).toFixed(0)}%
Nivel de riesgo: ${summary.riskLevel.toUpperCase()}
Días desde última interacción: ${summary.daysSinceLastInteraction}
Top factores y acciones sugeridas:
${factorList}

Reglas estrictas:
- Tono ejecutivo, orientado a acción.
- Empieza con un verbo en imperativo (Ej: "Contacta...", "Activa...", "Mantén...").
- Una sola frase o dos cortas.
- Sin disclaimers ni recomendaciones legales.
- Devuelve SOLO el texto, sin comillas ni preámbulo.`;

    try {
      const result = await this.vertexAi.generateContent(prompt, {
        language: "es",
        temperature: 0.4,
      });
      return result.text.trim();
    } catch {
      // Fallback: skeleton narrative
      const topFactor = summary.factors[0];
      if (!topFactor) return "Sin datos suficientes para evaluar el riesgo.";
      return `Riesgo ${summary.riskLevel}. Acción prioritaria: ${topFactor.suggestedAction}`;
    }
  }

  static get constants() {
    return CHURN_CONSTANTS;
  }
}

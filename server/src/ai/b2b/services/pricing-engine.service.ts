// ============================================================
// server/src/ai/b2b/services/pricing-engine.service.ts
// Feature #9 — Dynamic Pricing.
// Modelo de pricing en TypeScript puro: regresión heurística basada
// en ocupación histórica + features temporales (hora pico, día de semana).
// NO usa libs ML externas — la fórmula está documentada y es testeable.
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import { DataPipelineService, HourOccupancy } from "./data-pipeline.service";
import { ShapExplainerService, ShapInputFeature } from "./shap-explainer.service";
import { ShapFeatureDto } from "../dto/b2b-common.dto";

export interface PricingFeatures {
  baseline: number;
  occupancyRate: number;
  isWeekend: boolean;
  isPeakHour: boolean;
  isLowHour: boolean;
  sampleSize: number;
  districtDemandFactor: number;
  hoursToSlot: number;
}

export interface PricingResult {
  recommendedPrice: number;
  baseline: number;
  deltaPct: number;
  occupancyRate: number;
  confidence: number;
  sampleSize: number;
  bestHour: number | undefined;
  drivers: ShapFeatureDto[];
}

/**
 * Constantes del modelo. Documentadas en docs/b2b-ai/pricing-model.md.
 * Ajustables sin tocar el código de orquestación.
 */
const PRICING_CONSTANTS = {
  /** Cap de subida cuando ocupación es muy alta */
  HIGH_OCCUPANCY_THRESHOLD: 0.7,
  /** Cap de bajada cuando ocupación es muy baja */
  LOW_OCCUPANCY_THRESHOLD: 0.3,
  /** Multiplicador cuando ocupación > HIGH_OCCUPANCY_THRESHOLD */
  HIGH_OCCUPANCY_MULT: 1.25,
  /** Multiplicador cuando ocupación < LOW_OCCUPANCY_THRESHOLD */
  LOW_OCCUPANCY_MULT: 0.85,
  /** Multiplicador por hora pico (19-22) */
  PEAK_HOUR_MULT: 1.1,
  /** Multiplicador por hora valle (8-11) */
  LOW_HOUR_MULT: 0.95,
  /** Multiplicador fin de semana (sábado y domingo) */
  WEEKEND_MULT: 1.08,
  /** Hard cap absoluto: nunca más de +30% del baseline */
  MAX_UPLIFT: 0.3,
  /** Hard cap absoluto: nunca menos de -25% del baseline */
  MAX_DISCOUNT: 0.25,
  /** Confianza base cuando hay 0 muestras */
  BASE_CONFIDENCE: 0.3,
  /** Incremento de confianza por cada booking observado (cap a 1.0) */
  CONFIDENCE_PER_BOOKING: 0.03,
  /** Horas consideradas pico */
  PEAK_HOURS: [18, 19, 20, 21],
  /** Horas consideradas valle */
  LOW_HOURS: [8, 9, 10, 11],
};

@Injectable()
export class PricingEngineService {
  private readonly logger = new Logger(PricingEngineService.name);

  constructor(
    private dataPipeline: DataPipelineService,
    private explainer: ShapExplainerService,
  ) {}

  /**
   * Calcula el precio recomendado para una cancha/fecha/hora.
   * @param courtId    ID de la cancha
   * @param businessId ID del negocio dueño (para guard de autorización)
   * @param date       Fecha objetivo YYYY-MM-DD
   * @param hour       Hora específica 0-23 (opcional)
   */
  async recommend(
    courtId: string,
    businessId: string,
    date: string,
    hour?: number,
  ): Promise<PricingResult> {
    // 1. Validar autoría y obtener baseline
    const court = await this.dataPipeline.getCourtForBusiness(courtId, businessId);
    const baseline = court.price_per_hour || 50;

    // 2. Cargar ocupación histórica
    const occupancy = await this.dataPipeline.getHourlyOccupancy(courtId, 28);

    // 3. Determinar hora objetivo y su ocupación
    const targetHour = hour ?? this.pickBestHour(occupancy)?.hour ?? 19;
    const targetSlot = occupancy[targetHour];
    const totalSampleSize = occupancy.reduce((s, h) => s + h.bookedSlots, 0);

    // 4. Extraer features temporales
    const isWeekend = this.isWeekend(date);
    const isPeakHour = PRICING_CONSTANTS.PEAK_HOURS.includes(targetHour);
    const isLowHour = PRICING_CONSTANTS.LOW_HOURS.includes(targetHour);
    const hoursToSlot = this.hoursUntilSlot(date, targetHour);

    // 5. Heurística de pricing (multiplicadores encadenados con clamp final)
    const features = this.buildFeatures({
      baseline,
      occupancyRate: targetSlot.occupancyRate,
      isWeekend,
      isPeakHour,
      isLowHour,
      sampleSize: targetSlot.bookedSlots,
      districtDemandFactor: 1.0, // placeholder; refinable con datos de district
      hoursToSlot,
    });

    const { recommendedPrice, deltaPct } = this.applyHeuristic(baseline, features);

    // 6. Confianza basada en muestra
    const confidence = Math.min(
      1.0,
      PRICING_CONSTANTS.BASE_CONFIDENCE +
        totalSampleSize * PRICING_CONSTANTS.CONFIDENCE_PER_BOOKING,
    );

    // 7. Calcular SHAP-style drivers
    const shapInput: ShapInputFeature[] = [
      {
        name: "Ocupación del slot",
        value: features.occupancyRate,
        weight: 0.45,
        positiveDirection: true,
        baseline: 0.5,
      },
      {
        name: "Hora pico (18-21h)",
        value: features.isPeakHour ? 1 : 0,
        weight: 0.2,
        positiveDirection: true,
        baseline: 0.25,
      },
      {
        name: "Fin de semana",
        value: features.isWeekend ? 1 : 0,
        weight: 0.15,
        positiveDirection: true,
        baseline: 0.3,
      },
      {
        name: "Hora valle (8-11h)",
        value: features.isLowHour ? 1 : 0,
        weight: 0.1,
        positiveDirection: false,
        baseline: 0.2,
      },
      {
        name: "Anticipación de reserva",
        value: this.normalizeAnticipation(hoursToSlot),
        weight: 0.1,
        positiveDirection: false,
        baseline: 0.5,
      },
    ];

    const outputScale = baseline * 0.3; // ±30% del baseline
    const shapContributions = this.explainer.computeContributions(shapInput, outputScale);

    return {
      recommendedPrice: +recommendedPrice.toFixed(2),
      baseline,
      deltaPct: +deltaPct.toFixed(3),
      occupancyRate: +features.occupancyRate.toFixed(3),
      confidence: +confidence.toFixed(2),
      sampleSize: features.sampleSize,
      bestHour: hour ? undefined : (this.pickBestHour(occupancy)?.hour ?? undefined),
      drivers: shapContributions,
    };
  }

  // ============================================================
  // HELPERS PRIVADOS
  // ============================================================

  private buildFeatures(input: {
    baseline: number;
    occupancyRate: number;
    isWeekend: boolean;
    isPeakHour: boolean;
    isLowHour: boolean;
    sampleSize: number;
    districtDemandFactor: number;
    hoursToSlot: number;
  }): PricingFeatures {
    return { ...input };
  }

  private applyHeuristic(
    baseline: number,
    f: PricingFeatures,
  ): { recommendedPrice: number; deltaPct: number } {
    let mult = 1.0;

    // 1. Componente de ocupación (dominante)
    if (f.occupancyRate > PRICING_CONSTANTS.HIGH_OCCUPANCY_THRESHOLD) {
      // Interpolación lineal entre 1.0 (en threshold) y HIGH_OCCUPANCY_MULT (en 1.0)
      const intensity =
        (f.occupancyRate - PRICING_CONSTANTS.HIGH_OCCUPANCY_THRESHOLD) /
        (1.0 - PRICING_CONSTANTS.HIGH_OCCUPANCY_THRESHOLD);
      mult *= 1.0 + (PRICING_CONSTANTS.HIGH_OCCUPANCY_MULT - 1.0) * intensity;
    } else if (f.occupancyRate < PRICING_CONSTANTS.LOW_OCCUPANCY_THRESHOLD) {
      const intensity =
        (PRICING_CONSTANTS.LOW_OCCUPANCY_THRESHOLD - f.occupancyRate) /
        PRICING_CONSTANTS.LOW_OCCUPANCY_THRESHOLD;
      mult *= 1.0 - (1.0 - PRICING_CONSTANTS.LOW_OCCUPANCY_MULT) * intensity;
    }

    // 2. Componentes temporales (multiplicativos)
    if (f.isPeakHour) mult *= PRICING_CONSTANTS.PEAK_HOUR_MULT;
    if (f.isLowHour) mult *= PRICING_CONSTANTS.LOW_HOUR_MULT;
    if (f.isWeekend) mult *= PRICING_CONSTANTS.WEEKEND_MULT;

    // 3. Hard caps (defensivos)
    const finalMult = Math.max(
      1.0 - PRICING_CONSTANTS.MAX_DISCOUNT,
      Math.min(1.0 + PRICING_CONSTANTS.MAX_UPLIFT, mult),
    );

    const recommendedPrice = baseline * finalMult;
    const deltaPct = (recommendedPrice - baseline) / baseline;

    return {
      recommendedPrice,
      deltaPct,
    };
  }

  private pickBestHour(occupancy: HourOccupancy[]): HourOccupancy | null {
    if (!occupancy || occupancy.length === 0) return null;
    return occupancy.reduce((best, h) => (h.occupancyRate > best.occupancyRate ? h : best));
  }

  private isWeekend(date: string): boolean {
    const d = new Date(date + "T00:00:00Z");
    const day = d.getUTCDay();
    return day === 0 || day === 6;
  }

  private hoursUntilSlot(date: string, hour: number): number {
    const target = new Date(date + `T${String(hour).padStart(2, "0")}:00:00Z`).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((target - now) / (1000 * 60 * 60)));
  }

  private normalizeAnticipation(hoursToSlot: number): number {
    // 0-24h = 0 (last-minute, demanda alta), 7+ días = 1 (lejos, demanda baja)
    if (hoursToSlot <= 24) return 0.0;
    if (hoursToSlot >= 168) return 1.0;
    return (hoursToSlot - 24) / (168 - 24);
  }

  /**
   * Constantes expuestas solo para tests.
   */
  static get constants() {
    return PRICING_CONSTANTS;
  }
}

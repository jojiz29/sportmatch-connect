// ============================================================
// server/src/ai/b2b/dto/churn.dto.ts
// DTOs del Feature #23 — Churn Predictor
// POST /api/v1/ai/b2b/churn/predict
// Modelo RFM-lite (Recency, Frequency, Monetary) adaptado a B2B
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  IsIn,
  Min,
  Max,
} from "class-validator";
import { B2bAiResponseBase } from "./b2b-common.dto";

/**
 * Factor explicativo de churn (no es SHAP, es rule-based pero
 * formateado con la misma shape para uniformidad de UI).
 */
export class ChurnFactorDto {
  @ApiProperty({
    description: "Nombre legible del factor",
    example: "Sin anuncios activos hace 14 días",
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Descripción detallada del factor",
    example:
      "El último anuncio del negocio fue creado hace 14 días. Negocios activos publican al menos 1 anuncio/semana.",
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: "Severidad del factor (0-1, donde 1 = alta contribución al churn)",
    example: 0.6,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  severity!: number;

  @ApiProperty({
    description: "Acción sugerida para mitigar este factor",
    example:
      "Publicar un anuncio nuevo en la próxima semana para mantener la visibilidad en el feed.",
  })
  @IsString()
  suggestedAction!: string;
}

/**
 * Request: predecir riesgo de churn de un negocio.
 */
export class ChurnPredictRequestDto {
  @ApiProperty({
    description: "ID del negocio a analizar (profiles.id del BUSINESS)",
    example: "user-puka-power",
  })
  @IsString()
  @IsNotEmpty()
  businessId!: string;

  @ApiProperty({
    description: "Ventana de análisis en días. Default: 30",
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(90)
  lookbackDays?: number;
}

/**
 * Response: score de churn + clasificación + factores.
 */
export class ChurnPredictResponseDto extends B2bAiResponseBase {
  @ApiProperty({
    description: "Score de churn (0-1). 0 = engagement alto, 1 = riesgo máximo",
    example: 0.72,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  churnScore!: number;

  @ApiProperty({
    description: "Nivel de riesgo categórico",
    enum: ["low", "medium", "high"],
    example: "high",
  })
  @IsIn(["low", "medium", "high"])
  riskLevel!: "low" | "medium" | "high";

  @ApiProperty({
    description: "Factores que más contribuyen al score, ordenados por severity descendente",
    type: [ChurnFactorDto],
  })
  @IsArray()
  factors!: ChurnFactorDto[];

  @ApiProperty({
    description: "Días desde la última interacción del negocio (recency)",
    example: 14,
  })
  @IsInt()
  @Min(0)
  daysSinceLastInteraction!: number;

  @ApiProperty({
    description: "Cantidad de anuncios activos en el período",
    example: 2,
  })
  @IsInt()
  @Min(0)
  activeAdsCount!: number;

  @ApiProperty({
    description: "Ingresos totales (bookings) del negocio en el período en PEN",
    example: 1250.5,
  })
  @IsNumber()
  @Min(0)
  totalRevenue!: number;

  @ApiProperty({
    description: "Interacciones de usage_metrics (profile_views + ad_views) en el período",
    example: 45,
  })
  @IsInt()
  @Min(0)
  totalEngagement!: number;
}

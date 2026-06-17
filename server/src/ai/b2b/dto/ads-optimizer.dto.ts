// ============================================================
// server/src/ai/b2b/dto/ads-optimizer.dto.ts
// DTOs del Feature #21 — Ads Optimizer
// POST /api/v1/ai/b2b/ads/optimize
// Estrategia: A/B testing con UCB1 bandit + reescritura con LLM
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsArray,
  Min,
  Max,
} from "class-validator";
import { B2bAiResponseBase } from "./b2b-common.dto";

/**
 * Variante de anuncio generada o evaluada.
 */
export class AdVariantDto {
  @ApiProperty({
    description: "Identificador de la variante (A = original, B/C = reescritas)",
    example: "B",
  })
  @IsString()
  variantId!: string;

  @ApiProperty({
    description: "Título reescrito de la variante",
    example: "Torneo Relámpago Pádel — Inscríbete Hoy",
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: "Descripción reescrita de la variante",
    example:
      "Quedan solo 8 cupos. Nivel intermedio. Premios garantizados. Arma dupla o regístrate solo.",
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: "Estilo emocional usado para esta variante",
    enum: ["original", "emocional", "racional", "urgencia"],
    example: "emocional",
  })
  @IsIn(["original", "emocional", "racional", "urgencia"])
  style!: "original" | "emocional" | "racional" | "urgencia";

  @ApiProperty({
    description: "Score de la variante (mayor = mejor). Calculado por UCB1 sobre CTR histórico",
    example: 0.087,
  })
  @IsNumber()
  score!: number;

  @ApiProperty({
    description: "Predicción de CTR (0-1) basada en benchmarks del business",
    example: 0.12,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  predictedCtr!: number;
}

/**
 * Request: optimizar el rendimiento de un anuncio.
 * El negocio pide que se generen variantes y se recomiende la mejor.
 */
export class AdsOptimizeRequestDto {
  @ApiProperty({
    description: "ID del anuncio a optimizar (business_ads.id)",
    example: "ad-puka-tournament",
  })
  @IsString()
  @IsNotEmpty()
  adId!: string;

  @ApiProperty({
    description: "Objetivo de optimización",
    enum: ["ctr", "conversions"],
    example: "ctr",
  })
  @IsIn(["ctr", "conversions"])
  goal!: "ctr" | "conversions";

  @ApiProperty({
    description: "Número de variantes a generar (1-3). Default: 3",
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  variantCount?: number;
}

/**
 * Response: variantes evaluadas + recomendación.
 */
export class AdsOptimizeResponseDto extends B2bAiResponseBase {
  @ApiProperty({
    description: "Variantes generadas/evaluadas, ordenadas por score descendente",
    type: [AdVariantDto],
  })
  @IsArray()
  variants!: AdVariantDto[];

  @ApiProperty({
    description: "ID de la variante recomendada (mejor score)",
    example: "B",
  })
  @IsString()
  recommendation!: string;

  @ApiProperty({
    description:
      "Lift esperado al cambiar de la variante original a la recomendada (puntos porcentuales de CTR)",
    example: 0.04,
  })
  @IsNumber()
  expectedLift!: number;

  @ApiProperty({
    description: "CTR actual del anuncio (baseline)",
    example: 0.08,
  })
  currentCtr!: number;

  @ApiProperty({
    description: "Total de vistas acumuladas del anuncio",
    example: 450,
  })
  @IsNumber()
  @Min(0)
  sampleSize!: number;
}

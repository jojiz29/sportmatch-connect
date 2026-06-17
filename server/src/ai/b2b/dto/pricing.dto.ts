// ============================================================
// server/src/ai/b2b/dto/pricing.dto.ts
// DTOs del Feature #9 — Dynamic Pricing
// POST /api/v1/ai/b2b/pricing
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsNumber,
} from "class-validator";
import { B2bAiResponseBase } from "./b2b-common.dto";

/**
 * Request: el negocio pide recomendación de precio para una cancha/fecha/hora.
 * Si no se pasa `hour`, se devuelve la mejor hora del día.
 */
export class PricingRequestDto {
  @ApiProperty({
    description: "ID de la cancha (court) sobre la que se predice el precio",
    example: "court-abc-123",
  })
  @IsString()
  @IsNotEmpty()
  courtId!: string;

  @ApiProperty({
    description: "Fecha objetivo en formato YYYY-MM-DD",
    example: "2026-06-20",
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: "Hora específica del slot (0-23). Si se omite, devuelve la mejor hora del día.",
    example: 19,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  hour?: number;
}

/**
 * Response: precio recomendado + baseline + nivel de confianza.
 */
export class PricingResponseDto extends B2bAiResponseBase {
  @ApiProperty({
    description: "Precio recomendado en PEN para el slot solicitado",
    example: 62.5,
  })
  recommendedPrice!: number;

  @ApiProperty({
    description: "Precio base (precio_per_hour de la cancha) en PEN",
    example: 50.0,
  })
  baseline!: number;

  @ApiProperty({
    description: "Cambio porcentual respecto al baseline (positivo = subió, negativo = bajó)",
    example: 0.25,
  })
  deltaPct!: number;

  @ApiProperty({
    description: "Tasa de ocupación esperada para el slot (0-1)",
    example: 0.85,
  })
  occupancyRate!: number;

  @ApiProperty({
    description: "Nivel de confianza del modelo (0-1). Bajo = pocos datos históricos.",
    example: 0.78,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @ApiProperty({
    description: "Cantidad de reservas históricas usadas para la predicción",
    example: 24,
  })
  sampleSize!: number;

  @ApiProperty({
    description: "Mejor hora del día (0-23) si el request no especificó `hour`",
    example: 19,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  bestHour?: number;
}

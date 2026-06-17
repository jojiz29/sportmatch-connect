// ============================================================
// server/src/ai/b2b/dto/b2b-common.dto.ts
// DTOs comunes para los endpoints B2B-AI
// Feature #9 Dynamic Pricing, #21 Ads Optimizer, #23 Churn Predictor
// Todos los endpoints retornan una shape uniforme con SHAP-style
// drivers y una narrative generada por Vertex AI.
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, IsObject, IsArray, Min, Max } from "class-validator";

/**
 * Contribución marginal de una feature a la predicción (SHAP-style).
 * El valor real (no la lib SHAP original) se calcula como la diferencia
 * entre el valor predicho con la feature y el baseline medio.
 * Ver docs/b2b-ai/shap-explainability.md para el disclaimer académico.
 */
export class ShapFeatureDto {
  @ApiProperty({
    description: "Nombre legible de la feature",
    example: "Ocupación del slot",
  })
  @IsString()
  feature!: string;

  @ApiProperty({
    description:
      "Contribución marginal al precio recomendado (en PEN). Positivo = subió, negativo = bajó.",
    example: 7.5,
  })
  @IsNumber()
  contribution!: number;

  @ApiProperty({
    description: "Valor crudo observado para esta feature",
    example: 0.85,
  })
  @IsNumber()
  value!: number;

  @ApiProperty({
    description: "Peso relativo 0-1 usado en el modelo",
    example: 0.4,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}

/**
 * Metadata estándar devuelta por todos los endpoints B2B-AI.
 * Espejo del contrato que ya usan los endpoints /ai/chat y /ai/text/*.
 */
export class AiMetadataDto {
  @ApiProperty({ description: "Tokens consumidos por Vertex AI", example: 312 })
  tokens!: number;

  @ApiProperty({ description: "Modelo LLM usado", example: "gemini-2.5-flash" })
  model!: string;

  @ApiProperty({ description: "Latencia total del endpoint en ms", example: 1450 })
  latencyMs!: number;
}

/**
 * Helper: forma base de la respuesta B2B-AI.
 * Las 3 features (pricing/ads/churn) extienden esto añadiendo sus campos
 * específicos + un campo tipado.
 */
export class B2bAiResponseBase {
  @ApiProperty({
    description: "Lista de contribuciones SHAP-style que explican la predicción",
    type: [ShapFeatureDto],
  })
  @IsArray()
  drivers!: ShapFeatureDto[];

  @ApiProperty({
    description: "Narrativa en lenguaje natural generada por Vertex AI",
    example:
      "El precio sube 12% porque la ocupación del sábado a las 19h ha sido del 85% en las últimas 4 semanas...",
  })
  @IsString()
  narrative!: string;

  @ApiProperty({ description: "Metadata de la llamada al LLM", type: AiMetadataDto })
  @IsObject()
  metadata!: AiMetadataDto;
}

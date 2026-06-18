import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export const RECOMMENDATION_TYPES = [
  "overview",
  "players",
  "sports",
  "challenges",
  "achievements",
  "content",
] as const;

export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export class AiRecommendationRequestDto {
  @ApiProperty({
    description: "Tipo de recomendacion que se quiere priorizar",
    enum: RECOMMENDATION_TYPES,
    required: false,
    default: "overview",
  })
  @IsOptional()
  @IsEnum(RECOMMENDATION_TYPES)
  type?: RecommendationType = "overview";

  @ApiProperty({
    description: "Cantidad maxima de tarjetas principales",
    example: 6,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 6;

  @ApiProperty({
    description: "Idioma de salida",
    enum: ["es", "en", "pt"],
    required: false,
    default: "es",
  })
  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt" = "es";
}

// ============================================================
// vision-analyze.dto.ts — DTO para análisis de visión IA (Fase 1)
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEnum, MaxLength, IsNotEmpty } from "class-validator";

export enum VisionAnalysisType {
  FAKE_PROFILE = "fake-profile",
  FORM_ANALYSIS = "form-analysis",
}

export class AnalyzeVisionDto {
  @ApiProperty({
    example: "https://example.com/image.jpg",
    description: "URL pública o ruta de almacenamiento de la imagen a analizar",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  imageUrl!: string;

  @ApiProperty({
    example: "fake-profile",
    description: "Tipo de análisis visual (fake-profile o form-analysis)",
    enum: VisionAnalysisType,
  })
  @IsEnum(VisionAnalysisType, {
    message: "El tipo de análisis debe ser 'fake-profile' o 'form-analysis'",
  })
  analysisType!: VisionAnalysisType;
}

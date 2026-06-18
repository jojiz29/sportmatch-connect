/* eslint-disable no-control-regex */
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from "class-validator";
import { Transform, TransformFnParams } from "class-transformer";

function sanitizeVisionText({ value }: TransformFnParams): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .trim();
}

// ==============================================================
// IMAGE ANALYSIS (Día 1-2)
// ==============================================================

export class AnalyzeImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(sanitizeVisionText)
  prompt?: string;

  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

export class AnalyzeImageResponseDto {
  @ApiProperty() analysis!: string;
  @ApiProperty() latencyMs!: number;
  @ApiProperty() model!: string;
  @ApiProperty() tokens!: number;
}

// ==============================================================
// VIDEO ANALYSIS (Día 1-2)
// ==============================================================

export class AnalyzeVideoDto {
  @IsOptional()
  @IsString()
  frameCount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(sanitizeVisionText)
  prompt?: string;

  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

export class AnalyzeVideoResponseDto {
  @ApiProperty() analysis!: string;
  @ApiProperty({ required: false }) score?: number;
  @ApiProperty({ required: false }) recommendations?: string[];
  @ApiProperty() latencyMs!: number;
  @ApiProperty() framesAnalyzed!: number;
  @ApiProperty() model!: string;
  @ApiProperty() tokens!: number;
}

// ==============================================================
// #8 — FORM ANALYZER (postura deportiva)
// ==============================================================

export class FormAnalyzeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  sport!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(sanitizeVisionText)
  prompt?: string;

  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

export class FormAnalyzeResponseDto {
  @ApiProperty({ description: "Score de técnica deportiva 0-100", example: 78 })
  score!: number;

  @ApiProperty({
    description: "Análisis detallado de la postura",
    example: "Buena alineación corporal pero la rodilla está muy flexionada...",
  })
  analysis!: string;

  @ApiProperty({
    description: "Recomendaciones específicas",
    example: ["Flexiona menos la rodilla al impactar", "Mantén el torso erguido"],
  })
  recommendations!: string[];

  @ApiProperty({
    description: "Puntos clave identificados",
    example: ["hombros alineados", "cadera estable"],
  })
  keyPoints!: string[];

  @ApiProperty({ description: "Nivel detectado", example: "intermedio" })
  detectedLevel!: string;

  @ApiProperty() latencyMs!: number;
  @ApiProperty() framesAnalyzed!: number;
  @ApiProperty() model!: string;
  @ApiProperty() tokens!: number;
}

// ==============================================================
// #26 — FAKE PROFILE DETECTOR
// ==============================================================

export class FakeProfileResponseDto {
  @ApiProperty({
    description: "Si existe evidencia alta de imagen artificial, alterada o sin persona real",
    example: false,
  })
  isFake!: boolean;

  @ApiProperty({
    description: "Porcentaje de veracidad de persona real 0-100 (mayor = mas verificable)",
    example: 92,
  })
  authenticityScore!: number;

  @ApiProperty({
    description: "Explicación del análisis",
    example:
      "La imagen presenta textura natural de piel, sombras coherentes y detalles realistas en los ojos.",
  })
  explanation!: string;

  @ApiProperty({ description: "Nivel de confianza 0-1", example: 0.95 })
  confidence!: number;

  @ApiProperty({
    description: "Señales específicas detectadas",
    example: ["textura de piel natural", "sombras coherentes", "detalles de ojos realistas"],
  })
  signals!: string[];

  @ApiProperty() latencyMs!: number;
  @ApiProperty() model!: string;
  @ApiProperty() tokens!: number;
}

// ==============================================================
// #32 — DNI VERIFICATION 2.0
// ==============================================================

export class DniVerifyResponseDto {
  @ApiProperty({ description: "Si el rostro del selfie coincide con el del DNI", example: true })
  match!: boolean;

  @ApiProperty({ description: "Nivel de confianza del face match 0-1", example: 0.97 })
  confidence!: number;

  @ApiProperty({
    description: "Mensaje descriptivo del resultado",
    example: "El rostro coincide con el DNI proporcionado. Identidad verificada.",
  })
  message!: string;

  @ApiProperty({
    description: "Nivel de calidad del selfie",
    example: "good",
    enum: ["poor", "fair", "good", "excellent"],
  })
  selfieQuality!: string;

  @ApiProperty({
    description: "Nivel de calidad del DNI",
    example: "good",
    enum: ["poor", "fair", "good", "excellent"],
  })
  dniQuality!: string;

  @ApiProperty({ description: "Sugerencias si la calidad es baja", required: false })
  suggestions?: string[];

  @ApiProperty() latencyMs!: number;
  @ApiProperty() model!: string;
  @ApiProperty() tokens!: number;
}

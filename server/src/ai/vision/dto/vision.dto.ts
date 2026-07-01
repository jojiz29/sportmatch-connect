/* eslint-disable no-control-regex */
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from "class-validator";
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

// ==============================================================
// NUTRICIÓN 360 — Análisis nutricional de comida por foto
// ==============================================================

export class MacrosDto {
  @ApiProperty({ description: "Proteínas en gramos", example: 25 })
  protein!: number;

  @ApiProperty({ description: "Carbohidratos en gramos", example: 50 })
  carbs!: number;

  @ApiProperty({ description: "Grasas en gramos", example: 15 })
  fat!: number;

  @ApiProperty({ description: "Fibra en gramos", example: 8 })
  fiber!: number;
}

export class MicronutrientDto {
  @ApiProperty({ description: "Nombre del micronutriente", example: "Vitamina C" })
  name!: string;

  @ApiProperty({ description: "Cantidad estimada", example: "15mg" })
  amount!: string;
}

export class Nutrition360ResponseDto {
  @ApiProperty({
    description: "Nombre del plato detectado",
    example: "Pollo a la plancha con ensalada",
  })
  mealName!: string;

  @ApiProperty({ description: "Calorías totales estimadas", example: 450 })
  calories!: number;

  @ApiProperty({ description: "Macronutrientes" })
  macros!: MacrosDto;

  @ApiProperty({ description: "Tamaño de porción estimado", example: "mediana (~250g)" })
  portionSize!: string;

  @ApiProperty({ description: "Puntuación de salud 0-100", example: 78 })
  healthScore!: number;

  @ApiProperty({
    description: "Micronutrientes detectados",
    required: false,
    type: [MicronutrientDto],
  })
  micronutrients?: MicronutrientDto[];

  @ApiProperty({
    description: "Análisis nutricional detallado",
    example: "Esta comida ofrece un balance equilibrado...",
  })
  analysis!: string;

  @ApiProperty({
    description: "Recomendaciones para mejorar la alimentación",
    example: ["Añade más vegetales de hoja verde", "Reduce el sodio"],
  })
  recommendations!: string[];

  @ApiProperty() latencyMs!: number;
  @ApiProperty() model!: string;
  @ApiProperty() tokens!: number;
}

// ==============================================================
// PLAN ALIMENTICIO — Meal Planner personalizado por IA
// ==============================================================

export class MealPlanDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: "Preferencias alimenticias del usuario",
    example: ["pollo", "arroz", "ensalada"],
  })
  preferences!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: "Restricciones alimentarias",
    required: false,
    example: ["sin gluten"],
  })
  restrictions?: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "Objetivo del plan",
    example: "perder_peso",
    enum: ["perder_peso", "ganar_musculo", "mantener", "salud_general"],
  })
  goal!: string;

  @IsNumber()
  @Min(3)
  @Max(6)
  @ApiProperty({ description: "Comidas por día", example: 4, minimum: 3, maximum: 6 })
  mealsPerDay!: number;

  @IsNumber()
  @Min(1)
  @Max(90)
  @ApiProperty({ description: "Duración del plan en días", example: 7, minimum: 1, maximum: 90 })
  durationDays!: number;

  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  @ApiProperty({ required: false, enum: ["es", "en", "pt"] })
  language?: "es" | "en" | "pt";
}

export class MealItemDto {
  @ApiProperty({ description: "Nombre de la comida", example: "Pollo salteado con verduras" })
  name!: string;

  @ApiProperty({
    description: "Tipo de comida",
    example: "almuerzo",
    enum: ["desayuno", "almuerzo", "cena", "snack", "post-entreno"],
  })
  type!: string;

  @ApiProperty({ description: "Calorías", example: 450 })
  calories!: number;

  @ApiProperty({ description: "Proteínas en gramos", example: 35 })
  protein!: number;

  @ApiProperty({ description: "Carbohidratos en gramos", example: 40 })
  carbs!: number;

  @ApiProperty({ description: "Grasas en gramos", example: 12 })
  fat!: number;

  @ApiProperty({ description: "Ingredientes", example: ["pollo", "brócoli", "arroz integral"] })
  ingredients!: string[];

  @ApiProperty({
    description: "Instrucciones de preparación",
    example: "Saltea el pollo con las verduras...",
  })
  preparation!: string;
}

export class DayPlanDto {
  @ApiProperty({ description: "Número de día", example: 1 })
  day!: number;

  @ApiProperty({ description: "Comidas del día", type: [MealItemDto] })
  meals!: MealItemDto[];

  @ApiProperty({ description: "Calorías totales del día", example: 1850 })
  totalCalories!: number;

  @ApiProperty({ description: "Proteínas totales del día en gramos", example: 120 })
  totalProtein!: number;

  @ApiProperty({ description: "Carbohidratos totales del día en gramos", example: 200 })
  totalCarbs!: number;

  @ApiProperty({ description: "Grasas totales del día en gramos", example: 55 })
  totalFat!: number;
}

export class MealPlanResponseDto {
  @ApiProperty({ description: "Plan de comidas por día", type: [DayPlanDto] })
  mealPlan!: DayPlanDto[];

  @ApiProperty({ description: "Resumen del plan", example: "Plan balanceado..." })
  summary!: string;

  @ApiProperty({
    description: "Consejos para mantener el hábito",
    example: ["Prepara tus comidas con anticipación"],
  })
  tips!: string[];

  @ApiProperty({
    description: "Notas sobre sostenibilidad del plan",
    example: "Este plan prioriza...",
  })
  sustainabilityNotes!: string;

  @ApiProperty() latencyMs!: number;
  @ApiProperty() model!: string;
  @ApiProperty() tokens!: number;
}

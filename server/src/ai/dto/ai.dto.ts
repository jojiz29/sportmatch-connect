/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
// ============================================================
// server/src/ai/dto/ai.dto.ts — DTOs para endpoints AI (text + voice)
// Validación estricta + sanitización de inputs
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  Max,
} from "class-validator";
import { Transform, TransformFnParams } from "class-transformer";

/**
 * Sanitiza el input del usuario para prevenir inyecciones de prompt
 * y caracteres de control maliciosos.
 */
export function sanitizeAiText({ value }: TransformFnParams): string {
  if (typeof value !== "string") return "";
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/data:text\/html/gi, "")
      .trim()
  );
}

// ==============================================================
// CHAT: history support
// ==============================================================

export class ChatMessageDto {
  @ApiProperty({ description: "Rol del mensaje", example: "user", enum: ["user", "assistant"] })
  @IsEnum(["user", "assistant"], { message: "El rol debe ser user o assistant" })
  role!: "user" | "assistant";

  @ApiProperty({ description: "Contenido del mensaje", example: "Hola Sporty" })
  @IsString()
  @MaxLength(1000, { message: "El mensaje no puede exceder 1000 caracteres" })
  @Transform(sanitizeAiText)
  text!: string;
}

// ==============================================================
// TEXT ENDPOINTS — Smart Comments (#2)
// ==============================================================

export class CommentSuggestionDto {
  @ApiProperty({
    description: "Contexto del post original para generar sugerencias contextuales",
    example: "Gran partido de tenis hoy con Ana Sofía en SportMatch Arena",
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  @Transform(sanitizeAiText)
  postContext!: string;

  @ApiProperty({
    description: "Texto parcial que el usuario está escribiendo",
    example: "Qué bueno el",
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(sanitizeAiText)
  partialText!: string;

  @ApiProperty({
    description: "Idioma del usuario para respuestas localizadas",
    example: "es",
    enum: ["es", "en", "pt"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

// ==============================================================
// TEXT ENDPOINTS — Auto-Hashtags (#3)
// ==============================================================

export class HashtagsDto {
  @ApiProperty({
    description: "Contenido del post o comentario",
    example: "Pichanguita de fútbol 7 mañana en Miraflores, nivel intermedio",
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(sanitizeAiText)
  content!: string;

  @ApiProperty({ description: "Mínimo de tags a generar", example: 3, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  minTags?: number;

  @ApiProperty({ description: "Máximo de tags a generar", example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  maxTags?: number;

  @ApiProperty({
    description: "Idioma del usuario",
    example: "es",
    enum: ["es", "en", "pt"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

// ==============================================================
// TEXT ENDPOINTS — Content Moderation (#6)
// ==============================================================

export class ModerateTextDto {
  @ApiProperty({
    description: "Texto a moderar",
    example: "Este es un mensaje normal de prueba",
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(sanitizeAiText)
  text!: string;

  @ApiProperty({
    description: "Contexto del texto",
    example: "comment",
    enum: ["post", "comment", "bio", "ad"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["post", "comment", "bio", "ad"])
  context?: "post" | "comment" | "bio" | "ad";
}

// ==============================================================
// COACH — Court Recommendations
// ==============================================================

export class CoachRecommendationDto {
  @ApiProperty({
    description: "Deporte preferido del usuario",
    example: "pádel",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sport?: string;

  @ApiProperty({
    description: "Ubicación preferida (ciudad/distrito)",
    example: "Miraflores",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({
    description: "Nivel de juego",
    example: "intermedio",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  level?: string;

  @ApiProperty({
    description: "Preferencias adicionales (ej. 'techada', 'iluminación')",
    example: "techada",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  preferences?: string;

  @ApiProperty({
    description: "Idioma del usuario",
    example: "es",
    enum: ["es", "en", "pt"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

export class ModerationResultDto {
  @ApiProperty({ description: "Si el texto es seguro según las políticas", example: true })
  safe!: boolean;

  @ApiProperty({ description: "Si el texto fue marcado para revisión", example: false })
  flagged!: boolean;

  @ApiProperty({ description: "Scores de toxicidad por categoría" })
  categorias!: {
    toxicity: number;
    harassment: number;
    sexual: number;
    violence: number;
  };

  @ApiProperty({ description: "Nivel de confianza de la clasificación 0-1", example: 0.95 })
  confidencia!: number;

  @ApiProperty({ description: "Preview del texto moderado", example: "Este es un..." })
  preview!: string;
}

export class ModerateAdvancedDto {
  @ApiProperty({
    description: "ID del usuario que genera el contenido",
    example: "user-123",
  })
  @IsString()
  @IsNotEmpty({ message: "El ID de usuario es obligatorio" })
  userId!: string;

  @ApiProperty({
    description: "Texto a moderar",
    example: "Este es un mensaje de prueba",
  })
  @IsString()
  @IsNotEmpty({ message: "El contenido a moderar es obligatorio" })
  @MaxLength(2000, { message: "El contenido no puede exceder 2000 caracteres" })
  @Transform(sanitizeAiText)
  content!: string;

  @ApiProperty({
    description: "Contexto del contenido",
    example: "mensaje",
    enum: ["mensaje", "comentario", "perfil"],
  })
  @IsEnum(["mensaje", "comentario", "perfil"], { message: "Contexto no válido" })
  contextType!: "mensaje" | "comentario" | "perfil";

  @ApiProperty({
    description: "Metadatos adicionales opcionales",
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class SignalDto {
  @ApiProperty({ description: "Nombre del modelo o señal", example: "vertex-ai" })
  name!: string;

  @ApiProperty({ description: "Puntuación de riesgo de 0 a 100", example: 45 })
  score!: number;

  @ApiProperty({ description: "Explicación de la señal", example: "Contenido seguro" })
  description?: string;
}

export class ModerateAdvancedResultDto {
  @ApiProperty({ description: "Score final calculado por el ensemble de 0 a 100", example: 45 })
  ensemble_score!: number;

  @ApiProperty({ description: "Listado de señales individuales evaluadas", type: [SignalDto] })
  signals!: SignalDto[];

  @ApiProperty({
    description: "Acción recomendada",
    example: "allow",
    enum: ["allow", "warn", "block"],
  })
  action_recommended!: "allow" | "warn" | "block";

  @ApiProperty({
    description: "Razonamiento detrás de la recomendación",
    example: "Todas las señales indican contenido limpio.",
  })
  reasoning!: string;
}

export class CoachChatDto {
  @ApiProperty({ description: "Mensaje actual enviado al Coach" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Transform(sanitizeAiText)
  message!: string;

  @ApiProperty({
    description: "Historial de mensajes previos",
    type: [ChatMessageDto],
    required: false,
  })
  @IsOptional()
  history?: ChatMessageDto[];

  @ApiProperty({ description: "Idioma", default: "es" })
  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

export class RecommendSnackDto {
  @ApiProperty({ description: "ID del partido opcional", required: false })
  @IsOptional()
  @IsString()
  matchId?: string;

  @ApiProperty({ description: "Deporte practicado" })
  @IsString()
  @IsNotEmpty()
  sport!: string;

  @ApiProperty({ description: "Duración en minutos" })
  @IsNumber()
  @Min(1)
  duration!: number;

  @ApiProperty({ description: "Intensidad", enum: ["baja", "media", "alta"] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(["baja", "media", "alta", "low", "medium", "high"])
  intensity!: string;

  @ApiProperty({ description: "Idioma", default: "es" })
  @IsOptional()
  @IsEnum(["es", "en", "pt"])
  language?: "es" | "en" | "pt";
}

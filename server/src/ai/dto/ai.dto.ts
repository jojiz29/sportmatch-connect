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

// ============================================================
// chat.dto.ts — DTO de entrada/salida para el endpoint de chat
// Protección contra inyección de prompts + validación estricta
// + soporte para historial conversacional (ventana deslizante)
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";
import { Type, Transform, TransformFnParams } from "class-transformer";
import { ChatMessageDto } from "./ai.dto";

/**
 * Sanitiza el input del usuario para prevenir inyecciones de prompt
 * y caracteres de control maliciosos.
 */
function sanitizeMessage({ value }: TransformFnParams): string {
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

export class ChatRequestDto {
  @ApiProperty({
    description: "Mensaje del usuario para el asistente deportivo IA",
    example: "¿Hay canchas de fútbol 7 cerca de mi ubicación?",
    minLength: 1,
    maxLength: 1000,
  })
  @IsString({ message: "El mensaje debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El mensaje no puede estar vacío" })
  @MinLength(1, { message: "El mensaje debe tener al menos 1 carácter" })
  @MaxLength(1000, { message: "El mensaje no puede exceder 1000 caracteres" })
  @Matches(/^[\s\S]+$/, { message: "El mensaje contiene caracteres no permitidos" })
  @Transform(sanitizeMessage)
  message!: string;

  @ApiProperty({
    description: "Idioma del usuario para respuestas localizadas",
    example: "es",
    enum: ["es", "en", "pt"],
    required: false,
  })
  @IsOptional()
  @Matches(/^(es|en|pt)$/, { message: "Idioma debe ser es, en o pt" })
  language?: "es" | "en" | "pt";

  @ApiProperty({
    description:
      "Historial conversacional para mantener contexto (ventana deslizante últimos 5 turnos)",
    type: [ChatMessageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}

export class ChatResponseMetadataDto {
  @ApiProperty({ example: 150, description: "Tokens consumidos en la respuesta" })
  tokens!: number;

  @ApiProperty({ example: "gemini-2.5-flash", description: "Modelo de IA utilizado" })
  model!: string;

  @ApiProperty({ example: 1200, description: "Latencia en milisegundos" })
  latencyMs!: number;
}

export class ChatResponseDto {
  @ApiProperty({
    description: "Respuesta generada por Vertex AI",
    example: "He encontrado 3 canchas de fútbol 7 a menos de 2 km de tu ubicación...",
  })
  reply!: string;

  @ApiProperty({
    description: "Sugerencias contextuales para el usuario",
    example: ["Ver canchas", "Reservar ahora", "Buscar partidos"],
    type: [String],
  })
  suggestions!: string[];

  @ApiProperty({ type: ChatResponseMetadataDto })
  metadata!: ChatResponseMetadataDto;
}

// ==============================================================
// SCRUM-345 — DTO para el endpoint de bienvenida del LLM
// Genera el primer mensaje de Sporty dinámicamente con Vertex AI.
// NO devuelve texto hardcoded: el LLM produce el contenido en
// el idioma solicitado, considerando el contexto del usuario.
// ==============================================================
export class WelcomeRequestDto {
  @ApiProperty({
    description: "Idioma activo del usuario",
    example: "es",
    enum: ["es", "en", "pt"],
    required: false,
  })
  @IsOptional()
  @IsEnum(["es", "en", "pt"], { message: "Idioma debe ser es, en o pt" })
  language?: "es" | "en" | "pt";
}

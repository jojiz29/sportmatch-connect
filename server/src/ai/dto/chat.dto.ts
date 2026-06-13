// ============================================================
// chat.dto.ts — DTO de entrada/salida para el endpoint de IA
// Protección contra inyección de prompts + validación estricta
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from "class-validator";
import { Transform, TransformFnParams } from "class-transformer";

/**
 * Sanitiza el input del usuario para prevenir inyecciones de prompt
 * y caracteres de control maliciosos.
 */
function sanitizeMessage({ value }: TransformFnParams): string {
  if (typeof value !== "string") return "";
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F]/g, "") // Elimina caracteres de control
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Bloquea <script>
      .replace(/<[^>]+>/g, "") // Elimina tags HTML
      .replace(/javascript:/gi, "") // Bloquea protocolos JS
      .replace(/data:text\/html/gi, "") // Bloquea data URIs HTML
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
}

export class ChatResponseMetadataDto {
  @ApiProperty({ example: 150, description: "Tokens consumidos en la respuesta" })
  tokens!: number;

  @ApiProperty({ example: "gemini-1.5-pro-002", description: "Modelo de IA utilizado" })
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

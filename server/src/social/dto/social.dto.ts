// ============================================================
// server/src/social/dto/social.dto.ts — DTOs para SocialModule
// Sprint V2.1 — Social Graph & Followers
// ============================================================

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

// ==============================================================
// DTO para parámetros de ruta con userId
// ==============================================================
export class UserIdParamDto {
  @ApiProperty({ description: "UUID del usuario", example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

// ==============================================================
// DTO para parámetros de paginación
// ==============================================================
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: "Número de página (1-based)", example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Resultados por página", example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 20)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ==============================================================
// DTO para el endpoint de sugerencias (discover)
// ==============================================================
export class SuggestionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Filtrar por deporte", example: "pádel" })
  @IsOptional()
  @IsString()
  sport?: string;
}

// ==============================================================
// DTO para bloqueo de usuarios
// ==============================================================
export class BlockUserDto {
  @ApiProperty({
    description: "UUID del usuario a bloquear",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @ApiPropertyOptional({
    description: "Motivo del bloqueo (opcional)",
    example: "Comportamiento inapropiado",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ==============================================================
// DTOs de respuesta tipada
// ==============================================================
export interface FollowStatsResponse {
  followers_count: number;
  following_count: number;
}

export interface FollowSuggestionsResponse {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  preferred_sports: string[];
  trust_score: number | null;
  city: string | null;
  followers_count: number;
  matches_played: number;
  common_sports_count: number;
}

export interface FollowUserResponse {
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export interface ToggleLikeResponse {
  liked: boolean;
  likes_count: number;
}

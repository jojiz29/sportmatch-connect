/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
// ============================================================
// server/src/matchmaking/dto/matchmaking.dto.ts — DTOs
// Sprint V2.3 — Matchmaking & Elo System
// ============================================================

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

// ==============================================================
// ENTER QUEUE
// ==============================================================
export class EnterQueueDto {
  @ApiProperty({ description: "Deporte", example: "pádel" })
  @IsString()
  @IsNotEmpty()
  sport!: string;

  @ApiProperty({ description: "Latitud actual", example: -12.0464 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ description: "Longitud actual", example: -77.0428 })
  @IsNumber()
  lng!: number;

  @ApiPropertyOptional({ description: "Radio en km", example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  radius_km?: number = 10;
}

// ==============================================================
// SWIPE
// ==============================================================
export class SwipeDto {
  @ApiProperty({
    description: "UUID del usuario objetivo",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  @IsNotEmpty()
  target_id!: string;

  @ApiProperty({ description: "Acción del swipe", example: "LIKE", enum: ["LIKE", "PASS"] })
  @IsEnum(["LIKE", "PASS"])
  action!: "LIKE" | "PASS";

  @ApiProperty({ description: "Deporte del swipe", example: "pádel" })
  @IsString()
  @IsNotEmpty()
  sport!: string;
}

// ==============================================================
// MATCH RESULT
// ==============================================================
export class ReportResultDto {
  @ApiProperty({ description: "UUID del match", example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsString()
  @IsNotEmpty()
  match_id!: string;

  @ApiProperty({ description: "UUID del ganador", example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsString()
  @IsNotEmpty()
  winner_id!: string;

  @ApiPropertyOptional({ description: "Marcador local", example: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  score_home?: number;

  @ApiPropertyOptional({ description: "Marcador visitante", example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  score_away?: number;
}

// ==============================================================
// RESPUESTAS TIPADAS
// ==============================================================
export interface QueueEntryResponse {
  user_id: string;
  sport: string;
  status: string;
  radius_km: number;
  entered_at: string;
  matched_with?: string;
  matched_at?: string;
}

export interface SwipeResponse {
  mutual_like: boolean;
  action?: string;
  conversation_id?: string | null;
}

export interface MatchResultResponse {
  match_id: string;
  winner_id: string;
  status: string;
  score_home?: number;
  score_away?: number;
  elo_results?: unknown[];
}

export interface FindMatchResponse {
  matched: boolean;
  reason?: string;
  match_user_id?: string;
  distance_km?: number;
  sport?: string;
  queued_at?: string;
}

export interface EloRatingResponse {
  user_id: string;
  sport: string;
  elo_rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  last_match_at: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  sport: string;
  name: string | null;
  avatar_url: string | null;
  elo_rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  rank: number;
}

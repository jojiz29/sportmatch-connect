import { Transform, TransformFnParams } from "class-transformer";
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export const ENGAGEMENT_EVENT_TYPES = [
  "POST_CREATED",
  "RECOMMENDATION_VIEWED",
  "PLAYER_CONNECTED",
  "PLAYER_DISMISSED",
  "MATCH_JOINED",
  "MATCH_COMPLETED",
  "SPORT_SELECTED",
  "DAILY_CHALLENGE_STARTED",
  "CHALLENGE_COMPLETED",
  "ACHIEVEMENT_SAVED",
  "ACHIEVEMENT_UNLOCKED",
  "SMART_NOTIFICATION_SAVED",
  "TOUR_NARRATIVE_SAVED",
  "ENGAGEMENT_CONTENT_SAVED",
  "ENGAGEMENT_EMBEDDING_REBUILT",
  "AI_RECOMMENDATION_GENERATED",
  "AI_RECOMMENDATION_OPENED",
  "AI_RECOMMENDATION_LIKED",
  "AI_RECOMMENDATION_DISMISSED",
] as const;

export type EngagementEventType = (typeof ENGAGEMENT_EVENT_TYPES)[number];

function trimText({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

/**
 * Contrato de una señal privada de engagement.
 * El metadata debe contener datos estructurados, nunca texto completo sensible.
 */
export class CreateEngagementEventDto {
  @IsString()
  @IsIn(ENGAGEMENT_EVENT_TYPES)
  eventType!: EngagementEventType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(trimText)
  entityType?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(trimText)
  entityId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trimText)
  dedupeKey?: string;
}

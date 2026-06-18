import { Transform, TransformFnParams } from "class-transformer";
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

function trimText({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

/**
 * Reto diario sugerido por el motor de recomendaciones.
 * Se persiste para que no quede solo como evento historico.
 */
export class SaveEngagementChallengeDto {
  @IsString()
  @MaxLength(120)
  @Transform(trimText)
  title!: string;

  @IsString()
  @MaxLength(600)
  @Transform(trimText)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Transform(trimText)
  rewardHint?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * Estado que una empresa puede asignar a un reto realizado en una de sus sedes.
 * Se guarda en metadata para respetar el constraint existente de status.
 */
export class UpdateBusinessChallengeValidationDto {
  @IsIn(["pending", "approved", "rejected"])
  status!: "pending" | "approved" | "rejected";

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(trimText)
  note?: string;
}

/**
 * Logro sugerido por el motor de recomendaciones.
 * Guardarlo indica interes; desbloquearlo puede agregarse luego desde reglas reales.
 */
export class SaveEngagementAchievementDto {
  @IsString()
  @MaxLength(120)
  @Transform(trimText)
  name!: string;

  @IsString()
  @MaxLength(600)
  @Transform(trimText)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  @Transform(trimText)
  unlockCondition?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * Contenido personalizado generado por el motor de recomendaciones.
 * Se usa para guardar newsletter semanal y narrativa deportiva en una tabla propia.
 */
export class SaveEngagementContentDto {
  @IsIn(["weekly_brief", "tour_narrative"])
  contentType!: "weekly_brief" | "tour_narrative";

  @IsString()
  @MaxLength(140)
  @Transform(trimText)
  title!: string;

  @IsString()
  @MaxLength(1600)
  @Transform(trimText)
  body!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

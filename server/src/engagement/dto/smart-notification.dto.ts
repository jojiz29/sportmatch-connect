import { Transform, TransformFnParams } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

function trimText({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

/**
 * Borrador de notificacion generado por el motor de recomendaciones.
 * Por ahora se guarda como notificacion in-app; mas adelante puede alimentar FCM/push.
 */
export class SaveSmartNotificationDto {
  @IsString()
  @MaxLength(80)
  @Transform(trimText)
  title!: string;

  @IsString()
  @MaxLength(600)
  @Transform(trimText)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimText)
  source?: string;
}

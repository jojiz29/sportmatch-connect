// ============================================================
// update-preferences.dto.ts â€” DTO para actualizar preferencias
// Acepta cualquier subset de campos (PATCH semantics)
// ============================================================

import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsBoolean, IsInt, IsIn, IsOptional, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

export class UpdatePreferencesDto {
  // === PRIVACIDAD ===
  @ApiProperty({ enum: ["public", "squads_only", "private"], required: false })
  @IsOptional()
  @IsIn(["public", "squads_only", "private"])
  profile_visibility?: "public" | "squads_only" | "private";

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  show_fitcoins_balance?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  show_trust_score?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  show_email?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  show_phone?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  show_last_seen?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  show_match_history?: boolean;

  @ApiProperty({ enum: ["everyone", "squads_only", "nobody"], required: false })
  @IsOptional()
  @IsIn(["everyone", "squads_only", "nobody"])
  allow_messages_from?: "everyone" | "squads_only" | "nobody";

  // === NOTIFICACIONES (canales) ===
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_push_enabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_email_enabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_inapp_enabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_sound_enabled?: boolean;

  // === NOTIFICACIONES (tipos) ===
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_squad_invites?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_match_requests?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_chat_messages?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_followers?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_rewards?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_marketing?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  notif_weekly_digest?: boolean;

  // === APARIENCIA ===
  @ApiProperty({
    enum: ["system", "light", "dark", "world_cup", "neon"],
    required: false,
  })
  @IsOptional()
  @IsIn(["system", "light", "dark", "world_cup", "neon"])
  theme?: "system" | "light" | "dark" | "world_cup" | "neon";

  @ApiProperty({ enum: ["compact", "comfortable", "spacious"], required: false })
  @IsOptional()
  @IsIn(["compact", "comfortable", "spacious"])
  ui_density?: "compact" | "comfortable" | "spacious";

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  reduce_motion?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  high_contrast?: boolean;

  // === SQUADS / MATCHES ===
  @ApiProperty({ minimum: 1, maximum: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  matchmaking_radius_km?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  auto_accept_squad_invites?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preferred_match_sport?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  show_me_in_squad_search?: boolean;

  // === IDIOMA / REGIÃ“N ===
  @ApiProperty({ enum: ["es", "en", "pt"], required: false })
  @IsOptional()
  @IsIn(["es", "en", "pt"])
  language?: "es" | "en" | "pt";

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ enum: ["km", "mi"], required: false })
  @IsOptional()
  @IsIn(["km", "mi"])
  units_distance?: "km" | "mi";

  // === SEGURIDAD ===
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  two_factor_enabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  login_alerts_enabled?: boolean;
}

export class BlockUserDto {
  @ApiProperty()
  @IsString()
  user_id!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DeleteAccountDto {
  /**
   * Password actual del usuario para confirmar la eliminacion.
   * Se valida contra Supabase Auth antes de proceder.
   */
  @ApiProperty({ description: "Password actual del usuario" })
  @IsString()
  password!: string;

  /**
   * Texto de confirmacion. Debe ser exactamente 'ELIMINAR'.
   * Confirmacion tipeada para evitar borrado accidental.
   */
  @ApiProperty({ description: "Debe ser exactamente ELIMINAR" })
  @IsString()
  confirmText!: string;

  /**
   * Razon opcional de la eliminacion (feedback para el PO).
   */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

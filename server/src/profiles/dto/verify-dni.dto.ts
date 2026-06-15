// ============================================================
// verify-dni.dto.ts — DTO para verificación de identidad DNI 2.0
// Soporta flujo v1 (solo número) y v2 (documento + selfie + consentimiento)
// ============================================================

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, Equals } from "class-validator";

export class VerifyDniDto {
  @ApiProperty({ example: "70123456", description: "DNI peruano de 8 dígitos" })
  @IsString()
  @Matches(/^\d{8}$/, { message: "El DNI debe tener exactamente 8 dígitos." })
  dni!: string;

  @ApiPropertyOptional({
    example: "user-id/dni-front_123.webp",
    description: "Ruta temporal en Supabase Storage del documento DNI (frente)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  documentPath?: string;

  @ApiPropertyOptional({
    example: "user-id/selfie_123.webp",
    description: "Ruta temporal en Supabase Storage de la selfie de verificación",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  selfiePath?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Consentimiento explícito para procesamiento biométrico (obligatorio en v2)",
  })
  @IsOptional()
  @IsBoolean()
  @Equals(true, { message: "Debes aceptar el consentimiento biométrico para continuar." })
  consentimientoBio?: boolean;
}

export interface DniAiValidationResult {
  isValidDocument: boolean;
  extractedDni: string | null;
  dniMatches: boolean;
  faceMatch: boolean;
  confidence: number;
  reason: string;
}

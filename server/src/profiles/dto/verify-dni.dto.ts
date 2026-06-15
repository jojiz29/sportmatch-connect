// ============================================================
// verify-dni.dto.ts — DTO para verificación de identidad DNI 2.0
// Soporta flujo v1 (solo número) y v2 (documento + selfie)
// ============================================================

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class VerifyDniDto {
  @ApiProperty({ example: "70123456", description: "DNI peruano de 8 dígitos" })
  @IsString()
  @Matches(/^\d{8}$/, { message: "El DNI debe tener exactamente 8 dígitos." })
  dni!: string;

  @ApiPropertyOptional({
    example: "identity-documents/70123456-dni-front.webp",
    description: "Ruta en Supabase Storage del documento DNI (frente)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  documentPath?: string;

  @ApiPropertyOptional({
    example: "identity-documents/70123456-selfie.webp",
    description: "Ruta en Supabase Storage de la selfie de verificación",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  selfiePath?: string;
}

export interface DniAiValidationResult {
  isValidDocument: boolean;
  extractedDni: string | null;
  dniMatches: boolean;
  faceMatch: boolean;
  confidence: number;
  reason: string;
}

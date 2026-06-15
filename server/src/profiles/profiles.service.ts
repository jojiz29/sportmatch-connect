// ============================================================
// profiles.service.ts — Servicio de perfiles con verificación RENIEC
// DNI v1: número + RENIEC | DNI v2: documento + selfie + Vertex AI + RENIEC
// ============================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { VertexAiService } from "../ai/vertex-ai.service";
import { SupabaseAuthService } from "../auth/supabase-auth.service";
import { VerifyDniDto, DniAiValidationResult } from "./dto";
import * as crypto from "crypto";

const IDENTITY_BUCKET = "identity-documents";

function matchNames(profileName: string, apiName: string): boolean {
  if (!profileName || !apiName) return false;
  const normalize = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && w !== "del" && w !== "las" && w !== "los" && w !== "con");
  };
  const profileWords = normalize(profileName);
  const apiWords = normalize(apiName);
  if (profileWords.length === 0) return false;
  return profileWords.every((word) => apiWords.includes(word));
}

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private vertexAiService: VertexAiService,
    private supabaseAuth: SupabaseAuthService,
  ) {}

  async findAll() {
    try {
      return await this.prisma.$queryRawUnsafe(
        `SELECT id, name, avatar_url, city, bio, trust_score, dni_verificado, fecha_verificacion, dni_verification_version FROM profiles LIMIT 30`,
      );
    } catch (error) {
      console.error("ProfilesService.findAll error:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const results = await this.prisma.$queryRawUnsafe(
        `SELECT id, name, avatar_url, city, bio, trust_score, dni_verificado, fecha_verificacion, dni_verification_version, dni_ai_confidence, age, gender, preferred_sports, matches_played, level, user_role, company_name, business_category, is_sponsored, is_admin FROM profiles WHERE id = $1 LIMIT 1`,
        [id],
      );
      const profile = Array.isArray(results) ? results[0] : results;

      if (!profile) {
        throw new NotFoundException("Profile not found");
      }

      return profile;
    } catch (error) {
      console.error("ProfilesService.findOne error:", error);
      throw error;
    }
  }

  async update(
    id: string,
    data: { name?: string; bio?: string; city?: string; age?: number; gender?: string },
  ) {
    try {
      return await this.prisma.profiles.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error("ProfilesService.update error:", error);
      throw error;
    }
  }

  async verifyDni(userId: string, payload: VerifyDniDto) {
    const { dni, documentPath, selfiePath } = payload;
    const isV2 = Boolean(documentPath && selfiePath);

    try {
      if (!/^\d{8}$/.test(dni)) {
        throw new BadRequestException("El DNI debe tener exactamente 8 dígitos.");
      }

      if (documentPath && !selfiePath) {
        throw new BadRequestException("Debes subir la selfie de verificación.");
      }
      if (selfiePath && !documentPath) {
        throw new BadRequestException("Debes subir la foto del documento DNI.");
      }

      const profile = await this.prisma.profiles.findUnique({
        where: { id: userId },
      });

      if (!profile) {
        throw new NotFoundException("Perfil no encontrado.");
      }

      if ((profile.dni_intentos || 0) >= 3) {
        throw new ForbiddenException(
          "Has superado el límite de 3 intentos de verificación. Por favor, contacta al soporte técnico en soporte@sportmatch.app.",
        );
      }

      const hashedDni = crypto.createHash("sha256").update(dni).digest("hex");

      const duplicate = await this.prisma.profiles.findFirst({
        where: {
          dni_hash: hashedDni,
          dni_verificado: true,
          id: { not: userId },
        },
      });

      if (duplicate) {
        await this.prisma.profiles.update({
          where: { id: userId },
          data: {
            dni_intentos: { increment: 1 },
          },
        });
        throw new BadRequestException("Este DNI ya ha sido verificado por otra cuenta.");
      }

      let aiValidation: DniAiValidationResult | null = null;
      if (isV2) {
        this.assertIdentityPathOwnership(userId, documentPath!);
        this.assertIdentityPathOwnership(userId, selfiePath!);
        aiValidation = await this.validateDniWithVertexAi(dni, documentPath!, selfiePath!);

        if (!aiValidation.isValidDocument) {
          await this.incrementDniAttempts(userId);
          throw new BadRequestException(
            `El documento no parece ser un DNI peruano válido. ${aiValidation.reason}`,
          );
        }

        if (!aiValidation.dniMatches) {
          await this.incrementDniAttempts(userId);
          throw new BadRequestException(
            "El número de DNI en la imagen no coincide con el ingresado.",
          );
        }

        if (!aiValidation.faceMatch) {
          await this.incrementDniAttempts(userId);
          throw new BadRequestException(
            "La selfie no coincide con la foto del documento. Intenta con mejor iluminación.",
          );
        }

        if (aiValidation.confidence < 0.65) {
          await this.incrementDniAttempts(userId);
          throw new BadRequestException(
            "No pudimos validar tu identidad con suficiente confianza. Intenta con fotos más claras.",
          );
        }
      }

      let apiNombres = "";
      let apiApePaterno = "";
      let apiApeMaterno = "";
      let apiFullName = "";

      const isMockMode = process.env.VITE_USE_MOCKS === "true";

      if (isMockMode) {
        if (dni === "99999999") {
          apiNombres = "Juan";
          apiApePaterno = "Perez";
          apiApeMaterno = "Gomez";
        } else {
          const userParts = (profile.name || "Edwin Demo").split(" ");
          apiNombres = userParts[0] || "Edwin";
          apiApePaterno = userParts[1] || "Demo";
          apiApeMaterno = userParts[2] || "";
        }
        apiFullName = `${apiNombres} ${apiApePaterno} ${apiApeMaterno}`.trim();
      } else {
        const apiKey = process.env.VERIFICAPE_API_KEY || "vp_live_2eef1b0a64d44e268af708478d9f5ea1";
        const url = `https://api.verificape.com/v2/dni/${dni}`;

        try {
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

          if (!res.ok) {
            throw new Error(`RENIEC API returned status ${res.status}`);
          }

          const resData = await res.json();
          if (!resData || !resData.data) {
            throw new Error("RENIEC response missing data object");
          }

          apiNombres = resData.data.names || resData.data.nombres || "";
          apiApePaterno = resData.data.paternalSurname || resData.data.apellido_paterno || "";
          apiApeMaterno = resData.data.maternalSurname || resData.data.apellido_materno || "";
          apiFullName =
            resData.data.fullName || `${apiNombres} ${apiApePaterno} ${apiApeMaterno}`.trim();
        } catch (apiErr) {
          console.error("RENIEC API Request Error:", apiErr);
          throw new BadRequestException(
            "No se pudo completar la consulta con RENIEC en este momento. Inténtalo de nuevo más tarde.",
          );
        }
      }

      if (!matchNames(profile.name || "", apiFullName)) {
        const updatedProfile = await this.incrementDniAttempts(userId);
        const attemptsLeft = 3 - (updatedProfile.dni_intentos || 0);
        const suffix =
          attemptsLeft > 0
            ? ` Te quedan ${attemptsLeft} intento${attemptsLeft === 1 ? "" : "s"}.`
            : " Has bloqueado el flujo de verificación. Por favor, contacta a soporte.";

        throw new BadRequestException(
          `El nombre en tu cuenta no coincide con el DNI ingresado.${suffix}`,
        );
      }

      const updated = await this.prisma.profiles.update({
        where: { id: userId },
        data: {
          dni_verificado: true,
          dni_hash: hashedDni,
          dni_intentos: 0,
          fecha_verificacion: new Date(),
          trust_score: Math.min(100, (profile.trust_score || 0) + 15),
          dni_verification_version: isV2 ? "v2" : "v1",
          dni_document_path: isV2 ? documentPath : null,
          dni_selfie_path: isV2 ? selfiePath : null,
          dni_ai_confidence: aiValidation?.confidence ?? null,
        },
      });

      return {
        success: true,
        message: "Identidad verificada exitosamente.",
        version: isV2 ? "v2" : "v1",
        profile: {
          dni_verificado: updated.dni_verificado,
          fecha_verificacion: updated.fecha_verificacion,
          trust_score: updated.trust_score,
          dni_verification_version: updated.dni_verification_version,
          dni_ai_confidence: updated.dni_ai_confidence,
        },
      };
    } catch (err) {
      console.error("ProfilesService.verifyDni error:", err);
      throw err;
    }
  }

  private assertIdentityPathOwnership(userId: string, storagePath: string): void {
    const normalized = storagePath.replace(/^\/+/, "");
    if (!normalized.startsWith(`${userId}/`)) {
      throw new BadRequestException("Ruta de imagen no autorizada para este usuario.");
    }
  }

  private async incrementDniAttempts(userId: string) {
    return this.prisma.profiles.update({
      where: { id: userId },
      data: {
        dni_intentos: { increment: 1 },
      },
    });
  }

  private async validateDniWithVertexAi(
    dni: string,
    documentPath: string,
    selfiePath: string,
  ): Promise<DniAiValidationResult> {
    const isMockMode = process.env.VITE_USE_MOCKS === "true";
    if (isMockMode) {
      return {
        isValidDocument: true,
        extractedDni: dni,
        dniMatches: true,
        faceMatch: true,
        confidence: 0.95,
        reason: "Mock mode: validación omitida",
      };
    }

    const [documentFile, selfieFile] = await Promise.all([
      this.supabaseAuth.downloadStorageObject(IDENTITY_BUCKET, documentPath),
      this.supabaseAuth.downloadStorageObject(IDENTITY_BUCKET, selfiePath),
    ]);

    const prompt = `Eres un verificador de identidad para DNI peruano.

Analiza las dos imágenes adjuntas:
1. Primera imagen: frente del documento de identidad (DNI peruano)
2. Segunda imagen: selfie del titular

DNI ingresado por el usuario: ${dni}

Responde SOLO con JSON en este formato exacto:
{
  "isValidDocument": boolean,
  "extractedDni": "12345678" | null,
  "dniMatches": boolean,
  "faceMatch": boolean,
  "confidence": number,
  "reason": "explicación breve"
}

Reglas:
- isValidDocument: true si la primera imagen es un DNI peruano legible
- extractedDni: número de 8 dígitos visible en el documento, o null si no es legible
- dniMatches: true si extractedDni coincide con ${dni}
- faceMatch: true si la persona de la selfie coincide con la foto del DNI
- confidence: 0-1, confianza global de la validación
- reason: motivo si alguna validación falla`;

    const result = await this.vertexAiService.generateContentWithImages(
      prompt,
      [
        {
          mimeType: documentFile.mimeType,
          base64Data: documentFile.data.toString("base64"),
        },
        {
          mimeType: selfieFile.mimeType,
          base64Data: selfieFile.data.toString("base64"),
        },
      ],
      { temperature: 0.1 },
    );

    return this.parseDniAiValidation(result.text, dni);
  }

  private parseDniAiValidation(text: string, submittedDni: string): DniAiValidationResult {
    const fallback: DniAiValidationResult = {
      isValidDocument: false,
      extractedDni: null,
      dniMatches: false,
      faceMatch: false,
      confidence: 0,
      reason: "No se pudo interpretar la respuesta de IA",
    };

    try {
      const trimmed = text.trim();
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return fallback;

      const parsed = JSON.parse(jsonMatch[0]) as Partial<DniAiValidationResult>;
      const extractedDni =
        typeof parsed.extractedDni === "string"
          ? parsed.extractedDni.replace(/\D/g, "").slice(0, 8)
          : null;

      return {
        isValidDocument: parsed.isValidDocument ?? false,
        extractedDni: extractedDni || null,
        dniMatches: parsed.dniMatches ?? (extractedDni !== null && extractedDni === submittedDni),
        faceMatch: parsed.faceMatch ?? false,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
        reason: parsed.reason ?? "",
      };
    } catch {
      return fallback;
    }
  }
}

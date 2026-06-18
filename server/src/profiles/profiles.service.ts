// ============================================================
// profiles.service.ts — Servicio de perfiles con verificación RENIEC
// Consulta raw SQL (evita columnas faltantes) y verificación DNI
// con normalización de nombres y límite de 3 intentos
// ============================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

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
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.$queryRawUnsafe(
        `SELECT id, name, avatar_url, city, bio, trust_score, dni_verificado, photo_verified, fecha_verificacion FROM profiles LIMIT 30`,
      );
    } catch (error) {
      console.error("ProfilesService.findAll error:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const results = await this.prisma.$queryRawUnsafe(
        `SELECT id, name, avatar_url, city, bio, trust_score, dni_verificado, photo_verified, fecha_verificacion, age, gender, preferred_sports, matches_played, level, user_role, company_name, business_category, is_sponsored, is_admin FROM profiles WHERE id = $1 LIMIT 1`,
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

  async verifyDni(userId: string, dni: string) {
    try {
      if (!/^\d{8}$/.test(dni)) {
        throw new BadRequestException("El DNI debe tener exactamente 8 dígitos.");
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
        const updatedProfile = await this.prisma.profiles.update({
          where: { id: userId },
          data: {
            dni_intentos: { increment: 1 },
          },
        });

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
          trust_score: Math.min(100, (profile.trust_score || 0) + 20),
        },
      });

      return {
        success: true,
        message: "Identidad verificada exitosamente.",
        profile: {
          dni_verificado: updated.dni_verificado,
          fecha_verificacion: updated.fecha_verificacion,
          trust_score: updated.trust_score,
        },
      };
    } catch (err) {
      console.error("ProfilesService.verifyDni error:", err);
      throw err;
    }
  }

  async verifyPhoto(userId: string) {
    try {
      const profile = await this.prisma.profiles.findUnique({
        where: { id: userId },
      });

      if (!profile) {
        throw new NotFoundException("Perfil no encontrado.");
      }

      const updated = await this.prisma.profiles.update({
        where: { id: userId },
        data: {
          photo_verified: true,
          trust_score: Math.min(100, (profile.trust_score || 0) + 20),
        },
      });

      return {
        success: true,
        message: "Foto de perfil verificada exitosamente.",
        profile: {
          photo_verified: updated.photo_verified,
          trust_score: updated.trust_score,
        },
      };
    } catch (err) {
      console.error("ProfilesService.verifyPhoto error:", err);
      throw err;
    }
  }
}

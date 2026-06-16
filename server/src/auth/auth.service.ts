// ============================================================
// auth.service.ts — Servicio de autenticación
// Valida tokens JWT de Supabase y gestiona perfiles
// ============================================================

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { SupabaseAuthService } from "./supabase-auth.service";

@Injectable()
export class AuthService {
  constructor(private readonly supabaseAuth: SupabaseAuthService) {}

  async validateToken(token: string) {
    try {
      const payload = await this.supabaseAuth.validateToken(token);
      return payload;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }

  async getProfile(token: string) {
    const { userId } = await this.supabaseAuth.validateToken(token);
    const profile = await this.supabaseAuth.getUserProfile(userId);
    return profile;
  }

  async updateProfile(token: string, data: { name?: string; bio?: string; avatar_url?: string }) {
    const { userId } = await this.supabaseAuth.validateToken(token);

    const { data: updatedProfile, error } = await this.supabaseAuth["supabaseAdmin"]
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select()
      .single();

    if (error || !updatedProfile) {
      throw new UnauthorizedException("Failed to update profile");
    }

    return updatedProfile;
  }
}

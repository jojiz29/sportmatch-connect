// ============================================================
// supabase-auth.service.ts — Servicio de integración con Supabase Auth
// Valida tokens JWT, obtiene perfiles y gestiona cliente admin
// ============================================================

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseAuthService {
  private readonly supabaseAdmin: SupabaseClient;
  private readonly isConfigured: boolean;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
      console.warn(
        "Supabase admin client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY",
      );
    }
  }

  async validateToken(token: string): Promise<{ userId: string; email?: string; role?: string }> {
    if (!this.isConfigured) {
      throw new UnauthorizedException("Supabase authentication not configured");
    }

    try {
      const {
        data: { user },
        error,
      } = await this.supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException("Invalid or expired token");
      }

      return {
        userId: user.id,
        email: user.email,
        role: user.user_metadata?.user_role || "PLAYER",
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException("Token validation failed");
    }
  }

  async getUserProfile(userId: string) {
    if (!this.isConfigured) {
      throw new UnauthorizedException("Supabase not configured");
    }

    const { data: profile, error } = await this.supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      throw new UnauthorizedException("Profile not found");
    }

    return profile;
  }
}

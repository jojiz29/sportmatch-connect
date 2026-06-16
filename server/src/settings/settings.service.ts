// ============================================================
// settings.service.ts — Servicio de preferencias del usuario
// Usa cliente Supabase admin (server-side, SECURITY DEFINER)
// para CRUD en user_preferences, user_blocks, user_sessions
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UpdatePreferencesDto, BlockUserDto } from "./dto/update-preferences.dto";

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private supabaseAdmin: SupabaseClient;
  private readonly isConfigured: boolean;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
      this.logger.warn("Supabase admin client not configured for SettingsService");
    }
  }

  private ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error("Settings service not configured");
    }
  }

  // === PREFERENCIAS ===

  async getPreferences(userId: string) {
    this.ensureConfigured();
    const { data, error } = await this.supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No existe → crear con defaults
      const { data: created, error: createError } = await this.supabaseAdmin
        .from("user_preferences")
        .insert({ user_id: userId })
        .select()
        .single();
      if (createError) {
        this.logger.error(`Error creating default preferences: ${createError.message}`);
        throw createError;
      }
      return created;
    }
    if (error) {
      this.logger.error(`Error fetching preferences: ${error.message}`);
      throw error;
    }
    return data;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    this.ensureConfigured();
    // Filtrar campos undefined para no enviar nulls
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }
    if (Object.keys(updateData).length === 0) {
      // Nada que actualizar, devolver las prefs actuales
      return this.getPreferences(userId);
    }
    const { data, error } = await this.supabaseAdmin
      .from("user_preferences")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) {
      this.logger.error(`Error updating preferences: ${error.message}`);
      throw error;
    }
    return data;
  }

  async resetPreferences(userId: string) {
    this.ensureConfigured();
    // Borrar y dejar que el trigger cree la fila por defecto
    const { error } = await this.supabaseAdmin
      .from("user_preferences")
      .delete()
      .eq("user_id", userId);
    if (error) {
      this.logger.error(`Error resetting preferences: ${error.message}`);
      throw error;
    }
    return this.getPreferences(userId);
  }

  // === USUARIOS BLOQUEADOS ===

  async listBlocks(userId: string) {
    this.ensureConfigured();
    const { data, error } = await this.supabaseAdmin
      .from("user_blocks")
      .select(
        `
        blocked_id,
        reason,
        created_at,
        blocked_profile:profiles!user_blocks_blocked_id_fkey (
          id, name, avatar_url, city
        )
      `,
      )
      .eq("blocker_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      this.logger.error(`Error listing blocks: ${error.message}`);
      throw error;
    }
    return data || [];
  }

  async blockUser(userId: string, dto: BlockUserDto) {
    this.ensureConfigured();
    if (userId === dto.user_id) {
      throw new Error("No puedes bloquearte a ti mismo");
    }
    const { data, error } = await this.supabaseAdmin
      .from("user_blocks")
      .insert({
        blocker_id: userId,
        blocked_id: dto.user_id,
        reason: dto.reason || null,
      })
      .select()
      .single();
    if (error) {
      this.logger.error(`Error blocking user: ${error.message}`);
      throw error;
    }
    return data;
  }

  async unblockUser(userId: string, blockedId: string) {
    this.ensureConfigured();
    const { error } = await this.supabaseAdmin
      .from("user_blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedId);
    if (error) {
      this.logger.error(`Error unblocking user: ${error.message}`);
      throw error;
    }
    return { success: true };
  }

  // === SESIONES ===

  async listSessions(userId: string) {
    this.ensureConfigured();
    const { data, error } = await this.supabaseAdmin
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("last_active_at", { ascending: false });
    if (error) {
      this.logger.error(`Error listing sessions: ${error.message}`);
      throw error;
    }
    return data || [];
  }

  async registerSession(
    userId: string,
    session: {
      device_label?: string;
      user_agent?: string;
      ip_address?: string;
      is_current?: boolean;
    },
  ) {
    this.ensureConfigured();
    const { data, error } = await this.supabaseAdmin
      .from("user_sessions")
      .insert({
        user_id: userId,
        device_label: session.device_label || null,
        user_agent: session.user_agent || null,
        ip_address: session.ip_address || null,
        is_current: session.is_current ?? true,
      })
      .select()
      .single();
    if (error) {
      this.logger.error(`Error registering session: ${error.message}`);
      throw error;
    }
    return data;
  }

  async deleteSession(userId: string, sessionId: string) {
    this.ensureConfigured();
    const { error } = await this.supabaseAdmin
      .from("user_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);
    if (error) {
      this.logger.error(`Error deleting session: ${error.message}`);
      throw error;
    }
    return { success: true };
  }

  async deleteAllOtherSessions(userId: string) {
    this.ensureConfigured();
    const { error } = await this.supabaseAdmin
      .from("user_sessions")
      .delete()
      .eq("user_id", userId)
      .eq("is_current", false);
    if (error) {
      this.logger.error(`Error deleting other sessions: ${error.message}`);
      throw error;
    }
    return { success: true };
  }

  // === EXPORTAR DATOS (GDPR-style) ===

  async exportUserData(userId: string) {
    this.ensureConfigured();
    const sections: Record<string, unknown> = {};

    // Profile
    const { data: profile } = await this.supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    sections.profile = profile;

    // Preferences
    const { data: preferences } = await this.supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    sections.preferences = preferences;

    // Posts
    const { data: posts } = await this.supabaseAdmin
      .from("posts")
      .select("*")
      .eq("user_id", userId);
    sections.posts = posts || [];

    // Comments
    const { data: comments } = await this.supabaseAdmin
      .from("post_comments")
      .select("*")
      .eq("user_id", userId);
    sections.comments = comments || [];

    // Matches
    const { data: matches } = await this.supabaseAdmin
      .from("matches")
      .select("*")
      .eq("creator_id", userId);
    sections.matches_created = matches || [];

    const { data: matchParts } = await this.supabaseAdmin
      .from("match_participants")
      .select("*")
      .eq("user_id", userId);
    sections.match_participations = matchParts || [];

    // Squads
    const { data: squads } = await this.supabaseAdmin
      .from("squads")
      .select("*")
      .eq("creator_id", userId);
    sections.squads_created = squads || [];

    // Transactions
    const { data: transactions } = await this.supabaseAdmin
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId);
    sections.wallet_transactions = transactions || [];

    // Notifications
    const { data: notifications } = await this.supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId);
    sections.notifications = notifications || [];

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      sections,
    };
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAuthService } from "../supabase-auth.service";

@Injectable()
export class AdminGuard implements CanActivate {
  private supabaseAdmin: SupabaseClient | null = null;
  private readonly isConfigured: boolean;

  constructor(private supabaseAuth: SupabaseAuthService) {
    const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const rawAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

    const key = rawServiceKey || rawAnonKey;

    if (rawUrl && key) {
      this.supabaseAdmin = createClient(rawUrl, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!this.isConfigured || !this.supabaseAdmin) {
      throw new ForbiddenException("Admin guard not configured");
    }

    let userId: string | undefined;

    if (request.user?.userId) {
      userId = request.user.userId;
    } else {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedException("Missing or invalid authorization header");
      }

      const token = authHeader.substring(7);

      try {
        const payload = await this.supabaseAuth.validateToken(token);
        userId = payload.userId;
        request.user = payload;
      } catch {
        throw new UnauthorizedException("Invalid or expired token");
      }
    }

    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    const { data: profile, error } = await this.supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new ForbiddenException("Error verifying admin status");
    }

    if (!profile || !profile.is_admin) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}

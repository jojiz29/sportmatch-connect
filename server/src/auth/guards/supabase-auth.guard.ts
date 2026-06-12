// ============================================================
// supabase-auth.guard.ts — Guard de autenticación con Supabase
// Valida el token Bearer contra Supabase Auth y asigna el payload a request.user
// ============================================================

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { SupabaseAuthService } from "../supabase-auth.service";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabaseAuth: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.supabaseAuth.validateToken(token);
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException(err.message || "Invalid token");
    }
  }
}

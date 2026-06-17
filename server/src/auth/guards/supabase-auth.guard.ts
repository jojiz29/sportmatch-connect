// ============================================================
// supabase-auth.guard.ts — Guard de autenticación con Supabase
// Valida el token Bearer contra Supabase Auth y asigna el payload a request.user
//
// Respeta el decorador @Public(): si el handler o el controlador
// tienen IS_PUBLIC_KEY = true, se salta la validación del token.
// ============================================================

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SupabaseAuthService } from "../supabase-auth.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabaseAuth: SupabaseAuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

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

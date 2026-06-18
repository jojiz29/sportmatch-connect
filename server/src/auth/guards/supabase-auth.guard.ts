// ============================================================
// supabase-auth.guard.ts — Guard de autenticación con Supabase
// Valida el token Bearer contra Supabase Auth y asigna el payload a request.user
// ============================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Optional,
} from "@nestjs/common";
import { SupabaseAuthService } from "../supabase-auth.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabaseAuth: SupabaseAuthService,
    @Optional() private prisma?: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.supabaseAuth.validateToken(token);

      // Smart Block Check: verificar si el usuario tiene un bloqueo automático activo (si prisma está disponible)
      if (this.prisma) {
        const activeBlock = await this.prisma.user_blocks.findFirst({
          where: {
            blocked_id: payload.userId,
            timestamp_fin: {
              gt: new Date(),
            },
          },
        });

        if (activeBlock) {
          throw new ForbiddenException(
            "Tu cuenta ha sido restringida temporalmente por actividad inusual",
          );
        }
      }

      request.user = payload;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException(err.message || "Invalid token");
    }
  }
}

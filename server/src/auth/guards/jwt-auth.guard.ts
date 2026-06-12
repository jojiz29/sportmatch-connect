// ============================================================
// jwt-auth.guard.ts — Guard de Passport para JWT
// Extiende AuthGuard("jwt") para proteger rutas con token JWT
// ============================================================

import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

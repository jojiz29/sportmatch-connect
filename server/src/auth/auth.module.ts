// ============================================================
// auth.module.ts — Módulo de autenticación
// Provee y exporta AuthService, SupabaseAuthService y guards
// ============================================================

import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseAuthService } from "./supabase-auth.service";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthService, SupabaseAuthGuard, RolesGuard],
  exports: [AuthService, SupabaseAuthService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}

// ============================================================
// settings.module.ts — Módulo de Configuración del usuario
// Endpoints: /users/me/preferences, /users/me/blocks,
//            /users/me/sessions, /users/me/export-data
// ============================================================

import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

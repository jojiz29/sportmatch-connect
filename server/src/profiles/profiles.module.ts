// ============================================================
// profiles.module.ts — Módulo de perfiles
// Consulta y actualización de perfiles con verificación DNI/RENIEC
// ============================================================

import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}

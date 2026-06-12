// ============================================================
// courts.module.ts — Módulo de canchas deportivas
// CRUD de canchas con autenticación opcional según el endpoint
// ============================================================

import { Module } from "@nestjs/common";
import { CourtsController } from "./courts.controller";
import { CourtsService } from "./courts.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}

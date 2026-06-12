// ============================================================
// prisma.module.ts — Módulo global de Prisma
// Provee PrismaService a toda la aplicación sin necesidad de importarlo
// ============================================================

import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

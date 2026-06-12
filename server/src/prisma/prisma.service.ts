// ============================================================
// prisma.service.ts — Servicio singleton de Prisma
// Extiende PrismaClient y gestiona ciclo de vida (conexión/desconexión)
// ============================================================

import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

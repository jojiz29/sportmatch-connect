// ============================================================
// prisma.service.ts — Servicio singleton de Prisma
// Extiende PrismaClient y gestiona ciclo de vida (conexión/desconexión)
//
// FIX 15-jun-2026: $connect() envuelto en try/catch con timeout de 2s.
// Si el pooler de Supabase no responde (credenciales mal, red, etc.),
// el backend ARRANCABA pero el event loop quedaba bloqueado en
// PrismaService.onModuleInit, colgando TODOS los endpoints (incluso
// /health) en lugar de fallar rápido. Ahora:
//   - $connect() corre con un timeout duro de 2s.
//   - Si falla, se loguea y el servicio arranca en estado "degraded".
//   - Las queries intentarán conectar lazy; si la DB está caída,
//     cada query fallará rápido con un error claro en lugar de colgar.
//   - El endpoint /health usa isHealthy() para reportar 503 si la DB
//     no está disponible, permitiendo que el balanceador (Render) rote.
// ============================================================

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const CONNECT_TIMEOUT_MS = 2000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit() {
    try {
      await this.withTimeout(this.$connect(), CONNECT_TIMEOUT_MS);
      this.connected = true;
      this.logger.log("Prisma connected to database");
    } catch (err) {
      this.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Prisma $connect() failed (timeout ${CONNECT_TIMEOUT_MS}ms): ${msg}. ` +
          `El servicio arranca en modo degraded. Las queries fallarán hasta que la DB responda.`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // Ignorar: el proceso está cerrando
    }
  }

  /**
   * Health-check: el servicio está conectado a la DB?
   * Usado por HealthController para devolver 200/503.
   */
  isHealthy(): boolean {
    return this.connected;
  }

  /**
   * Reintenta la conexión manualmente (e.g. un endpoint /health/connect
   * o un cron). Útil tras un cold-start de Render.
   */
  async tryReconnect(): Promise<boolean> {
    try {
      await this.withTimeout(this.$connect(), CONNECT_TIMEOUT_MS);
      this.connected = true;
      this.logger.log("Prisma reconnected to database");
      return true;
    } catch (err) {
      this.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Prisma reconnect failed: ${msg}`);
      return false;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}

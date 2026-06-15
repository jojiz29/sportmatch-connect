// ============================================================
// health.controller.ts — Controlador de salud del servicio
// Endpoint GET /health para verificar que la API responde.
//
// FIX 15-jun-2026: el endpoint ahora reporta el estado real de Prisma
// y devuelve 503 si la DB no está conectada, en lugar de colgar el
// event loop. Esto permite que Render rote instancias unhealthy.
// ============================================================

import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  check(@Res() res: Response) {
    const dbHealthy = this.prisma.isHealthy();
    const body = {
      status: dbHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      service: "sportmatch-api",
      checks: {
        database: dbHealthy ? "up" : "down",
      },
    };
    res.status(dbHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(body);
  }

  @Get("connect")
  @ApiOperation({
    summary: "Intenta reconectar a la DB (útil tras cold-start de Render)",
  })
  async reconnect() {
    const ok = await this.prisma.tryReconnect();
    return {
      reconnected: ok,
      timestamp: new Date().toISOString(),
    };
  }
}

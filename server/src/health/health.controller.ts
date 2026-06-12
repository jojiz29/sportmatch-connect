// ============================================================
// health.controller.ts — Controlador de salud del servicio
// Endpoint GET /health para verificar que la API responde
// ============================================================

import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "sportmatch-api",
    };
  }
}

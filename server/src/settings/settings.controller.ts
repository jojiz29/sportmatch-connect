// ============================================================
// settings.controller.ts — Endpoints REST para ConfiguraciA3n
// Base: /users/me/* (preferences, blocks, sessions, export)
// SCRUM-410: anadido DELETE /users/me (GDPR right to be forgotten)
// ============================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { SettingsService } from "./settings.service";
import { UpdatePreferencesDto, BlockUserDto, DeleteAccountDto } from "./dto/update-preferences.dto";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    [key: string]: unknown;
  };
}

@ApiTags("Settings")
@ApiBearerAuth()
@Controller("users/me")
@UseGuards(SupabaseAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // === PREFERENCIAS ===

  @Get("preferences")
  @ApiOperation({ summary: "Obtener preferencias del usuario autenticado" })
  async getPreferences(@Req() req: AuthenticatedRequest) {
    return this.settingsService.getPreferences(req.user.sub);
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Actualizar preferencias (PATCH parcial)" })
  async updatePreferences(@Req() req: AuthenticatedRequest, @Body() dto: UpdatePreferencesDto) {
    return this.settingsService.updatePreferences(req.user.sub, dto);
  }

  @Post("preferences/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resetear preferencias a defaults" })
  async resetPreferences(@Req() req: AuthenticatedRequest) {
    return this.settingsService.resetPreferences(req.user.sub);
  }

  // === USUARIOS BLOQUEADOS ===

  @Get("blocks")
  @ApiOperation({ summary: "Listar usuarios bloqueados" })
  async listBlocks(@Req() req: AuthenticatedRequest) {
    return this.settingsService.listBlocks(req.user.sub);
  }

  @Post("blocks")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Bloquear un usuario" })
  async blockUser(@Req() req: AuthenticatedRequest, @Body() dto: BlockUserDto) {
    return this.settingsService.blockUser(req.user.sub, dto);
  }

  @Delete("blocks/:userId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Desbloquear un usuario" })
  async unblockUser(@Req() req: AuthenticatedRequest, @Param("userId") userId: string) {
    return this.settingsService.unblockUser(req.user.sub, userId);
  }

  // === SESIONES ===

  @Get("sessions")
  @ApiOperation({ summary: "Listar sesiones activas" })
  async listSessions(@Req() req: AuthenticatedRequest) {
    return this.settingsService.listSessions(req.user.sub);
  }

  @Post("sessions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Registrar sesión actual" })
  async registerSession(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      device_label?: string;
      user_agent?: string;
      ip_address?: string;
      is_current?: boolean;
    },
  ) {
    return this.settingsService.registerSession(req.user.sub, body);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cerrar una sesión específica" })
  async deleteSession(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.settingsService.deleteSession(req.user.sub, id);
  }

  @Delete("sessions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cerrar todas las demás sesiones" })
  async deleteAllOtherSessions(@Req() req: AuthenticatedRequest) {
    return this.settingsService.deleteAllOtherSessions(req.user.sub);
  }

  // === EXPORTAR DATOS ===

  @Post("export-data")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generar exportaciA3n de todos los datos del usuario" })
  async exportData(@Req() req: AuthenticatedRequest) {
    return this.settingsService.exportUserData(req.user.sub);
  }

  // === ELIMINAR CUENTA (GDPR - SCRUM-410) ===

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Eliminar cuenta (derecho al olvido, GDPR)",
    description:
      "Soft delete: anonimiza datos personales inmediatamente, " +
      "marca deleted_at, registra audit log. Purgado fisico tras 30 dias via cron.",
  })
  async deleteAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ) {
    const ip =
      req.headers.get("x-forwarded-for") ||
      (req as unknown as { ip?: string }).ip ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    return this.settingsService.deleteAccount(
      req.user.sub,
      req.user.email,
      dto.password,
      dto.confirmText,
      ip,
      userAgent,
      dto.reason,
    );
  }
}

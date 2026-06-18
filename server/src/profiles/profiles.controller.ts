// ============================================================
// profiles.controller.ts — Controlador de perfiles
// CRUD público + verificación de identidad con DNI (RENIEC)
// ============================================================

import { Controller, Get, Param, Patch, Body, UseGuards, Post, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProfilesService } from "./profiles.service";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";

@ApiTags("Profiles")
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: "Get all profiles" })
  async findAll() {
    return this.profilesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get profile by ID" })
  async findOne(@Param("id") id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update profile" })
  async update(
    @Param("id") id: string,
    @Body() data: { name?: string; bio?: string; city?: string; age?: number; gender?: string },
  ) {
    return this.profilesService.update(id, data);
  }

  @Post("verify-dni")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify identity with DNI" })
  async verifyDni(@Request() req: { user: { userId: string } }, @Body() data: { dni: string }) {
    return this.profilesService.verifyDni(req.user.userId, data.dni);
  }

  @Post("verify-photo")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify profile photo authenticity" })
  async verifyPhoto(@Request() req: { user: { userId: string } }) {
    return this.profilesService.verifyPhoto(req.user.userId);
  }
}

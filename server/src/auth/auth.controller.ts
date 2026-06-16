// ============================================================
// auth.controller.ts — Controlador de autenticación
// Endpoints: GET profile, PUT profile, GET verify (token)
// ============================================================

import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SupabaseAuthGuard } from "./guards/supabase-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("profile")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile from Supabase token" })
  async getProfile(@Headers("authorization") authHeader: string) {
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }
    const token = authHeader.substring(7);
    return this.authService.getProfile(token);
  }

  @Put("profile")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @Headers("authorization") authHeader: string,
    @Body() data: { name?: string; bio?: string; avatar_url?: string },
  ) {
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }
    const token = authHeader.substring(7);
    return this.authService.updateProfile(token, data);
  }

  @Get("verify")
  @ApiOperation({ summary: "Verify Supabase token" })
  async verifyToken(@Headers("authorization") authHeader: string) {
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }
    const token = authHeader.substring(7);
    return this.authService.validateToken(token);
  }
}

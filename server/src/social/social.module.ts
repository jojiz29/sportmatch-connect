// ============================================================
// server/src/social/social.module.ts — Módulo Social Graph
// Sprint V2.1 — Social Graph & Followers
// ============================================================

import { Module } from "@nestjs/common";
import { SocialController } from "./social.controller";
import { SocialService } from "./social.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}

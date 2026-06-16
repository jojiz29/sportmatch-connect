// ============================================================
// server/src/matchmaking/matchmaking.module.ts — Módulo Matchmaking
// Sprint V2.3 — Matchmaking & Elo System
// ============================================================

import { Module } from "@nestjs/common";
import { MatchmakingController } from "./matchmaking.controller";
import { MatchmakingService } from "./matchmaking.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}

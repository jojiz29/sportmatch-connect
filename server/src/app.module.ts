// ============================================================
// app.module.ts — Módulo raíz de la aplicación NestJS
// Importa todos los módulos funcionales y expone HealthController
// ============================================================

import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { MatchesModule } from "./matches/matches.module";
import { CourtsModule } from "./courts/courts.module";
import { PostsModule } from "./posts/posts.module";
import { UsersModule } from "./users/users.module";
import { WalletModule } from "./wallet/wallet.module";
import { SportsModule } from "./sports/sports.module";
import { BookingsModule } from "./bookings/bookings.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AiModule } from "./ai/ai.module";
import { B2bAiModule } from "./ai/b2b/b2b-ai.module";
import { SettingsModule } from "./settings/settings.module";
import { SocialModule } from "./social/social.module";
import { MatchmakingModule } from "./matchmaking/matchmaking.module";
import { ArModule } from "./ar/ar.module";
import { EngagementModule } from "./engagement/engagement.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProfilesModule,
    MatchesModule,
    CourtsModule,
    PostsModule,
    UsersModule,
    WalletModule,
    SportsModule,
    BookingsModule,
    AiModule,
    B2bAiModule,
    SettingsModule,
    SocialModule,
    MatchmakingModule,
    ArModule,
    EngagementModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

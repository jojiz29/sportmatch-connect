// ============================================================
// app.module.ts — Módulo raíz de la aplicación NestJS
// Importa todos los módulos funcionales y expone HealthController
// ============================================================

import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
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
import { SettingsModule } from "./settings/settings.module";
import { SocialModule } from "./social/social.module";
import { MatchmakingModule } from "./matchmaking/matchmaking.module";
import { PaymentsModule } from "./payments/payments.module";
import { ObservabilityModule } from "./observability/observability.module";
import { BillingModule } from "./billing/billing.module";
import { ObservabilityInterceptor } from "./observability/observability.service";

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
    SettingsModule,
    SocialModule,
    MatchmakingModule,
    PaymentsModule,
    ObservabilityModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ObservabilityInterceptor,
    },
  ],
})
export class AppModule {}

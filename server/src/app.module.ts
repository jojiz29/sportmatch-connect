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
  ],
  controllers: [HealthController],
})
export class AppModule {}

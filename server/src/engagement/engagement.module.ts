import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AiCoreModule } from "../ai/ai-core.module";
import { AiRecommendationController } from "./ai-recommendation.controller";
import { EngagementCronController } from "./engagement-cron.controller";
import { EngagementController } from "./engagement.controller";
import { EngagementService } from "./engagement.service";

@Module({
  imports: [AuthModule, AiCoreModule],
  controllers: [EngagementController, AiRecommendationController, EngagementCronController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}

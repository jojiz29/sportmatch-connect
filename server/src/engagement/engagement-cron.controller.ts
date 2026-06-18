import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { EngagementService } from "./engagement.service";

interface DailyRecommendationsCronBody {
  limit?: number;
  dryRun?: boolean;
}

@ApiTags("Engagement AI Cron")
@Controller("engagement/cron")
export class EngagementCronController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post("daily-recommendations")
  @ApiOperation({
    summary: "Genera snapshots diarios para usuarios activos o recien creados",
  })
  runDailyRecommendations(
    @Headers("x-cron-secret") cronSecret: string | undefined,
    @Body() body: DailyRecommendationsCronBody,
  ) {
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
      throw new UnauthorizedException("Cron secret invalido o no configurado");
    }

    return this.engagementService.runDailyRecommendationCron({
      limit: body?.limit,
      dryRun: body?.dryRun,
    });
  }
}

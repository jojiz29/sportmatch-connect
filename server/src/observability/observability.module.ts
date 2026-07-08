import { Module, Global } from "@nestjs/common";
import { ObservabilityService, ObservabilityInterceptor } from "./observability.service";

@Global()
@Module({
  providers: [ObservabilityService, ObservabilityInterceptor],
  exports: [ObservabilityService, ObservabilityInterceptor],
})
export class ObservabilityModule {}

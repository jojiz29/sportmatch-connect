import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { AiCoreModule } from "../ai-core.module";
import { VisionController } from "./vision.controller";
import { VisionService } from "./vision.service";
import { MediaService } from "./media.service";

@Module({
  imports: [AuthModule, AiCoreModule],
  controllers: [VisionController],
  providers: [VisionService, MediaService],
  exports: [VisionService],
})
export class VisionModule {}

import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { VisionController } from "./vision.controller";
import { VisionService } from "./vision.service";

@Module({
  imports: [AuthModule],
  controllers: [VisionController],
  providers: [VisionService],
  exports: [VisionService],
})
export class VisionModule {}

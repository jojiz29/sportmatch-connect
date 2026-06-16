import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ArService } from "./ar.service";

@ApiTags("AR Court Preview")
@Controller("ar")
export class ArController {
  constructor(private arService: ArService) {}

  @Get("court/:courtId/model-data")
  @ApiOperation({ summary: "Get 3D/AR model data for a court" })
  async getCourtModelData(@Param("courtId") courtId: string) {
    return this.arService.getCourtModelData(courtId);
  }
}

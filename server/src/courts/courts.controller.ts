import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CourtsService } from "./courts.service";
import { CreateCourtDto, UpdateCourtDto } from "./dto";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";

@ApiTags("Courts")
@Controller("courts")
export class CourtsController {
  constructor(private courtsService: CourtsService) {}

  @Get()
  @ApiOperation({ summary: "Get all courts" })
  @ApiQuery({ name: "sport", required: false })
  @ApiQuery({ name: "district", required: false })
  async findAll(@Query("sport") sport?: string, @Query("district") district?: string) {
    return this.courtsService.findAll(sport, district);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get court by ID" })
  async findOne(@Param("id") id: string) {
    return this.courtsService.findOne(id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new court" })
  async create(@Body() dto: CreateCourtDto) {
    return this.courtsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a court" })
  async update(@Param("id") id: string, @Body() dto: UpdateCourtDto) {
    return this.courtsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a court" })
  async delete(@Param("id") id: string) {
    return this.courtsService.delete(id);
  }

  @Post(":id/reviews")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a review for a court" })
  async createReview(
    @Param("id") id: string,
    @Body() data: { rating: number; comment?: string },
    @Request() req: { user: { userId: string } },
  ) {
    return this.courtsService.createReview(id, req.user.userId, data);
  }
}

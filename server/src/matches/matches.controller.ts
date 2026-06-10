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
import { MatchesService } from "./matches.service";
import { CreateMatchDto, UpdateMatchDto } from "./dto";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";

@ApiTags("Matches")
@Controller("matches")
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: "Get all matches" })
  @ApiQuery({ name: "sport", required: false })
  async findAll(@Query("sport") sport?: string) {
    return this.matchesService.findAll(sport);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get match by ID" })
  async findOne(@Param("id") id: string) {
    return this.matchesService.findOne(id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new match" })
  async create(@Body() dto: CreateMatchDto, @Request() req: { user: { userId: string } }) {
    return this.matchesService.create(dto, req.user.userId);
  }

  @Patch(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a match" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateMatchDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.matchesService.update(id, dto, req.user.userId);
  }

  @Delete(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a match" })
  async delete(@Param("id") id: string, @Request() req: { user: { userId: string } }) {
    return this.matchesService.delete(id, req.user.userId);
  }

  @Post(":id/join")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Join a match" })
  async join(@Param("id") id: string, @Request() req: { user: { userId: string } }) {
    return this.matchesService.join(id, req.user.userId);
  }

  @Post(":id/leave")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Leave a match" })
  async leave(@Param("id") id: string, @Request() req: { user: { userId: string } }) {
    return this.matchesService.leave(id, req.user.userId);
  }
}

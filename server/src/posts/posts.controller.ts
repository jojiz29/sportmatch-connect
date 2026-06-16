// ============================================================
// posts.controller.ts — Controlador de publicaciones
// CRUD de posts + comentarios anidados + reacciones toggle
// ============================================================

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
import { PostsService } from "./posts.service";
import { CreatePostDto, UpdatePostDto, CreateCommentDto, CreateReactionDto } from "./dto";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: "Get all posts" })
  @ApiQuery({ name: "sport", required: false })
  async findAll(@Query("sport") sport?: string) {
    return this.postsService.findAll(sport);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get post by ID" })
  async findOne(@Param("id") id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new post" })
  async create(@Body() dto: CreatePostDto, @Request() req: { user: { userId: string } }) {
    return this.postsService.create(dto, req.user.userId);
  }

  @Patch(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a post" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdatePostDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.update(id, dto, req.user.userId);
  }

  @Delete(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a post" })
  async delete(@Param("id") id: string, @Request() req: { user: { userId: string } }) {
    return this.postsService.delete(id, req.user.userId);
  }

  @Post(":id/comments")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a comment to a post" })
  async addComment(
    @Param("id") id: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.addComment(id, dto, req.user.userId);
  }

  @Delete("comments/:commentId")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a comment" })
  async deleteComment(
    @Param("commentId") commentId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.deleteComment(commentId, req.user.userId);
  }

  @Post("comments/:commentId/reactions")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add or toggle reaction on a comment" })
  async addReaction(
    @Param("commentId") commentId: string,
    @Body() dto: CreateReactionDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.postsService.addReaction(commentId, dto, req.user.userId);
  }
}

// ============================================================
// posts.module.ts — Módulo de publicaciones
// CRUD de posts con comentarios y reacciones emoji
// ============================================================

import { Module } from "@nestjs/common";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}

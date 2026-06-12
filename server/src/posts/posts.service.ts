// ============================================================
// posts.service.ts — Servicio de publicaciones
// CRUD con comentarios jerárquicos (parent_id) y reacciones toggle
// ============================================================

import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePostDto, UpdatePostDto, CreateCommentDto, CreateReactionDto } from "./dto";

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll(sport?: string) {
    const where = sport ? { sport } : {};
    return this.prisma.posts.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar_url: true, is_sponsored: true },
        },
        post_comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar_url: true },
            },
            post_comment_reactions: true,
          },
          orderBy: { created_at: "desc" },
        },
        _count: {
          select: { post_comments: true },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.posts.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar_url: true, is_sponsored: true },
        },
        post_comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar_url: true },
            },
            post_comment_reactions: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    return post;
  }

  async create(data: CreatePostDto, userId: string) {
    return this.prisma.posts.create({
      data: {
        ...data,
        user_id: userId,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar_url: true },
        },
      },
    });
  }

  async update(id: string, data: UpdatePostDto, userId: string) {
    const post = await this.prisma.posts.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.user_id !== userId) {
      throw new ForbiddenException("You can only update your own posts");
    }

    return this.prisma.posts.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const post = await this.prisma.posts.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.user_id !== userId) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    return this.prisma.posts.delete({ where: { id } });
  }

  async addComment(postId: string, data: CreateCommentDto, userId: string) {
    const post = await this.prisma.posts.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    return this.prisma.post_comments.create({
      data: {
        post_id: postId,
        user_id: userId,
        content: data.content,
        parent_id: data.parent_id,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar_url: true },
        },
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.post_comments.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    return this.prisma.post_comments.delete({ where: { id: commentId } });
  }

  async addReaction(commentId: string, data: CreateReactionDto, userId: string) {
    const comment = await this.prisma.post_comments.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const existing = await this.prisma.post_comment_reactions.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: userId,
        },
      },
    });

    if (existing) {
      if (existing.reaction_type === data.reaction_type) {
        await this.prisma.post_comment_reactions.delete({
          where: { id: existing.id },
        });
        return { action: "removed" };
      }

      return this.prisma.post_comment_reactions.update({
        where: { id: existing.id },
        data: { reaction_type: data.reaction_type },
      });
    }

    return this.prisma.post_comment_reactions.create({
      data: {
        comment_id: commentId,
        user_id: userId,
        reaction_type: data.reaction_type,
      },
    });
  }
}

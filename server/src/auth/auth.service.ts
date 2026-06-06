import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private supabaseAuth: SupabaseAuthService,
  ) {}

  async validateToken(token: string) {
    try {
      const payload = this.supabaseAuth.verifyToken(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: { user_id: userId },
      include: {
        followers: true,
        following: true,
        _count: {
          select: {
            posts: true,
            created_matches: true,
          },
        },
      },
    });

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; avatar_url?: string }) {
    const profile = await this.prisma.profiles.update({
      where: { user_id: userId },
      data,
    });
    return profile;
  }
}
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SupabaseAuthService {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.SUPABASE_JWT_SECRET || 'your-supabase-jwt-secret';
  }

  verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      });
      return decoded as { sub: string; email?: string; aud: string };
    } catch {
      throw new Error('Invalid token');
    }
  }
}
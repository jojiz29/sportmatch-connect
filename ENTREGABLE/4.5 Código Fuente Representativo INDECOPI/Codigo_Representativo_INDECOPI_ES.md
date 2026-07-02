# DEPÓSITO DE CÓDIGO FUENTE REPRESENTATIVO (REQUISITO INDECOPI)

Este documento contiene las porciones iniciales y finales del código fuente y esquema de datos del proyecto **SportMatch Connect**, cumpliendo estrictamente con las directrices de la Dirección de Derecho de Autor de INDECOPI (Perú) para el registro de soporte lógico (programa de ordenador).

---

## 📂 1. ESQUEMA DE PERSISTENCIA (Prisma ORM Schema)
**Archivo:** `server/prisma/schema.prisma`
```prisma
// ============================================================
// schema.prisma — Esquema de base de datos SportMatch
// 16 modelos con dual-URL (pooler + directo) para Supabase us-west-2
// ============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model profiles {
  id                   String    @id @default(uuid())
  created_at           DateTime  @default(now()) @map("created_at")
  updated_at           DateTime  @updatedAt @map("updated_at")
  name                 String?
  age                  Int?
  city                 String?
  avatar_url           String?   @map("avatar_url")
  bio                  String?
  trust_score          Int?      @default(50) @map("trust_score")
  photo_verified       Boolean?  @default(false) @map("photo_verified")
  fitcoins_balance     Int?      @default(0) @map("fitcoins_balance")
  level                Int?
  level_label          String?   @map("level_label")
  xp                   Int?      @default(0) @map("xp")
  xp_to_next_level     Int?      @default(100) @map("xp_to_next_level")
  preferred_sports     String[]  @map("preferred_sports")
  matches_played       Int?      @default(0) @map("matches_played")
  last_location_lat    Float?    @map("last_location_lat")
  last_location_lng    Float?    @map("last_location_lng")
  user_role            String?   @map("user_role")
  company_name         String?   @map("company_name")
  business_category    String?   @map("business_category")
  is_sponsored         Boolean?  @default(false) @map("is_sponsored")
  is_admin             Boolean?  @default(false) @map("is_admin")
  gender               String?
  user_sports          Json?     @map("user_sports")
  onboarding_completed Boolean?  @default(false) @map("onboarding_completed")
  sport_preferences    Json?     @map("sport_preferences")
  dni_verificado       Boolean?  @default(false) @map("dni_verificado")
  dni_hash             String?   @map("dni_hash")
  dni_intentos         Int?      @default(0) @map("dni_intentos")
  fecha_verificacion   DateTime? @map("fecha_verificacion")
  tier                 String?   @default("FREE") // Valores: FREE | INICIAL | PLATA | ELITE
  last_login_at        DateTime? @map("last_login_at")

  posts                               posts[]
  created_matches                     matches[]                             @relation("match_creator")
  won_matches                         matches[]                             @relation("match_winner")
  match_participants                  match_participants[]
  wallet_transactions                 wallet_transactions[]
  notifications                       notifications[]
  reviews                             reviews[]
  followers                           followers[]                           @relation("following")
  following                           followers[]                           @relation("follower")
  squad_members                       squad_members[]
  created_squads                      squads[]                              @relation("squad_creator")
  post_comments                       post_comments[]
  post_comment_reactions              post_comment_reactions[]
  bookings                            bookings[]
  sent_messages                       messages[]                            @relation("sender_messages")
  received_messages                   messages[]                            @relation("receiver_messages")
  blocked_users                       user_blocks[]                         @relation("blocker_relation")
  blocked_by                          user_blocks[]                         @relation("blocked_relation")
  moderation_logs                     moderation_logs[]
  subscription                        subscriptions?
  nutrition_logs                      premium_nutrition_logs[]
  nutrition_360_logs                  nutrition_360_logs[]
  meal_plan_logs                      meal_plan_logs[]
  engagement_events                   engagement_events[]

// ... [TRUNCATED FOR INDECOPI DEPOSIT / TRUNCADO PARA DEPÓSITO INDECOPI] ...

  @@index([user_id, status])
  @@index([saved_at(sort: Desc)])
  @@map("engagement_achievements")
}

model engagement_recommendation_snapshots {
  id                  String   @id @default(uuid()) @db.Uuid
  user_id             String   @db.Uuid
  recommendation_date DateTime @db.Date
  type                String   @default("overview")
  language            String   @default("es")
  payload             Json
  model               String
  experiment_variant  String
  status              String   @default("ready")
  stale_reason        String?
  generated_at        DateTime @default(now()) @db.Timestamptz
  expires_at          DateTime @db.Timestamptz
  updated_at          DateTime @default(now()) @db.Timestamptz

  user profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, recommendation_date, type, language])
  @@index([user_id, status])
  @@index([expires_at])
  @@map("engagement_recommendation_snapshots")
}

model nutrition_360_logs {
  id             String   @id @default(uuid())
  user_id        String   @map("user_id")
  meal_name      String   @map("meal_name")
  calories       Int
  protein        Float
  carbs          Float
  fat            Float
  fiber          Float
  portion_size   String?  @map("portion_size")
  health_score   Int?     @map("health_score")
  analysis       String?
  recommendations String[] @default([])
  model          String?
  tokens         Int?
  latency_ms     Int?     @map("latency_ms")
  created_at     DateTime @default(now()) @map("created_at")

  user profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, created_at(sort: Desc)])
  @@map("nutrition_360_logs")
}

model meal_plan_logs {
  id                   String   @id @default(uuid())
  user_id              String   @map("user_id")
  preferences          String[]
  restrictions         String[] @default([])
  goal                 String
  meals_per_day        Int      @map("meals_per_day")
  duration_days        Int      @map("duration_days")
  plan_json            Json     @map("plan_json")
  summary              String?
  tips                 String[] @default([])
  sustainability_notes String?  @map("sustainability_notes")
  model                String?
  tokens               Int?
  latency_ms           Int?     @map("latency_ms")
  created_at           DateTime @default(now()) @map("created_at")

  user profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, created_at(sort: Desc)])
  @@map("meal_plan_logs")
}

```

---

## 📂 2. LÓGICA DE NEGOCIO PRINCIPAL (Servicio de Matchmaking)
**Archivo:** `server/src/matches/matches.service.ts`
```typescript
// ============================================================
// matches.service.ts — Servicio de partidos
// CRUD con validación de propiedad, unirse/salir con raw queries
// ============================================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMatchDto, UpdateMatchDto } from "./dto";

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sport?: string) {
    try {
      const matches = await this.prisma.matches.findMany({
        where: sport ? { sport } : undefined,
        include: {
          court: true,
          creator: true,
          match_participants: {
            include: {
              user: true,
            },
          },
        },
        take: 50,
      });

      // Mapear match_participants a current_players
      return matches.map((m) => {
        const players = m.match_participants ? m.match_participants.map((p) => p.user) : [];

        // Incluir también al creador en la lista de jugadores si no está ya
        if (m.creator && !players.some((p) => p.id === m.creator.id)) {
          players.unshift(m.creator);
        }

        return {
          ...m,
          current_players: players,
        };
      });
    } catch (error) {
      console.error("MatchesService.findAll error:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id },
        include: {
          court: true,
          creator: true,
          match_participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      const players = match.match_participants ? match.match_participants.map((p) => p.user) : [];

// ... [TRUNCATED FOR INDECOPI DEPOSIT / TRUNCADO PARA DEPÓSITO INDECOPI] ...

          creator_id: { not: userId },
          id: { notIn: joinedMatchIds },
          date: { gte: todayStr },
          ...(sport ? { sport } : {}),
        },
        include: {
          court: true,
          creator: true,
          match_participants: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { date: "asc" },
        take: 50,
      });

      return matches.map((m) => {
        const players = m.match_participants ? m.match_participants.map((p) => p.user) : [];
        if (m.creator && !players.some((p) => p.id === m.creator.id)) {
          players.unshift(m.creator);
        }

        return {
          ...m,
          current_players: players,
        };
      });
    } catch (error) {
      console.error("MatchesService.findRecommended error:", error);
      throw error;
    }
  }

  async leave(matchId: string, userId: string) {
    try {
      const match = await this.prisma.matches.findUnique({
        where: { id: matchId },
        include: {
          match_participants: true,
        },
      });

      if (!match) {
        throw new NotFoundException("Match not found");
      }

      if (match.creator_id === userId) {
        throw new ForbiddenException("Creator cannot leave the match");
      }

      const result = await this.prisma.match_participants.deleteMany({
        where: {
          match_id: matchId,
          user_id: userId,
        },
      });

      // Si el partido estaba lleno y alguien se va, reabrir
      if (match.status === "FULL" && result.count > 0) {
        await this.prisma.matches.update({
          where: { id: matchId },
          data: { status: "OPEN" },
        });
      }

      return result;
    } catch (error) {
      console.error("MatchesService.leave error:", error);
      throw error;
    }
  }
}

```

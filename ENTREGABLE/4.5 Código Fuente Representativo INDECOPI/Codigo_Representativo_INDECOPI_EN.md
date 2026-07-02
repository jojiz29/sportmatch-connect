# REPRESENTATIVE SOURCE CODE DEPOSIT (INDECOPI REQUIREMENT)

This document contains the initial and final portions of the source code and data schema for the **SportMatch Connect** project, strictly complying with the guidelines of the Copyright Directorate of INDECOPI (Peru) for the registration of computer programs.

---

## 📂 1. PERSISTENCE SCHEMA (Prisma ORM Schema)
**File:** `server/prisma/schema.prisma`
```prisma
// ============================================================
// schema.prisma — SportMatch database schema
// 16 models with dual-URL (pooler + direct) for Supabase us-west-2
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
  tier                 String?   @default("FREE") // Values: FREE | INICIAL | PLATA | ELITE
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

model venues {
  id              String      @id @default(uuid()) @db.Uuid
  name            String      @db.VarChar(255)
  description     String?     @db.Text
  location        Unsupported("geography(Point, 4326)")?
  address         String?     @db.Text
  price_per_hour  Decimal?    @db.Decimal(10, 2)
  sport_type      String?     @db.VarChar(100)
  image_url       String?     @db.Text
  is_active       Boolean?    @default(true)
  created_at      DateTime    @default(now()) @db.Timestamptz
  updated_at      DateTime    @updatedAt @db.Timestamptz

  bookings        bookings[]
  matches         matches[]

  @@index([location], type: GiST)
  @@map("venues")
}

model bookings {
  id              String    @id @default(uuid()) @db.Uuid
  venue_id        String    @db.Uuid
  user_id         String    @db.Uuid
  start_time      DateTime  @db.Timestamptz
  end_time        DateTime  @db.Timestamptz
  total_cost      Decimal   @db.Decimal(10, 2)
  split_count     Int       @default(1)
  status          String    @default("pending") @db.VarChar(50)
  fitcoins_used   Int       @default(0)
  stripe_payment_intent String? @map("stripe_payment_intent")
  created_at      DateTime  @default(now()) @db.Timestamptz
  updated_at      DateTime  @updatedAt @db.Timestamptz

  venue venues @relation(fields: [venue_id], references: [id], onDelete: Cascade)
  user  profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([venue_id])
  @@index([user_id])
  @@index([start_time])
  @@map("bookings")
}

model matches {
  id              String    @id @default(uuid()) @db.Uuid
  creator_id      String    @db.Uuid
  winner_id       String?   @db.Uuid
  venue_id        String?   @db.Uuid
  sport           String    @db.VarChar(100)
  match_date      DateTime  @db.Timestamptz
  max_players     Int       @default(10)
  status          String    @default("OPEN") @db.VarChar(50)
  created_at      DateTime  @default(now()) @db.Timestamptz
  updated_at      DateTime  @updatedAt @db.Timestamptz

  creator         profiles    @relation("match_creator", fields: [creator_id], references: [id])
  winner          profiles?   @relation("match_winner", fields: [winner_id], references: [id])
  venue           venues?     @relation(fields: [venue_id], references: [id])
  match_participants match_participants[]

  @@index([creator_id])
  @@index([sport, status])
  @@index([match_date])
  @@map("matches")
}

model match_participants {
  match_id String @db.Uuid
  user_id  String @db.Uuid

  match matches @relation(fields: [match_id], references: [id], onDelete: Cascade)
  user  profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@id([match_id, user_id])
  @@map("match_participants")
}

model wallet_transactions {
  id              String    @id @default(uuid()) @db.Uuid
  user_id         String    @db.Uuid
  amount          Int
  transaction_type String   @db.VarChar(50)
  description     String?   @db.Text
  reference_id    String?   @map("reference_id")
  created_at      DateTime  @default(now()) @db.Timestamptz

  user profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([created_at(sort: Desc)])
  @@map("wallet_transactions")
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

// ============================================================
// Additional models — Notification system, chat,
// availability, sports and invitations
// ============================================================

model notifications {
  id         String   @id @default(uuid()) @db.Uuid
  user_id    String   @db.Uuid
  type       String   @db.VarChar(50) // match_invitation, match_confirmed, payment, system, moderation
  title      String   @db.VarChar(255)
  body       String?  @db.Text
  read       Boolean  @default(false)
  created_at DateTime @default(now()) @db.Timestamptz
  updated_at DateTime @updatedAt @db.Timestamptz

  user profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, read])
  @@index([created_at(sort: Desc)])
  @@map("notifications")
}

model chat_messages {
  id           String   @id @default(uuid()) @db.Uuid
  match_id     String   @db.Uuid
  sender_id    String   @db.Uuid
  content      String   @db.Text
  message_type String   @default("text") @db.VarChar(20) // text, image, voice, system
  created_at   DateTime @default(now()) @db.Timestamptz

  match  matches  @relation(fields: [match_id], references: [id], onDelete: Cascade)
  sender profiles @relation(fields: [sender_id], references: [id], onDelete: Cascade)

  @@index([match_id, created_at(sort: Desc)])
  @@map("chat_messages")
}

model user_availability {
  id          String   @id @default(uuid()) @db.Uuid
  user_id     String   @db.Uuid
  day_of_week Int      @db.SmallInt // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time  String   @db.VarChar(5) // HH:mm format
  end_time    String   @db.VarChar(5) // HH:mm format
  is_active   Boolean  @default(true)

  user profiles @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, day_of_week, start_time])
  @@index([user_id, is_active])
  @@map("user_availability")
}

model sport_types {
  id                   Int    @id @default(autoincrement())
  name                 String @db.VarChar(100)
  description          String? @db.Text
  icon                 String? @db.VarChar(50) // Icon name for frontend mapping
  max_players_per_team Int    @default(1)

  @@index([name])
  @@map("sport_types")
}

model match_invitations {
  id         String   @id @default(uuid()) @db.Uuid
  match_id   String   @db.Uuid
  inviter_id String   @db.Uuid
  invitee_id String   @db.Uuid
  status     String   @default("pending") @db.VarChar(20) // pending, accepted, declined, expired
  created_at DateTime @default(now()) @db.Timestamptz

  match   matches  @relation(fields: [match_id], references: [id], onDelete: Cascade)
  inviter profiles @relation("inviter_matches", fields: [inviter_id], references: [id])
  invitee profiles @relation("invitee_matches", fields: [invitee_id], references: [id])

  @@unique([match_id, invitee_id])
  @@index([invitee_id, status])
  @@index([match_id, status])
  @@map("match_invitations")
}

```

---

## 📂 2. CORE BUSINESS LOGIC (Matchmaking Service)
**File:** `server/src/matches/matches.service.ts`
```typescript
// ============================================================
// matches.service.ts — Match service
// CRUD with ownership validation, join/leave with raw queries
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

      // Map match_participants to current_players
      return matches.map((m) => {
        const players = m.match_participants ? m.match_participants.map((p) => p.user) : [];

        // Also include the creator in the player list if not already present
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

      // If the match was full and someone leaves, reopen it
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

---

## 📂 3. REST API ENDPOINTS — COMPLETE CATALOG

The SportMatch Connect backend exposes the following REST endpoints organized by module. The base URL is `https://api.sportmatchconnect.com/api/v1` (production) or `http://localhost:3001/api/v1` (local development).

### 3.1. Authentication Module

| Method | Endpoint | Description | Auth | Body/Parameters |
|--------|----------|-------------|------|-----------------|
| POST | `/auth/register` | Register new user | No | `{ email, password, name }` |
| POST | `/auth/login` | Login | No | `{ email, password }` |
| POST | `/auth/logout` | Logout | Yes | — |
| POST | `/auth/refresh` | Refresh JWT token | Yes | `{ refresh_token }` |
| POST | `/auth/forgot-password` | Request password recovery | No | `{ email }` |
| POST | `/auth/reset-password` | Reset password | No | `{ token, password }` |
| GET  | `/auth/me` | Get current profile | Yes | — |

### 3.2. Profiles Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/profiles/:id` | Get profile by ID | Yes |
| PATCH  | `/profiles/:id` | Update profile | Yes (owner) |
| PUT    | `/profiles/:id/avatar` | Upload profile photo | Yes (owner) |
| GET    | `/profiles/:id/stats` | User statistics | Yes |
| POST   | `/profiles/:id/verify-dni` | Verify DNI with RENIEC | Yes (owner) |

### 3.3. Matches Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/matches` | List matches (sport filter) | Yes |
| GET    | `/matches/recommended` | Recommended matches (Haversine + Elo) | Yes |
| GET    | `/matches/:id` | Match detail | Yes |
| POST   | `/matches` | Create match | Yes |
| PATCH  | `/matches/:id` | Update match | Yes (creator) |
| DELETE | `/matches/:id` | Delete match | Yes (creator) |
| POST   | `/matches/:id/join` | Join match | Yes |
| POST   | `/matches/:id/leave` | Leave match | Yes |
| POST   | `/matches/:id/start` | Start match | Yes (creator) |
| POST   | `/matches/:id/end` | End match | Yes (creator) |
| POST   | `/matches/:id/invite` | Invite user | Yes |
| GET    | `/matches/:id/chat` | Get chat messages | Yes |

### 3.4. Venues Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/venues` | List venues (location filter) | Yes |
| GET    | `/venues/nearby` | Nearby venues (PostGIS) | Yes |
| GET    | `/venues/:id` | Venue detail | Yes |
| POST   | `/venues` | Register venue | Yes (admin/merchant) |
| PATCH  | `/venues/:id` | Update venue | Yes (owner) |
| GET    | `/venues/:id/availability` | Availability by date | Yes |

### 3.5. Bookings Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/bookings` | List user bookings | Yes |
| GET    | `/bookings/:id` | Booking detail | Yes |
| POST   | `/bookings` | Create booking | Yes |
| POST   | `/bookings/:id/pay` | Process payment with Stripe | Yes |
| POST   | `/bookings/:id/split` | Calculate payment split | Yes |
| DELETE | `/bookings/:id` | Cancel booking | Yes (owner) |

### 3.6. Payments Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST   | `/payments/create-intent` | Create Stripe Payment Intent | Yes |
| POST   | `/payments/confirm` | Confirm payment | Yes |
| GET    | `/payments/history` | Transaction history | Yes |
| POST   | `/payments/fitcoins/buy` | Buy FitCoins | Yes |
| POST   | `/payments/fitcoins/transfer` | Transfer FitCoins | Yes |

### 3.7. Moderation Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST   | `/moderation/check-image` | Check image (Edge AI) | Yes |
| GET    | `/moderation/reports` | List reports | Yes (admin) |
| POST   | `/moderation/reports` | Report content | Yes |
| PATCH  | `/moderation/reports/:id/resolve` | Resolve report | Yes (admin) |

### 3.8. AI — Sporty Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST   | `/ai/chat` | Chat with Sporty AI (Vertex AI Gemini) | Yes |
| POST   | `/ai/nutrition/analyze` | Analyze meal (nutrition 360) | Yes |
| POST   | `/ai/nutrition/plan` | Generate meal plan | Yes |
| GET    | `/ai/recommendations` | Get recommendations | Yes |

### 3.9. Notifications Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/notifications` | List notifications | Yes |
| PATCH  | `/notifications/:id/read` | Mark as read | Yes |
| POST   | `/notifications/read-all` | Mark all as read | Yes |

### 3.10. Admin Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/admin/users` | List users | Yes (admin) |
| PATCH  | `/admin/users/:id/ban` | Suspend user | Yes (admin) |
| GET    | `/admin/metrics` | System metrics | Yes (admin) |
| GET    | `/admin/logs` | System logs | Yes (admin) |
| POST   | `/admin/maintenance/clear-expired` | Clear expired data | Yes (admin) |

> **Note:** All protected endpoints require a JWT token in the header `Authorization: Bearer <token>`. Supabase RLS policies act as a second security layer at the database level.

---

## 📂 4. SUPABASE EDGE FUNCTIONS — EDGE FUNCTION CODE

Supabase Edge Functions (Deno Runtime) execute business logic at the network edge, close to the user. The critical system functions are presented below.

### 4.1. Matchmaking Heartbeat — Periodic Geolocation Update

```typescript
// supabase/functions/matchmaking-heartbeat/index.ts
// Executed every 5 minutes via Supabase cron schedule
// Updates GPS coordinates of active users and recalculates nearby matches

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { haversineDistance } from "./haversine.ts";

interface HeartbeatUser {
  id: string;
  last_location_lat: number;
  last_location_lng: number;
  preferred_sports: string[];
  elo_ratings: Record<string, number>;
}

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: activeUsers, error: fetchError } = await supabase
    .from("profiles")
    .select("id, last_location_lat, last_location_lng, preferred_sports")
    .gte("last_login_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .not("last_location_lat", "is", null)
    .not("last_location_lng", "is", null);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  const users = activeUsers as HeartbeatUser[];

  const matchPromises = users.map(async (user) => {
    const nearbyUsers = users.filter((other) => {
      if (other.id === user.id) return false;

      const distance = haversineDistance(
        user.last_location_lat,
        user.last_location_lng,
        other.last_location_lat,
        other.last_location_lng,
      );

      const hasCommonSport = user.preferred_sports.some((s) =>
        other.preferred_sports.includes(s)
      );

      return distance <= (hasCommonSport ? 10 : 25) && hasCommonSport;
    });

    if (nearbyUsers.length > 0) {
      const suggestions = nearbyUsers.map((target) => ({
        user_id: user.id,
        suggested_user_id: target.id,
        calculated_at: new Date().toISOString(),
        distance_km: haversineDistance(
          user.last_location_lat,
          user.last_location_lng,
          target.last_location_lat,
          target.last_location_lng,
        ),
      }));

      await supabase.from("match_suggestions").upsert(suggestions, {
        onConflict: "user_id, suggested_user_id",
        ignoreDuplicates: false,
      });
    }
  });

  await Promise.all(matchPromises);

  return new Response(
    JSON.stringify({ processed: users.length, timestamp: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" } },
  );
});
```

### 4.2. Notification Dispatcher — Push Notification Sending

```typescript
// supabase/functions/notification-dispatcher/index.ts
// Notification routing and sending (push, email, in-app)
// Triggered by INSERT on notifications table via Database Webhook

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@4.1.0";

interface NotificationEvent {
  type: "INSERT";
  table: string;
  schema: string;
  record: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    created_at: string;
  };
}

serve(async (req: Request) => {
  const payload: { event: NotificationEvent } = await req.json();
  const { record } = payload.event;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, email, push_token")
    .eq("id", record.user_id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  console.log(`[NOTIFICATION] In-app saved for user ${record.user_id}: ${record.title}`);

  if (["payment", "match_confirmed", "moderation"].includes(record.type)) {
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
      await resend.emails.send({
        from: "SportMatch Connect <notifications@sportmatchconnect.com>",
        to: profile.email,
        subject: record.title,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">🏟️ SportMatch Connect</h2>
          <p>${record.body}</p>
          <hr />
          <small style="color: #666;">Received on ${new Date(record.created_at).toLocaleString("es-PE")}</small>
        </div>`,
      });
      console.log(`[NOTIFICATION] Email sent to ${profile.email}`);
    } catch (emailError) {
      console.error(`[NOTIFICATION] Email failed: ${emailError}`);
    }
  }

  if (profile.push_token) {
    console.log(`[NOTIFICATION] Push notification queued for user ${record.user_id}`);
  }

  return new Response(
    JSON.stringify({
      status: "dispatched",
      channels: ["in-app", ...(record.type === "payment" ? ["email"] : [])],
      notification_id: record.id,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
```

### 4.3. Scheduled Venue Cleanup — Expired Booking Cleanup

```typescript
// supabase/functions/venue-cleanup/index.ts
// Executed daily (00:00 UTC) via cron schedule
// Cancels unpaid bookings after 30 minutes and frees availability

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: expiredBookings, error: fetchError } = await supabase
    .from("bookings")
    .select("id, venue_id, start_time, end_time, stripe_payment_intent")
    .eq("status", "pending")
    .lt("created_at", thirtyMinutesAgo);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!expiredBookings || expiredBookings.length === 0) {
    return new Response(JSON.stringify({ cleaned: 0, message: "No expired bookings found" }));
  }

  const expiredIds = expiredBookings.map((b) => b.id);
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .in("id", expiredIds);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  for (const booking of expiredBookings) {
    if (booking.stripe_payment_intent) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
        const response = await fetch(
          `https://api.stripe.com/v1/payment_intents/${booking.stripe_payment_intent}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );
        if (!response.ok) {
          console.error(`Failed to cancel PI ${booking.stripe_payment_intent}`);
        }
      } catch (stripeError) {
        console.error(`Stripe cancel error: ${stripeError}`);
      }
    }
  }

  await supabase.from("moderation_logs").insert({
    action: "venue_cleanup",
    details: `Cleaned ${expiredIds.length} expired bookings`,
    created_at: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({
      cleaned: expiredIds.length,
      booking_ids: expiredIds,
      timestamp: new Date().toISOString(),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
```

---

## 📂 5. NESTJS MODULE STRUCTURE — DEPENDENCY GRAPH

The SportMatch Connect backend follows a **Modular Monolith** architecture with well-defined NestJS modules. The directory structure and the dependency graph between modules are shown below.

### 5.1. Backend Directory Structure

```
server/src/
├── main.ts                          # Entrypoint with dual-URL dotenv
├── app.module.ts                    # Root module (imports all functional modules)
├── common/                          # Shared code between modules
│   ├── decorators/                  # @CurrentUser, @Public, @Roles decorators
│   ├── guards/                      # JwtAuthGuard, RolesGuard, RlsGuard
│   ├── filters/                     # GlobalExceptionFilter
│   ├── interceptors/                # LoggingInterceptor, TimingInterceptor
│   └── dto/                         # PaginationDto, generic ApiResponse<T>
├── prisma/                          # Persistence module
│   ├── prisma.module.ts             # @Global() — available across the app
│   ├── prisma.service.ts            # Prisma service with dual-URL (pooler + direct)
│   └── prisma.middleware.ts         # Middleware for slow query logging
├── auth/                            # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts              # Supabase Auth + JWT strategy
│   ├── strategies/
│   │   └── jwt.strategy.ts          # Passport JWT strategy
│   └── dto/                         # LoginDto, RegisterDto, RefreshDto
├── profiles/                        # User profiles module
│   ├── profiles.module.ts
│   ├── profiles.controller.ts
│   ├── profiles.service.ts          # CRUD + DNI verification + RLS
│   └── dto/                         # UpdateProfileDto, AvatarDto
├── matches/                         # Matches module
│   ├── matches.module.ts
│   ├── matches.controller.ts        # REST endpoints
│   ├── matches.service.ts           # CRUD + join/leave + findRecommended
│   ├── algorithms/                  # Matching algorithms
│   │   ├── haversine.ts             # Distance between GPS coordinates
│   │   ├── elo-rating.ts            # Dynamic Elo rating system
│   │   └── gale-shapley.ts          # Stable matching algorithm
│   └── dto/                         # CreateMatchDto, JoinMatchDto
├── venues/                          # Sports venues module
│   ├── venues.module.ts
│   ├── venues.controller.ts
│   ├── venues.service.ts            # CRUD + PostGIS queries
│   └── dto/                         # CreateVenueDto, NearbyQueryDto
├── bookings/                        # Bookings module
│   ├── bookings.module.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts          # CRUD + conflict validation
│   └── dto/                         # CreateBookingDto
├── payments/                        # Payments module (Stripe + FitCoins)
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts          # Payment Intents, splits, webhooks
│   └── dto/                         # PaymentIntentDto, SplitDto
├── ai/                              # Artificial Intelligence module
│   ├── ai.module.ts                 # Functional module (Sporty AI)
│   ├── ai-core.module.ts            # @Global() — Vertex AI, AiConfigService
│   ├── ai.controller.ts
│   ├── ai.service.ts                # Chat, nutrition, recommendations
│   ├── voice/                       # Voice chat with Sporty
│   │   ├── voice.module.ts
│   │   ├── voice.service.ts         # Text-to-Speech + Speech-to-Text
│   │   └── voice.controller.ts
│   ├── nutrition/                   # Nutritional analysis
│   │   ├── nutrition.module.ts
│   │   ├── nutrition.service.ts     # Vertex AI Gemini 2.5 Flash
│   │   └── nutrition.controller.ts
│   └── config/                      # AI configuration
│       ├── ai-config.service.ts     # Vertex AI client, model params
│       └── vertex-ai.service.ts     # Google Vertex AI SDK wrapper
├── moderation/                      # Moderation module
│   ├── moderation.module.ts
│   ├── moderation.controller.ts
│   ├── moderation.service.ts        # Edge AI + reports + trust_score
│   └── dto/                         # ReportDto, CheckImageDto
├── notifications/                   # Notifications module
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts     # Push, in-app, email
│   └── dto/                         # NotificationQueryDto
├── chat/                            # Messaging module
│   ├── chat.module.ts
│   ├── chat.gateway.ts              # WebSocket Gateway (Socket.IO)
│   ├── chat.service.ts              # Message persistence
│   └── dto/                         # SendMessageDto
└── admin/                           # Administration module
    ├── admin.module.ts
    ├── admin.controller.ts
    ├── admin.service.ts             # Metrics, users, logs
    └── dto/                         # BanUserDto
```

### 5.2. Module Dependency Graph

```
                    ┌─────────────────────────────────────────────────┐
                    │                 AppModule                       │
                    │      (Root module — imports all)                │
                    └──────────┬──────────┬──────────┬───────────────┘
                               │          │          │
              ┌────────────────┘          │          └──────────────────┐
              ▼                           ▼                            ▼
   ┌──────────────────┐     ┌────────────────────┐     ┌──────────────────────┐
   │   AuthModule     │     │   ProfilesModule   │     │    MatchesModule     │
   │                  │     │                    │     │                      │
   │ JwtAuthGuard     │◄───►│ ProfileService     │◄───►│ MatchesService       │
   │ JwtStrategy      │     │ DNI verification   │     │ HaversineAlgorithm   │
   │ Supabase Auth    │     │ Avatar upload      │     │ EloRating            │
   └────────┬─────────┘     └────────────────────┘     │ GaleShapley          │
            │                                           └──────────┬───────────┘
            │                                                      │
            ▼                                                      ▼
   ┌──────────────────┐     ┌────────────────────┐     ┌──────────────────────┐
   │  VenuesModule    │     │   BookingsModule   │     │   PaymentsModule     │
   │                  │     │                    │     │                      │
   │ PostGIS queries  │◄───►│ BookingService     │◄───►│ StripeService        │
   │ GeoJSON response │     │ Conflict detection │     │ FitCoins Wallet      │
   └──────────────────┘     └────────────────────┘     │ Split Payments       │
                                                       └──────────┬───────────┘
              ┌────────────────────────────────────────────────────┤
              │                    │                               │
              ▼                    ▼                               ▼
   ┌──────────────────┐     ┌────────────────────┐     ┌──────────────────────┐
   │    AiModule      │     │ ModerationModule   │     │  ChatModule (WS)     │
   │                  │     │                    │     │                      │
   │ VoiceService     │     │ Edge AI (NSFWJS)   │     │ WebSocket Gateway    │
   │ NutritionService │     │ Report management  │     │ Message persistence  │
   │ Vertex AI Gemini │     │ Trust score calc   │     │ Real-time broadcast  │
   └────────┬─────────┘     └────────────────────┘     └──────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                     AiCoreModule (@Global)                           │
   │                        AiConfigService                               │
   │                        VertexAiService                               │
   │                 (Injecttable in all modules)                          │
   └──────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────┐
   │                     PrismaModule (@Global)                           │
   │                     PrismaService (dual-URL)                         │
   │             Injecttable in all modules via DI                        │
   └──────────────────────────────────────────────────────────────────────┘
```

### 5.3. Dependency Injection Principles

1. **@Global() Modules:**
   - `PrismaModule` — Database service with Dual-URL (pooler 6543 for writes, direct 5432 for heavy PostGIS queries).
   - `AiCoreModule` — Shared Vertex AI and configuration providers. Available across the app without re-importing.

2. **Functional modules:** Each module (Auth, Matches, Venues, etc.) declares its own controllers, services, and DTOs. They import only the modules they need.

3. **WebSocket modules:** `ChatModule` uses a Socket.IO Gateway for real-time messaging. The gateway depends on `ChatService` for persistence and on `AuthModule` for JWT authentication.

4. **DTO Validation:** All endpoints use `class-validator` + `class-transformer` with a global `ValidationPipe` to guarantee input data integrity.

---

## 📂 6. TESTING INFRASTRUCTURE — PLAYWRIGHT AND VITEST

SportMatch Connect uses a three-layer testing approach: unit (Vitest), integration (Supertest + NestJS Testing), and E2E (Playwright). The main configurations and representative examples are presented below.

### 6.1. Vitest Configuration (Unit and Integration Testing)

```typescript
// server/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: "./src",
    include: ["**/*.spec.ts", "**/*.test.ts"],
    exclude: ["node_modules", "dist", ".git"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.test.ts",
        "src/**/*.module.ts",
        "src/main.ts",
        "src/**/*.dto.ts",
        "src/**/*.strategy.ts",
      ],
      thresholds: {
        branches: 70,
        functions: 75,
        lines: 80,
        statements: 80,
      },
    },
    setupFiles: ["./test/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 15000,
    sequence: {
      shuffle: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 6.2. Unit Test — Haversine Algorithm

```typescript
// server/src/matches/algorithms/haversine.spec.ts
import { describe, it, expect } from "vitest";
import { haversineDistance } from "./haversine";

describe("HaversineDistance", () => {
  const USIL_LAT = -12.0705;
  const USIL_LNG = -76.9836;
  const MIRAFLORES_LAT = -12.1212;
  const MIRAFLORES_LNG = -77.0308;

  it("should calculate correct distance between two known points", () => {
    const distance = haversineDistance(USIL_LAT, USIL_LNG, MIRAFLORES_LAT, MIRAFLORES_LNG);
    expect(distance).toBeGreaterThan(8.0);
    expect(distance).toBeLessThan(9.0);
  });

  it("should return 0 for identical coordinates", () => {
    const distance = haversineDistance(USIL_LAT, USIL_LNG, USIL_LAT, USIL_LNG);
    expect(distance).toBe(0);
  });

  it("should handle antipodal points correctly", () => {
    const distance = haversineDistance(0, 0, 0, 180);
    expect(distance).toBeGreaterThan(20000);
    expect(distance).toBeLessThan(20100);
  });

  it("should be commutative (dist(A,B) === dist(B,A))", () => {
    const dist1 = haversineDistance(USIL_LAT, USIL_LNG, MIRAFLORES_LAT, MIRAFLORES_LNG);
    const dist2 = haversineDistance(MIRAFLORES_LAT, MIRAFLORES_LNG, USIL_LAT, USIL_LNG);
    expect(dist1).toBeCloseTo(dist2, 10);
  });

  it("should handle coordinates near the poles", () => {
    const dist = haversineDistance(89.9, 0, 89.9, 180);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(50);
  });

  it("should handle integer coordinates", () => {
    const dist = haversineDistance(0, 0, 0, 1);
    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(112);
  });
});
```

### 6.3. Integration Test — Matches Service

```typescript
// server/src/matches/matches.service.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { MatchesService } from "./matches.service";
import { PrismaService } from "../prisma/prisma.service";

describe("MatchesService", () => {
  let service: MatchesService;
  let prisma: PrismaService;

  const mockPrisma = {
    matches: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    match_participants: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should find all matches with sport filter", async () => {
    const mockMatches = [
      { id: "1", sport: "futbol", creator_id: "user1", match_participants: [] },
      { id: "2", sport: "futbol", creator_id: "user2", match_participants: [] },
    ];

    mockPrisma.matches.findMany.mockResolvedValue(mockMatches);

    const result = await service.findAll("futbol");
    expect(result).toHaveLength(2);
    expect(mockPrisma.matches.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sport: "futbol" },
        take: 50,
      }),
    );
  });

  it("should throw NotFoundException when match does not exist", async () => {
    mockPrisma.matches.findUnique.mockResolvedValue(null);
    await expect(service.findOne("non-existent-id")).rejects.toThrow("Match not found");
  });

  it("should prevent creator from leaving a match", async () => {
    mockPrisma.matches.findUnique.mockResolvedValue({
      id: "1",
      creator_id: "user1",
      match_participants: [],
    });
    await expect(service.leave("1", "user1")).rejects.toThrow("Creator cannot leave the match");
  });
});
```

### 6.4. Playwright Configuration (E2E Testing)

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-results.json" }],
    ["list"],
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: { maxDiffPixels: 100 },
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 9"] },
    },
  ],
});
```

### 6.5. E2E Test — Authentication and Match Creation Flow

```typescript
// e2e/auth-match-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("SportMatch Connect — Full flow", () => {
  const TEST_EMAIL = `test-${Date.now()}@sportmatchconnect.com`;
  const TEST_PASSWORD = "TestPass123!";

  test("should register, login, and create a match", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Crear cuenta en SportMatch")).toBeVisible();

    await page.getByLabel("Correo electrónico").fill(TEST_EMAIL);
    await page.getByLabel("Contraseña").fill(TEST_PASSWORD);
    await page.getByLabel("Confirmar contraseña").fill(TEST_PASSWORD);
    await page.getByLabel("Nombre completo").fill("Test User E2E");

    await page.getByText("Selecciona tus deportes").click();
    await page.getByText("Fútbol").click();
    await page.getByText("Tenis").click();
    await page.getByRole("button", { name: "Registrarse" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText("Bienvenido, Test User")).toBeVisible();

    await page.getByRole("link", { name: "Crear partido" }).click();
    await page.getByLabel("Deporte").selectOption("futbol");
    await page.getByLabel("Fecha").fill("2026-07-15");
    await page.getByLabel("Hora").fill("18:00");
    await page.getByLabel("Ubicación").fill("Lima, Perú");
    await page.getByRole("button", { name: "Crear" }).click();

    await expect(page.getByText("Partido creado exitosamente")).toBeVisible();
    await expect(page.getByText("Fútbol - 18:00")).toBeVisible();

    await page.getByRole("button", { name: "Menú de usuario" }).click();
    await page.getByText("Cerrar sesión").click();
    await expect(page).toHaveURL("/login");
  });

  test("should show validation errors on empty form", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Registrarse" }).click();
    await expect(page.getByText("El correo es obligatorio")).toBeVisible();
    await expect(page.getByText("La contraseña es obligatoria")).toBeVisible();
  });
});
```

### 6.6. Testing Coverage — Quality Map

| Layer | Tool | Target Coverage | Key Files |
|-------|------|-----------------|-----------|
| Unit (Algorithms) | Vitest | 95%+ | haversine.spec.ts, elo-rating.spec.ts, gale-shapley.spec.ts |
| Unit (Services) | Vitest + NestJS Testing | 85%+ | matches.service.spec.ts, venues.service.spec.ts |
| Integration (API) | Supertest + NestJS Testing | 80%+ | app.e2e-spec.ts, auth.e2e-spec.ts |
| E2E (Frontend) | Playwright | 70%+ | auth-match-flow.spec.ts, payment-flow.spec.ts |
| Visual (UI) | Playwright Screenshot | Critical snapshots | dashboard-visual.spec.ts, mobile-responsive.spec.ts |
| Accessibility | Playwright + axe-core | WCAG 2.2 AA | accessibility.spec.ts |

> **Commands to run the tests:**
> - Unit: `cd server && npx vitest run`
> - Integration: `cd server && npx vitest run --config vitest.integration.config.ts`
> - E2E: `npx playwright test`
> - Coverage: `cd server && npx vitest run --coverage`
> - All tests: `npm test` (configured in root package.json)

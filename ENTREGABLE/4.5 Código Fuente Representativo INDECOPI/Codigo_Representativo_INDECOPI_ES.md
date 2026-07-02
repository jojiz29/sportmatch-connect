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
// Modelos adicionales — Sistema de notificaciones, chat,
// disponibilidad, deportes e invitaciones
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

---

## 📂 3. API REST ENDPOINTS — CATÁLOGO COMPLETO

El backend de SportMatch Connect expone los siguientes endpoints REST organizados por módulo. La base URL es `https://api.sportmatchconnect.com/api/v1` (producción) o `http://localhost:3001/api/v1` (desarrollo local).

### 3.1. Módulo de Autenticación

| Método | Endpoint | Descripción | Autenticación | Cuerpo/Parámetros |
|--------|----------|-------------|---------------|-------------------|
| POST | `/auth/register` | Registro de nuevo usuario | No | `{ email, password, name }` |
| POST | `/auth/login` | Inicio de sesión | No | `{ email, password }` |
| POST | `/auth/logout` | Cierre de sesión | Sí | — |
| POST | `/auth/refresh` | Refrescar token JWT | Sí | `{ refresh_token }` |
| POST | `/auth/forgot-password` | Solicitar recuperación | No | `{ email }` |
| POST | `/auth/reset-password` | Restablecer contraseña | No | `{ token, password }` |
| GET  | `/auth/me` | Obtener perfil actual | Sí | — |

### 3.2. Módulo de Perfiles (Profiles)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET    | `/profiles/:id` | Obtener perfil por ID | Sí |
| PATCH  | `/profiles/:id` | Actualizar perfil | Sí (propietario) |
| PUT    | `/profiles/:id/avatar` | Subir foto de perfil | Sí (propietario) |
| GET    | `/profiles/:id/stats` | Estadísticas del usuario | Sí |
| POST   | `/profiles/:id/verify-dni` | Verificar DNI con RENIEC | Sí (propietario) |

### 3.3. Módulo de Partidos (Matches)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET    | `/matches` | Listar partidos (filtro por deporte) | Sí |
| GET    | `/matches/recommended` | Partidos recomendados (Haversine + Elo) | Sí |
| GET    | `/matches/:id` | Detalle de partido | Sí |
| POST   | `/matches` | Crear partido | Sí |
| PATCH  | `/matches/:id` | Actualizar partido | Sí (creador) |
| DELETE | `/matches/:id` | Eliminar partido | Sí (creador) |
| POST   | `/matches/:id/join` | Unirse a partido | Sí |
| POST   | `/matches/:id/leave` | Salir de partido | Sí |
| POST   | `/matches/:id/start` | Iniciar partido | Sí (creador) |
| POST   | `/matches/:id/end` | Finalizar partido | Sí (creador) |
| POST   | `/matches/:id/invite` | Invitar usuario | Sí |
| GET    | `/matches/:id/chat` | Obtener mensajes del chat | Sí |

### 3.4. Módulo de Complejos Deportivos (Venues)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET    | `/venues` | Listar complejos (filtro por ubicación) | Sí |
| GET    | `/venues/nearby` | Complejos cercanos (PostGIS) | Sí |
| GET    | `/venues/:id` | Detalle de complejo | Sí |
| POST   | `/venues` | Registrar complejo | Sí (admin/comercio) |
| PATCH  | `/venues/:id` | Actualizar complejo | Sí (propietario) |
| GET    | `/venues/:id/availability` | Disponibilidad por fecha | Sí |

### 3.5. Módulo de Reservas (Bookings)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET    | `/bookings` | Listar reservas del usuario | Sí |
| GET    | `/bookings/:id` | Detalle de reserva | Sí |
| POST   | `/bookings` | Crear reserva | Sí |
| POST   | `/bookings/:id/pay` | Procesar pago con Stripe | Sí |
| POST   | `/bookings/:id/split` | Calcular split de pago | Sí |
| DELETE | `/bookings/:id` | Cancelar reserva | Sí (propietario) |

### 3.6. Módulo de Pagos (Payments)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST   | `/payments/create-intent` | Crear Payment Intent Stripe | Sí |
| POST   | `/payments/confirm` | Confirmar pago | Sí |
| GET    | `/payments/history` | Historial de transacciones | Sí |
| POST   | `/payments/fitcoins/buy` | Comprar FitCoins | Sí |
| POST   | `/payments/fitcoins/transfer` | Transferir FitCoins | Sí |

### 3.7. Módulo de Moderación (Moderation)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST   | `/moderation/check-image` | Verificar imagen (Edge AI) | Sí |
| GET    | `/moderation/reports` | Listar reportes | Sí (admin) |
| POST   | `/moderation/reports` | Reportar contenido | Sí |
| PATCH  | `/moderation/reports/:id/resolve` | Resolver reporte | Sí (admin) |

### 3.8. Módulo de IA — Sporty (AI)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST   | `/ai/chat` | Chat con Sporty AI (Vertex AI Gemini) | Sí |
| POST   | `/ai/nutrition/analyze` | Analizar comida (nutrición 360) | Sí |
| POST   | `/ai/nutrition/plan` | Generar plan de comidas | Sí |
| GET    | `/ai/recommendations` | Obtener recomendaciones | Sí |

### 3.9. Módulo de Notificaciones (Notifications)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET    | `/notifications` | Listar notificaciones | Sí |
| PATCH  | `/notifications/:id/read` | Marcar como leída | Sí |
| POST   | `/notifications/read-all` | Marcar todas como leídas | Sí |

### 3.10. Módulo de Administración (Admin)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET    | `/admin/users` | Listar usuarios | Sí (admin) |
| PATCH  | `/admin/users/:id/ban` | Suspender usuario | Sí (admin) |
| GET    | `/admin/metrics` | Métricas del sistema | Sí (admin) |
| GET    | `/admin/logs` | Logs del sistema | Sí (admin) |
| POST   | `/admin/maintenance/clear-expired` | Limpiar datos expirados | Sí (admin) |

> **Nota:** Todos los endpoints protegidos requieren un token JWT en el header `Authorization: Bearer <token>`. Las políticas RLS de Supabase actúan como segunda capa de seguridad a nivel de base de datos.

---

## 📂 4. SUPABASE EDGE FUNCTIONS — CÓDIGO DE FUNCIONES EN EL BORDE

Las Edge Functions de Supabase (Deno Runtime) ejecutan lógica de negocio en el borde de la red, cerca del usuario. A continuación se presentan las funciones críticas del sistema.

### 4.1. Matchmaking Heartbeat — Actualización Periódica de Geolocalización

```typescript
// supabase/functions/matchmaking-heartbeat/index.ts
// Ejecutada cada 5 minutos mediante cron schedule de Supabase
// Actualiza las coordenadas GPS de usuarios activos y recalcula matches cercanos

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

### 4.2. Notification Dispatcher — Envío de Notificaciones Push

```typescript
// supabase/functions/notification-dispatcher/index.ts
// Enrutamiento y envío de notificaciones (push, email, in-app)
// Disparada por INSERT en tabla notifications vía Database Webhook

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
          <small style="color: #666;">Recibido el ${new Date(record.created_at).toLocaleString("es-PE")}</small>
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

### 4.3. Scheduled Venue Cleanup — Limpieza de Reservas Expiradas

```typescript
// supabase/functions/venue-cleanup/index.ts
// Ejecutada diariamente (00:00 UTC) mediante cron schedule
// Cancela reservas no pagadas después de 30 minutos y libera disponibilidad

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

## 📂 5. ESTRUCTURA DEL MÓDULO NESTJS — GRAFO DE DEPENDENCIAS

El backend de SportMatch Connect sigue una arquitectura de **Monolito Modular** con módulos NestJS bien definidos. A continuación se muestra la estructura de directorios y el grafo de dependencias entre módulos.

### 5.1. Estructura de Directorios del Backend

```
server/src/
├── main.ts                          # Entrypoint con dotenv dual-URL
├── app.module.ts                    # Módulo raíz (importa todos los módulos funcionales)
├── common/                          # Código compartido entre módulos
│   ├── decorators/                  # @CurrentUser, @Public, @Roles decorators
│   ├── guards/                      # JwtAuthGuard, RolesGuard, RlsGuard
│   ├── filters/                     # GlobalExceptionFilter
│   ├── interceptors/                # LoggingInterceptor, TimingInterceptor
│   └── dto/                         # PaginationDto, ApiResponse<T> genérico
├── prisma/                          # Módulo de persistencia
│   ├── prisma.module.ts             # @Global() — disponible en toda la app
│   ├── prisma.service.ts            # Servicio Prisma con dual-URL (pooler + direct)
│   └── prisma.middleware.ts         # Middleware para logging de queries lentas
├── auth/                            # Módulo de autenticación
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts              # Supabase Auth + JWT strategy
│   ├── strategies/
│   │   └── jwt.strategy.ts          # Passport JWT strategy
│   └── dto/                         # LoginDto, RegisterDto, RefreshDto
├── profiles/                        # Módulo de perfiles de usuario
│   ├── profiles.module.ts
│   ├── profiles.controller.ts
│   ├── profiles.service.ts          # CRUD + verificación DNI + RLS
│   └── dto/                         # UpdateProfileDto, AvatarDto
├── matches/                         # Módulo de partidos
│   ├── matches.module.ts
│   ├── matches.controller.ts        # Endpoints REST
│   ├── matches.service.ts           # CRUD + join/leave + findRecommended
│   ├── algorithms/                  # Algoritmos de matching
│   │   ├── haversine.ts             # Distancia entre coordenadas GPS
│   │   ├── elo-rating.ts            # Sistema de puntuación Elo dinámico
│   │   └── gale-shapley.ts          # Algoritmo de matching estable
│   └── dto/                         # CreateMatchDto, JoinMatchDto
├── venues/                          # Módulo de complejos deportivos
│   ├── venues.module.ts
│   ├── venues.controller.ts
│   ├── venues.service.ts            # CRUD + PostGIS queries
│   └── dto/                         # CreateVenueDto, NearbyQueryDto
├── bookings/                        # Módulo de reservas
│   ├── bookings.module.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts          # CRUD + validación de conflictos
│   └── dto/                         # CreateBookingDto
├── payments/                        # Módulo de pagos (Stripe + FitCoins)
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts          # Payment Intents, splits, webhooks
│   └── dto/                         # PaymentIntentDto, SplitDto
├── ai/                              # Módulo de Inteligencia Artificial
│   ├── ai.module.ts                 # Módulo funcional (Sporty AI)
│   ├── ai-core.module.ts            # @Global() — Vertex AI, AiConfigService
│   ├── ai.controller.ts
│   ├── ai.service.ts                # Chat, nutrición, recomendaciones
│   ├── voice/                       # Chat de voz con Sporty
│   │   ├── voice.module.ts
│   │   ├── voice.service.ts         # Text-to-Speech + Speech-to-Text
│   │   └── voice.controller.ts
│   ├── nutrition/                   # Análisis nutricional
│   │   ├── nutrition.module.ts
│   │   ├── nutrition.service.ts     # Vertex AI Gemini 2.5 Flash
│   │   └── nutrition.controller.ts
│   └── config/                      # Configuración de IA
│       ├── ai-config.service.ts     # Vertex AI client, model params
│       └── vertex-ai.service.ts     # Wrapper Google Vertex AI SDK
├── moderation/                      # Módulo de moderación
│   ├── moderation.module.ts
│   ├── moderation.controller.ts
│   ├── moderation.service.ts        # Edge AI + reportes + trust_score
│   └── dto/                         # ReportDto, CheckImageDto
├── notifications/                   # Módulo de notificaciones
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts     # Push, in-app, email
│   └── dto/                         # NotificationQueryDto
├── chat/                            # Módulo de mensajería
│   ├── chat.module.ts
│   ├── chat.gateway.ts              # WebSocket Gateway (Socket.IO)
│   ├── chat.service.ts              # Persistencia de mensajes
│   └── dto/                         # SendMessageDto
└── admin/                           # Módulo de administración
    ├── admin.module.ts
    ├── admin.controller.ts
    ├── admin.service.ts             # Métricas, usuarios, logs
    └── dto/                         # BanUserDto
```

### 5.2. Grafo de Dependencias entre Módulos

```
                    ┌─────────────────────────────────────────────────┐
                    │                 AppModule                       │
                    │      (Module raíz — importa todos)              │
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
   │                 (Inyectable en todos los módulos)                     │
   └──────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────┐
   │                     PrismaModule (@Global)                           │
   │                     PrismaService (dual-URL)                         │
   │             Inyectable en todos los módulos vía DI                   │
   └──────────────────────────────────────────────────────────────────────┘
```

### 5.3. Principios de Inyección de Dependencias

1. **Módulos @Global():**
   - `PrismaModule` — Servicio de base de datos con Dual-URL (pooler 6543 para escritura, directo 5432 para consultas PostGIS pesadas).
   - `AiCoreModule` — Proveedores compartidos de Vertex AI y configuración. Disponibles en toda la app sin necesidad de re-importar.

2. **Módulos funcionales:** Cada módulo (Auth, Matches, Venues, etc.) declara sus propios controladores, servicios y DTOs. Importan unicamente los módulos que necesitan.

3. **Módulos con WebSocket:** `ChatModule` utiliza un Gateway de Socket.IO para mensajería en tiempo real. El gateway depende de `ChatService` para persistencia y de `AuthModule` para autenticación por JWT.

4. **Validación de DTOs:** Todos los endpoints utilizan `class-validator` + `class-transformer` con `ValidationPipe` global para garantizar la integridad de los datos de entrada.

---

## 📂 6. INFRAESTRUCTURA DE TESTING — PLAYWRIGHT Y VITEST

SportMatch Connect utiliza un enfoque de testing en tres capas: unitario (Vitest), integración (Supertest + NestJS Testing), y E2E (Playwright). A continuación se presentan las configuraciones principales y ejemplos representativos.

### 6.1. Configuración de Vitest (Testing Unitario e Integración)

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

### 6.2. Test Unitario — Algoritmo Haversine

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

### 6.3. Test de Integración — Servicio de Partidos

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

### 6.4. Configuración de Playwright (Testing E2E)

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

### 6.5. Test E2E — Flujo de Autenticación y Creación de Partido

```typescript
// e2e/auth-match-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("SportMatch Connect — Flujo completo", () => {
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

### 6.6. Cobertura de Testing — Mapa de Calidad

| Capa | Herramienta | Cobertura Objetivo | Archivos Clave |
|------|-------------|-------------------|----------------|
| Unitario (Algoritmos) | Vitest | 95%+ | haversine.spec.ts, elo-rating.spec.ts, gale-shapley.spec.ts |
| Unitario (Servicios) | Vitest + NestJS Testing | 85%+ | matches.service.spec.ts, venues.service.spec.ts |
| Integración (API) | Supertest + NestJS Testing | 80%+ | app.e2e-spec.ts, auth.e2e-spec.ts |
| E2E (Frontend) | Playwright | 70%+ | auth-match-flow.spec.ts, payment-flow.spec.ts |
| Visual (UI) | Playwright Screenshot | Snapshots críticos | dashboard-visual.spec.ts, mobile-responsive.spec.ts |
| Accesibilidad | Playwright + axe-core | WCAG 2.2 AA | accessibility.spec.ts |

> **Comando para ejecutar los tests:**
> - Unitarios: `cd server && npx vitest run`
> - Integración: `cd server && npx vitest run --config vitest.integration.config.ts`
> - E2E: `npx playwright test`
> - Cobertura: `cd server && npx vitest run --coverage`
> - Todos los tests: `npm test` (configurado en package.json raíz)
```

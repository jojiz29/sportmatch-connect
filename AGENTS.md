# SportMatch Connect — AGENTS.md

## 🏗 Project Architecture & Domains

- **Frontend:** React 19 + TypeScript + Supabase + Vite using **Feature-Sliced Design (FSD)**.
- **Backend:** NestJS + Prisma backend located in `/server/`.
- **Database:** Supabase PostgreSQL with Row Level Security (RLS) enabled.

## ⚠️ High-Signal Quirks & Developer Commands

- **Frontend Dev Server:** Run `npx vite`. (Do NOT run `npm run dev` for the frontend!)
- **Backend Dev Server:** `npm run dev` in the root actually starts the **backend** (`cd server && npm install && npm run build && npm run start:prod`).
- **Tests:** `npm run test` (Vitest), `npm run test:e2e` (Playwright).
- **Pre-commit constraints:** Hook runs `eslint --fix` → `prettier --write` → `tsc --noEmit`. Fix all TS errors before committing.

## 🗄️ Database & Prisma Dual-URL Architecture (us-west-2)

**CRITICAL PROTOCOL:** The project relies on a Dual-URL Prisma setup with Supabase's Oregon (`us-west-2`) pooler.
If modifying environment variables or Prisma configuration, STRICTLY adhere to:

1. **Environment Config** (both root `.env` and `/server/.env`):
   - `DATABASE_URL="postgresql://postgres.gzyoxfhzuxknqacplapi:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"`
   - `DIRECT_URL="postgresql://postgres.gzyoxfhzuxknqacplapi:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres"`
2. **Prisma Schema (`/server/prisma/schema.prisma`)**:
   - The datasource MUST enforce dual-routing: `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")`.
3. **Backend Entrypoint (`/server/src/main.ts`)**:
   - MUST perform absolute environment loading via `dotenv` at Line 1 (resolving root `.env` and server `.env`) before `NestFactory` compiles, to avoid `dist/` context bugs.

## 📁 Feature-Sliced Design (FSD) Rules

- **Layer Order:** `app` → `routes` → `widgets` → `features` → `entities` → `shared`.
- **Import Rule:** Only import _downward_. Never import upward.
- **Business Logic:** `src/routes/` must NOT contain business logic; delegate to `features/` or `entities/`.

## 🐛 Common Pitfalls

- **Prisma Migrations with Pooler:** Direct Prisma introspection/push sometimes fails through the pooler. Foreign Keys must often be added manually via Supabase Dashboard.
- **PostgREST Cache:** If you change the DB schema directly in Supabase, run `NOTIFY pgrst, 'reload schema'` in the SQL Editor so the frontend client sees the changes.
- **User ID typing:** Legacy tables might use `varchar` for user IDs, but `profiles.id` is `uuid`. Match them carefully.
- **Mock Mode:** Offline dev is supported via `VITE_USE_MOCKS=true`.

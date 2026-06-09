# SportMatch Connect — AGENTS.md

## Project Overview

SportMatch Connect is a React 19 + TypeScript + Supabase sports matchmaking platform using Feature-Sliced Design (FSD).

**Branches:**
- `main` - Production branch
- `Juan` - Development branch with comments/reactions feature and `/server` Express backend

---

## Critical Architecture Rules

### Feature-Sliced Design Layers (imports only downward)
```
src/app          → Root layout, providers, styles
src/routes       → TanStack Router page definitions
src/widgets      → Complex composite components
src/features    → Business capabilities (matchmaking, wallet, etc.)
src/entities     → Types, stores (user, match, court)
src/shared      → UI components, apiClient, i18n
```

**Rule:** `shared` → `entities` → `features` → `widgets/routes`. Never import upward.

### TypeScript Rules
- **Zero `any` tolerance** - Type everything explicitly
- **No hardcoded strings** - Use `useTranslation()` + `es.json`/`en.json`
- Routes (`src/routes/`) must NOT contain business logic - delegate to `features/`

---

## Key Commands

```bash
npm run dev         # Start dev server (port 5178+)
npm run typecheck   # tsc --noEmit (runs pre-commit)
npm run lint        # ESLint
npm run format      # Prettier
npm run test         # Vitest unit tests
npm run test:e2e    # Playwright E2E tests
npm run build       # Vite production build
```

**Pre-commit hook runs:** `eslint --fix` → `prettier --write` → `typecheck`

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | For production |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | For production |
| `VITE_USE_MOCKS=true` | Enable local mock mode (default) | For offline dev |

**DO NOT commit `.env`** - Use `.env.example` as template.

---

## Supabase Database Info

- **Project:** `gzyoxfhzuxknqacplapi.supabase.co`
- **Tables:** profiles, matches, courts, posts, post_comments, post_comment_reactions, squads, messages, wallet_transactions, notifications, etc.
- **Auth:** Supabase Auth (email/password)
- **RLS:** Row Level Security enabled on all tables

---

## Backend Server (`/server`)

Express + Prisma backend exists at `server/` but is NOT deployed. Created for future NestJS migration.

Current endpoints (not deployed):
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/profile`

**Planned migration:** Convert to NestJS and deploy as Vercel Serverless Functions.

---

## Testing Notes

- **Vitest:** Unit tests in `src/**/*.test.ts`
- **Playwright:** E2E tests in `tests/e2e/`
- **Demo mode:** Set `VITE_USE_MOCKS=true` for offline development without Supabase

---

## Vercel Deployment

- **Frontend:** https://sportmatch-connect-juan-alonso.vercel.app (branch `Juan`)
- **Supabase Auth redirect:** Configured in Supabase Dashboard

---

## Common Pitfalls

1. **PostgREST schema cache** - After DB schema changes, run `NOTIFY pgrst, 'reload schema'`
2. **Foreign keys in Supabase** - Use Supabase Dashboard SQL Editor to add FKs manually (Prisma `db push` fails due to pooler)
3. **User ID type mismatch** - `profiles.id` is `uuid`, some legacy tables use `varchar`
4. **Supabase pooler connection** - Direct Prisma introspection fails; schema must be written manually or via Supabase Management API

---

## File Paths

- Types: `src/entities/types.ts`
- Auth store: `src/entities/user/useAuth.ts`
- API client: `src/shared/api/apiClient.ts`
- Supabase client: `src/lib/supabase.ts` or `src/shared/api/supabase.ts`
- i18n: `src/shared/i18n/locales/{es,en}.json`
- Migrations: `supabase/migrations/`
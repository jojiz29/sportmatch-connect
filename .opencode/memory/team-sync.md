# Team Sync — SportMatch Connect

## Current Branch Status (as of 2026-06-13 01:42 AM)

### `main` branch

- Latest commit: `ec20609` — Merge pull request #24 from jojiz29/edwin
- Contains: Only the **theme refactor** commit (`5d76f77`)
- **Missing**: AI module, Vertex AI integration, Vercel deploy fixes, CORS fixes

### `edwin` branch

- Has 5 commits ahead of main's previous state:
  - `e7a4d6d` — fix(vercel): simplify to frontend-only deploy (backend on Render)
  - `16f38f3` — fix(vercel): add serverless handler for /api/\* routes
  - `9acc407` — fix(vercel): remove @-prefixed secret references that caused deploy failure
  - `140ef2c` — feat(ai): integrate real Vertex AI with gemini-2.5-flash + unified dev stack
  - `5d76f77` — refactor(theme): refactorización global del sistema de temas y paleta unificada ✅ (already in main)

### Collaborator Context

- **Juan Alonso Salvatierra** (Backend Lead) — works on the backend, deployed to Render from main
- **Edwin Flores Sanchez** (You) — works on frontend + dev tooling + AI integration
- They coordinate via WhatsApp (midnight 1:38-1:41 AM)
- Juan is using a personal branch called "juan" for backend work
- Edwin works on the "edwin" branch for frontend work

## Deployment Strategy (Multi-Platform)

| Component                 | Platform     | Status                           |
| ------------------------- | ------------ | -------------------------------- |
| Frontend (Vite SPA)       | Vercel       | ✅ Configured with vercel.json   |
| Backend (NestJS + Prisma) | Render       | ✅ Configured with render.yaml   |
| Database (Postgres)       | Supabase     | ✅ Active in us-west-2           |
| AI (Vertex AI)            | Google Cloud | ✅ Integrated with @google/genai |

## Render Environment Variables — Current State

### ✅ Already Configured (per screenshot)

- `DATABASE_URL`
- `FRONTEND_URL`
- `JWT_SECRET`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

### ❌ MISSING — Required for AI Chat to work

These need to be added in Render Dashboard:

- `GOOGLE_APPLICATION_CREDENTIALS_JSON` — Inline JSON of Service Account (one line)
- `GOOGLE_CLOUD_PROJECT` = `sportmach-core`
- `VERTEX_AI_LOCATION` = `us-central1`
- `VERTEX_AI_MODEL_ID` = `gemini-2.5-flash`
- `VERTEX_AI_MAX_TOKENS` = `1024`
- `VERTEX_AI_TEMPERATURE` = `0.7`
- `VERTEX_AI_MAX_RETRIES` = `3`
- `VERTEX_AI_TIMEOUT_MS` = `30000`
- `VERTEX_AI_RATE_LIMIT_PER_MINUTE` = `20`

### ⚠️ CRITICAL: Render also needs the AI module code

Even with env vars, the AI endpoint won't work because main doesn't have:

- `server/src/ai/` directory
- `@google/genai` dependency in `server/package.json`
- CORS fixes in `server/src/main.ts`
- Serverless-aware `createApp()` export

**Solution:** Need to merge edwin → main or have Juan cherry-pick the AI module.

## Key Files Modified by Edwin (need to reach main)

- `server/src/ai/ai-config.service.ts` — Validates env vars
- `server/src/ai/ai.service.ts` — Business logic + rate limiting
- `server/src/ai/ai.controller.ts` — REST endpoint
- `server/src/ai/ai.module.ts` — NestJS module
- `server/src/ai/vertex-ai.service.ts` — Vertex AI integration
- `server/src/ai/dto/chat.dto.ts` — Request/response DTOs
- `server/src/main.ts` — Refactored for CORS + serverless compatibility
- `server/src/app.module.ts` — Imports AiModule
- `server/package.json` — @google/genai dependency
- `server/.env` — Vertex AI env vars
- `server/.gitignore` — Credentials protection
- `scripts/dev-stack.mjs` — Unified dev orchestrator
- `scripts/test-ai-chat.mjs` — E2E test for AI
- `vercel.json` — Frontend-only deploy config
- `docs/VERCEL_DEPLOY.md` — Deployment guide
- `.env.example` — Env var template
- `.vercelignore` — Excludes from Vercel uploads
- `api/[...path].js` — Optional serverless fallback

## Vercel Environment Variables — Current State

### ✅ Configured (per user's earlier message)

- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `VITE_MAPBOX_TOKEN`
- `DATABASE_URL`
- `DIRECT_URL`
- `RENIEC_API_KEY`
- `VERIFICAPE_API_KEY`
- `FRONTEND_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_USE_MOCKS`
- `VITE_API_URL`

### ❓ Status Unclear — May Have Been Added Recently

- `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- `SUPABASE_JWT_SECRET` (may be in Render instead)
- `JWT_SECRET` (may be in Render instead)
- `GOOGLE_CLOUD_PROJECT`
- `VERTEX_AI_LOCATION`
- `VERTEX_AI_MODEL_ID`
- `VERTEX_AI_MAX_TOKENS`
- `VERTEX_AI_TEMPERATURE`
- `VERTEX_AI_MAX_RETRIES`
- `VERTEX_AI_TIMEOUT_MS`
- `VERTEX_AI_RATE_LIMIT_PER_MINUTE`
- `PORT`
- `NODE_ENV`

## Workflow Notes

### Local Development

- `npm run dev` — Full stack (frontend + backend)
- `npm run dev:frontend` — Vite only (port 5173)
- `npm run dev:backend` — NestJS only (port 3000)
- Backend env vars: `server/.env` (auto-loaded by main.ts)

### Theme System (3 themes)

- **World Cup** (default) — Deep Navy + Metallic Gold
- **Dark Footballer** — Pitch Black + Neon Green
- **Light** — White + Fiery Orange

## AI Chat Component

- **Frontend**: `src/features/ai-assistant/` (FSD: model/store, api, ui)
- **Backend**: `server/src/ai/` (NestJS module)
- **Trigger**: Floating avatar button bottom-right
- **Endpoint**: POST `/api/v1/ai/chat` (requires Supabase JWT)
- **Model**: Gemini 2.5 Flash on Vertex AI
- **Test script**: `node scripts/test-ai-chat.mjs`

## Local URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/docs
- AI endpoint: http://localhost:3000/api/v1/ai/chat

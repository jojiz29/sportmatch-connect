# SportMatch Connect — AGENTS.md

## 🏗 Project Architecture & Domains

- **Frontend:** React 19 + TypeScript + Supabase + Vite using **Feature-Sliced Design (FSD)**.
- **Backend:** NestJS + Prisma backend located in `/server/`.
- **Database:** Supabase PostgreSQL with Row Level Security (RLS) enabled.

## 📐 Architecture Decision Records (ADR)

Las decisiones arquitectónicas se documentan en `docs/adr/`. Cualquier decisión
técnica difícil de revertir debe tener su ADR antes de mergear a `main`.

- [ADR-001](docs/adr/ADR-001-database-persistence.md): PostgreSQL/Supabase como persistencia principal.
- [Índice completo](docs/adr/README.md).

**Cuándo crear una ADR:** decisión arquitectónica, difícil de revertir, con
alternativas razonables, que afecta a más de un componente. Ver
`docs/adr/README.md` para la guía completa.

## ⚠️ High-Signal Quirks & Developer Commands

- **Frontend Dev Server:** Run `npx vite`. (Do NOT run `npm run dev` for the frontend!)
- **Backend Dev Server:** `npm run dev` in the root actually starts the **backend** (`cd server && npm install && npm run build && npm run start:prod`).
- **Tests:** `npm run test` (Vitest), `npm run test:e2e` (Playwright).
- **Pre-commit constraints:** Hook runs `eslint --fix` → `prettier --write` → `tsc --noEmit`. Fix all TS errors before committing.

## 🔑 Infrastructure Credentials (Render + Vercel)

**Location:** `C:\Users\ejuni\.opencode\credentials\sportmatch-infrastructure.json`
**Status:** Outside the repo. Git cannot access it. Windows ACL restricted to current user.
**Rotation policy:** Rotate tokens every 90 days OR immediately if exposed. Update `last_rotated` in the file.

### Quick API access

```powershell
# Load credentials
$creds = Get-Content "C:\Users\ejuni\.opencode\credentials\sportmatch-infrastructure.json" -Raw | ConvertFrom-Json

# Render API
$renderHeaders = @{ Authorization = "Bearer $($creds.render.api_token)" }
$renderService = "https://api.render.com/v1/services/$($creds.render.service_id)"

# Vercel API
$vercelHeaders = @{ Authorization = "Bearer $($creds.vercel.api_token)" }
$vercelProjects = "https://api.vercel.com/v9/projects"
```

### Pre-built helper scripts (use these — never inline the tokens)

- `scripts/infra/render-status.ps1` → Service status, env vars (masked), recent deploys
- `scripts/infra/render-logs.ps1` → Tail live logs
- `scripts/infra/render-deploy.ps1` → Trigger manual deploy with commit SHA
- `scripts/infra/render-env-set.ps1` → Update env vars (use with care)
- `scripts/infra/vercel-status.ps1` → List projects + last deploy per project
- `scripts/infra/vercel-env.ps1` → Get/set env vars per project

All scripts auto-load the credentials file and **mask secrets** in any console output.

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

## 🧩 NestJS Dependency Injection — VoiceService Fallo Clásico (15-jun-2026)

**Síntoma observado en Render:**

```
[Nest] LOG [InstanceLoader] PrismaModule dependencies initialized +308ms
[Nest] ERROR [ExceptionHandler] Nest can't resolve dependencies of the
      VoiceService (?, VertexAiService). Please make sure that the
      argument AiConfigService at index [0] is available in the
      VoiceModule context.
```

**Causa raíz:** `VoiceService` requiere `AiConfigService` y `VertexAiService` (segundo con `@Optional()`), pero `AiConfigService` y `VertexAiService` solo se declararon como providers en `AiModule`. Cuando `VoiceModule` se carga transitivamente, NestJS **no sube al módulo padre** para buscar providers — busca SOLO en su propio scope.

**Regla de oro:** En NestJS, un provider es visible para un módulo SOLO si:

1. Está declarado en `providers` de ese mismo módulo, **o**
2. Está exportado por un módulo en sus `imports`, **o**
3. Está marcado con `@Global()` en su módulo (visible en toda la app).

**Solución aplicada en este repo (`server/src/ai/ai-core.module.ts`):**

- `AiConfigService` y `VertexAiService` se movieron a un módulo `@Global()` llamado `AiCoreModule`.
- `AiModule` y `VoiceModule` (y cualquier módulo futuro que use IA) lo importan.
- Los providers se vuelven **visibles globalmente** sin necesidad de re-declararlos o re-exportarlos.

**Anti-patrones a evitar:**

- ❌ Declarar el mismo provider en 2+ módulos → genera 2 instancias, caché inconsistente
- ❌ Importar el módulo padre en el submódulo (circular) → `Nest can't resolve dependencies of the XModule`
- ❌ Crear wrappers de providers para "re-exponer" → boilerplate innecesario

**Cuándo usar `@Global()`:** Solo para providers compartidos por **múltiples módulos no relacionados** (config, logger, db client, AI clients). NO abuses o terminarás con un grafo de DI difícil de testear.

## 🔒 Seguridad — Vulnerabilidades y auditoría

**Última auditoría:** 15-jun-2026
**Versiones:** NestJS 11.1.27, @nestjs/_ 11.x, @google/_ últimas

**Estado actual (producción):** 0 vulnerabilidades críticas. 20 moderate en `js-yaml<4.1.1` transitivo de devDependencies Jest/Babel/Istanbul — **no afecta producción**.

**Cómo auditar:**

```bash
cd server && npm audit
cd server && npm audit --production  # solo prod
```

**Política de actualización:** Cuando npm audit reporte vulns **high** o **critical** en deps de producción, abrir rama `fix/security-<fecha>` y actualizar a la versión patch (no breaking) o minor. NO usar `npm audit fix --force` directamente (puede romper NestJS por cambios breaking).

# 🔐 Variables de Entorno — Listado Completo

Inventario exhaustivo de las variables que necesita cada componente del stack SportMatch Connect.
Basado en auditoría del código (`server/src/**/*.ts`, `src/**/*.ts`, `render.yaml`, `.env.example`).

---

## 📊 Tabla Resumen Rápido

| Variable                              |     Supabase      | Vercel (frontend) | Backend (Render) | Origen                           |
| ------------------------------------- | :---------------: | :---------------: | :--------------: | -------------------------------- |
| `VITE_SUPABASE_URL`                   |         —         |        ✅         |        —         | Supabase Dashboard → API         |
| `VITE_SUPABASE_ANON_KEY`              |         —         |        ✅         |     opcional     | Supabase Dashboard → API         |
| `VITE_API_URL`                        |         —         |        ✅         |        —         | Tu URL de Render                 |
| `VITE_USE_MOCKS`                      |         —         |     opcional      |     opcional     | Local dev only                   |
| `VITE_MAPBOX_TOKEN`                   |         —         |     opcional      |        —         | Mapbox                           |
| `VITE_STRIPE_PUBLISHABLE_KEY`         |         —         |     opcional      |        —         | Stripe                           |
| `SUPABASE_URL`                        |         —         |         —         |        ✅        | Mismo que VITE_SUPABASE_URL      |
| `SUPABASE_ANON_KEY`                   |         —         |         —         |        ✅        | Mismo que VITE_SUPABASE_ANON_KEY |
| `SUPABASE_SERVICE_ROLE_KEY`           |    generado en    |         —         |        ✅        | Supabase Dashboard → API         |
| `SUPABASE_JWT_SECRET`                 |    generado en    |         —         |        ✅        | Supabase Dashboard → API         |
| `DATABASE_URL`                        | connection string |         —         |        ✅        | Supabase Dashboard → DB          |
| `DIRECT_URL`                          | connection string |         —         |        ✅        | Supabase Dashboard → DB          |
| `FRONTEND_URL`                        |         —         |         —         |        ✅        | Tu URL de Vercel                 |
| `JWT_SECRET`                          |         —         |         —         |        ✅        | Genera uno aleatorio             |
| `CRON_SECRET`                         |         —         |         —         |        ✅        | Genera uno aleatorio             |
| `PORT`                                |         —         |         —         |       auto       | Render lo inyecta                |
| `NODE_ENV`                            |         —         |         —         |   `production`   | Manual                           |
| `GOOGLE_CLOUD_PROJECT`                |         —         |         —         |        ✅        | Google Cloud Console             |
| `VERTEX_AI_LOCATION`                  |         —         |         —         |        ✅        | Config fijo                      |
| `VERTEX_AI_MODEL_ID`                  |         —         |         —         |        ✅        | Config fijo                      |
| `VERTEX_AI_MAX_TOKENS`                |         —         |         —         |        ✅        | Config fijo                      |
| `VERTEX_AI_TEMPERATURE`               |         —         |         —         |        ✅        | Config fijo                      |
| `VERTEX_AI_MAX_RETRIES`               |         —         |         —         |        ✅        | Config fijo                      |
| `VERTEX_AI_TIMEOUT_MS`                |         —         |         —         |        ✅        | Config fijo                      |
| `VERTEX_AI_RATE_LIMIT_PER_MINUTE`     |         —         |         —         |        ✅        | Config fijo                      |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` |         —         |         —         |        ✅        | Google Cloud Service Account     |
| `STRIPE_SECRET_KEY`                   |         —         |         —         |     opcional     | Stripe Dashboard                 |
| `RENIEC_API_KEY`                      |         —         |         —         |     opcional     | Proveedor DNI Perú               |
| `VERIFICAPE_API_KEY`                  |         —         |         —         |     opcional     | Verifica.pe                      |

---

## 1️⃣ SUPABASE — Variables a generar/consultar

Supabase **no usa "env vars" en sí** (es SaaS), pero，你需要 **obtener de su dashboard** los siguientes valores que después se inyectan en Vercel y Render.

### 🔗 Obtener en: [supabase.com/dashboard](https://supabase.com/dashboard) → proyecto `gzyoxfhzuxknqacplapi`

#### En **Settings → API**

| Key en Supabase                            | Para qué sirve                                                | Dónde va después                                             |
| ------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------ |
| **Project URL**                            | URL del proyecto (`https://gzyoxfhzuxknqacplapi.supabase.co`) | Vercel `VITE_SUPABASE_URL` + Render `SUPABASE_URL`           |
| **anon public key** (`sb_publishable_...`) | Lectura/escritura con RLS activado (frontend seguro)          | Vercel `VITE_SUPABASE_ANON_KEY` + Render `SUPABASE_ANON_KEY` |
| **service_role secret** (`sb_secret_...`)  | Bypass de RLS — **NUNCA exponer al frontend**                 | Solo Render `SUPABASE_SERVICE_ROLE_KEY`                      |
| **JWT Secret**                             | Firma de tokens JWT para validar usuarios                     | Solo Render `SUPABASE_JWT_SECRET`                            |

#### En **Settings → Database → Connection string**

| Key en Supabase                            | Para qué sirve                                             | Dónde va después      |
| ------------------------------------------ | ---------------------------------------------------------- | --------------------- |
| **Connection string (Pooling, port 6543)** | Conexión a través del pooler PgBouncer (`?pgbouncer=true`) | Render `DATABASE_URL` |
| **Direct connection (port 5432)**          | Conexión directa para migraciones Prisma                   | Render `DIRECT_URL`   |

⚠️ **IMPORTANTE (Dual-URL Prisma):**

- `DATABASE_URL` → `aws-1-us-west-2.pooler.supabase.com:6543` (puerto 6543, `?pgbouncer=true`)
- `DIRECT_URL` → `aws-1-us-west-2.pooler.supabase.com:5432` (puerto 5432, sin pgbouncer)

#### En **SQL Editor** (crear/verificar)

Ejecutar tras cambios de schema:

```sql
NOTIFY pgrst, 'reload schema';
```

#### En **Authentication → URL Configuration**

- **Site URL:** `https://sportmatch-connect-juan-alonso.vercel.app`
- **Redirect URLs:** añadir `https://sportmatch-connect-juan-alonso.vercel.app/auth/callback`

#### En **Database → Replication**

Habilitar realtime para las tablas: `messages`, `notifications`, `match_participants`.

#### En **Database → Roles**

- Rol `service_role` ya existe por defecto
- Rol `authenticated` ya existe por defecto
- Rol `anon` ya existe por defecto (usado para RLS)

#### ⚠️ NO en Supabase

- **Credenciales de Google Cloud (Vertex AI)** — esas van en Render, NO en Supabase
- **JWT_SECRET propio** — ese va en Render
- **API keys de pagos** (Stripe/Reniec) — esas van en Render

---

## 2️⃣ VERCEL (Frontend) — Variables de Entorno

Configurar en: [vercel.com/dashboard](https://vercel.com/dashboard) → proyecto → Settings → Environment Variables

> 💡 El prefijo `VITE_` es **obligatorio** para que Vite las inyecte en el bundle del frontend.

### 🔴 Requeridas (rompen el deploy si faltan)

| Variable                 | Valor ejemplo                                    | Environments        |
| ------------------------ | ------------------------------------------------ | ------------------- |
| `VITE_SUPABASE_URL`      | `https://gzyoxfhzuxknqacplapi.supabase.co`       | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_RWQAc4K1J0zI3RZKRDXHYw_QRIF30D9` | Production, Preview |
| `VITE_API_URL`           | `https://sportmatch-api.onrender.com`            | Production, Preview |

> ⚠️ **`VITE_API_URL` debe ser la URL del BACKEND (Render), NO la del frontend.**
> El guardarraíl de `vite.config.ts` falla la build si apunta a `*.vercel.app`.

### 🟡 Opcionales (sin romper deploy)

| Variable                      | Valor ejemplo    | Uso                                          |
| ----------------------------- | ---------------- | -------------------------------------------- |
| `VITE_USE_MOCKS`              | `false`          | Modo demo sin Supabase. Por defecto `false`. |
| `VITE_MAPBOX_TOKEN`           | `pk.eyJ1Ijoi...` | Mapas (alternativa a Leaflet/OSM)            |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...`    | Pagos con Stripe en el frontend              |

### ❌ NO en Vercel

- `DATABASE_URL` / `DIRECT_URL` → el frontend no habla con Postgres directamente
- `SUPABASE_SERVICE_ROLE_KEY` → **NUNCA** exponer al frontend (bypassa RLS)
- `SUPABASE_JWT_SECRET` → solo el backend lo usa para verificar firmas
- `JWT_SECRET` propio → solo el backend lo usa
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` → el frontend no llama a Vertex AI directamente
- Cualquier `STRIPE_SECRET_KEY` → solo el backend
- `FRONTEND_URL` → esta la usa Render para CORS, no Vercel

---

## 3️⃣ BACKEND (Render) — Variables de Entorno

Configurar en: [render.com/dashboard](https://dashboard.render.com) → servicio → Environment

### 🔴 Críticas (sin estas, el backend no arranca)

| Variable                              | Origen                               | Notas                                        |
| ------------------------------------- | ------------------------------------ | -------------------------------------------- |
| `FRONTEND_URL`                        | Tu URL de Vercel                     | Para CORS. Soporta lista separada por comas. |
| `DATABASE_URL`                        | Supabase → Connection Pooling (6543) | Con `?pgbouncer=true`                        |
| `DIRECT_URL`                          | Supabase → Direct Connection (5432)  | Para migraciones Prisma                      |
| `SUPABASE_URL`                        | = `VITE_SUPABASE_URL`                | Para el cliente admin de Supabase            |
| `SUPABASE_SERVICE_ROLE_KEY`           | Supabase → API → service_role        | Bypass de RLS — **CRÍTICO**                  |
| `SUPABASE_JWT_SECRET`                 | Supabase → API → JWT Secret          | Para validar tokens en `SupabaseAuthGuard`   |
| `JWT_SECRET`                          | Generar aleatorio (≥32 chars)        | Para tokens propios (si los usas)            |
| `CRON_SECRET`                         | Generar aleatorio (≥32 chars)        | Protege endpoints internos de cron           |
| `GOOGLE_CLOUD_PROJECT`                | Google Cloud Console                 | ID del proyecto GCP                          |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service Account JSON inline          | **NO** el path a archivo                     |

### 🟡 Vertex AI (configuración del modelo)

| Variable                          | Default            | Descripción                              |
| --------------------------------- | ------------------ | ---------------------------------------- |
| `VERTEX_AI_LOCATION`              | `us-central1`      | Región de Vertex AI                      |
| `VERTEX_AI_MODEL_ID`              | `gemini-2.5-flash` | Modelo LLM                               |
| `VERTEX_AI_MAX_TOKENS`            | `1024`             | Tokens máx por respuesta                 |
| `VERTEX_AI_TEMPERATURE`           | `0.7`              | Creatividad (0=determinista, 1=creativo) |
| `VERTEX_AI_MAX_RETRIES`           | `3`                | Reintentos ante fallo                    |
| `VERTEX_AI_TIMEOUT_MS`            | `30000`            | Timeout por request                      |
| `VERTEX_AI_RATE_LIMIT_PER_MINUTE` | `20`               | Rate limit por userId                    |

### 🟢 Opcionales (features adicionales)

| Variable             | Uso                                       |
| -------------------- | ----------------------------------------- |
| `STRIPE_SECRET_KEY`  | Pasarela de pagos                         |
| `RENIEC_API_KEY`     | Validación DNI Perú                       |
| `VERIFICAPE_API_KEY` | Verificación de identidad                 |
| `ENABLE_SWAGGER`     | `true` para activar `/docs` en producción |
| `NODE_ENV`           | `production` (Render lo pone por defecto) |
| `PORT`               | Render lo inyecta automáticamente         |

### ❌ NO en Render

- `VITE_*` (cualquiera) — Vite no aplica en backend
- `FRONTEND_URL` apuntando a sí mismo — sería un loop de CORS
- Credenciales de frontend (anon key está bien, pero la service_role NUNCA en Vercel)

---

## 🔐 Cómo generar los secrets

### `JWT_SECRET` (backend)

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copia el output y pégalo en Render.

### `GOOGLE_APPLICATION_CREDENTIALS_JSON` (Vertex AI)

1. Ve a [Google Cloud Console](https://console.cloud.google.com) → IAM & Admin → Service Accounts
2. Crea una service account con rol **Vertex AI User**
3. Crea una **JSON key** y descarga el archivo
4. Abre el archivo y copia **todo el JSON en una línea** (sin saltos)
5. Pégalo en Render como valor de la variable

```bash
# Convertir el JSON a una línea (Linux/Mac)
cat service-account.json | jq -c . > service-account-oneline.json
```

### `SUPABASE_SERVICE_ROLE_KEY`

1. Supabase Dashboard → Settings → API
2. Sección "Project API keys" → copia `service_role` (secret)
3. ⚠️ Esta key bypasea RLS — si se filtra, cualquiera puede leer/escribir tu DB

---

## 📋 Checklist de configuración

### En Supabase

- [ ] Copiar **Project URL** → para `VITE_SUPABASE_URL` y `SUPABASE_URL`
- [ ] Copiar **anon public key** → para `VITE_SUPABASE_ANON_KEY` y `SUPABASE_ANON_KEY`
- [ ] Copiar **service_role** (secret) → para `SUPABASE_SERVICE_ROLE_KEY` (solo Render)
- [ ] Copiar **JWT Secret** → para `SUPABASE_JWT_SECRET` (solo Render)
- [ ] Copiar **Connection Pooling string** (puerto 6543) → para `DATABASE_URL`
- [ ] Copiar **Direct Connection string** (puerto 5432) → para `DIRECT_URL`
- [ ] Configurar **Site URL** = URL de Vercel
- [ ] Configurar **Redirect URLs** en Authentication
- [ ] Habilitar **realtime** en tablas necesarias

### En Vercel

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_API_URL` (URL del backend en Render, NO del frontend)
- [ ] (Opcional) `VITE_USE_MOCKS=false`
- [ ] (Opcional) `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] (Opcional) `VITE_MAPBOX_TOKEN`

### En Render (backend)

- [ ] `FRONTEND_URL` (URL de Vercel)
- [ ] `DATABASE_URL` (Supabase pooler 6543)
- [ ] `DIRECT_URL` (Supabase directo 5432)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_JWT_SECRET`
- [ ] `JWT_SECRET` (generar uno nuevo)
- [ ] `CRON_SECRET` (generar uno nuevo)
- [ ] `GOOGLE_CLOUD_PROJECT`
- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` (todo en una línea)
- [ ] `VERTEX_AI_LOCATION=us-central1`
- [ ] `VERTEX_AI_MODEL_ID=gemini-2.5-flash`
- [ ] `VERTEX_AI_MAX_TOKENS=1024`
- [ ] `VERTEX_AI_TEMPERATURE=0.7`
- [ ] `VERTEX_AI_MAX_RETRIES=3`
- [ ] `VERTEX_AI_TIMEOUT_MS=30000`
- [ ] `VERTEX_AI_RATE_LIMIT_PER_MINUTE=20`
- [ ] (Opcional) `STRIPE_SECRET_KEY`
- [ ] (Opcional) `RENIEC_API_KEY`
- [ ] (Opcional) `VERIFICAPE_API_KEY`
- [ ] `NODE_ENV=production`

---

## 🚨 Errores comunes

| Error en logs                                         | Falta / está mal                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `El modelo de IA no está disponible`                  | `GOOGLE_APPLICATION_CREDENTIALS_JSON` mal copiado (saltos de línea)       |
| `Sesión expirada. Por favor, inicia sesión de nuevo.` | `SUPABASE_JWT_SECRET` incorrecto o `SUPABASE_URL` mal                     |
| `CORS policy: Origin not allowed`                     | `FRONTEND_URL` no coincide exactamente con el dominio de Vercel           |
| `No se pudo contactar al asistente`                   | `VITE_API_URL` apunta al frontend de Vercel en vez del backend            |
| `Can't reach database`                                | `DATABASE_URL` o `DIRECT_URL` mal formadas, o Supabase pausado            |
| Render no arranca                                     | Falta `SUPABASE_SERVICE_ROLE_KEY` o `GOOGLE_APPLICATION_CREDENTIALS_JSON` |

---

## 🔍 Verificación rápida post-deploy

```bash
# Frontend sirve correctamente
curl -I https://sportmatch-connect-juan-alonso.vercel.app
# → HTTP/2 200

# Backend health check
curl https://sportmatch-api.onrender.com/api/v1/health
# → {"status":"ok","service":"sportmatch-api"}

# AI responde con Vertex AI (no hardcode)
curl -X POST https://sportmatch-api.onrender.com/api/v1/ai/chat \
  -H "Authorization: Bearer <token-jwt-de-supabase>" \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Qué deporte me recomiendas para empezar?"}'
# → {"reply":"...respuesta natural del LLM...","metadata":{"model":"gemini-2.5-flash"}}
```

Si la respuesta tiene `"model":"gemini-2.5-flash"` y `"latencyMs"` mayor a 500ms, **es la IA real, no un mock**.

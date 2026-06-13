# 🚀 Plan de Despliegue en Vercel — SportMatch Connect

## 📋 Resumen

SportMatch Connect requiere un despliegue en **dos partes** en Vercel:

1. **Frontend** (SPA estática) — directorio raíz `/`
2. **Backend** (NestJS API) — directorio `/server`

Vercel permite gestionar ambos con un solo repositorio mediante `vercel.json` que enruta por path.

---

## ⚠️ Error Común que YA RESOLVÍ

Si ves este error en el deploy:

```
Environment Variable "FRONTEND_URL" references Secret "production_url", which does not exist.
```

**Causa:** El `@` prefijo en `vercel.json` (`@production_url`) le dice a Vercel que la variable referencia un **Secret** que debe existir en el dashboard. Esto ya fue corregido — ahora las variables se setean directamente en el dashboard sin necesidad de secrets.

---

## 🏗️ Arquitectura de Despliegue

```
                       ┌─────────────────────┐
                       │   VERCEL EDGE       │
                       │   (CDN Global)      │
                       └──────────┬──────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │                               │
        ┌─────────▼─────────┐         ┌───────────▼──────────┐
        │  /  →  Frontend   │         │  /api/v1/*  → API   │
        │  (Vite SPA)       │         │  (NestJS Serverless) │
        │  dist/ estática   │         │  server/src/main.ts │
        └───────────────────┘         └──────────┬──────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                      ┌───────▼───────┐   ┌────────▼────────┐   ┌───────▼───────┐
                      │   Supabase    │   │   Vertex AI     │   │  Google Cloud │
                      │   (Postgres)  │   │  (GenAI SDK)    │   │  Auth (SA)    │
                      └───────────────┘   └─────────────────┘   └───────────────┘
```

---

## ⚙️ Configuración Paso a Paso (EN ORDEN)

### PASO 1: Crear el proyecto en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Selecciona el repositorio `jojiz29/sportmatch-connect`
3. En la sección "Environment Variables", **añade las variables listadas abajo** (PASO 2) ANTES de hacer deploy
4. Click "Deploy" — el primer deploy fallará, pero luego podrás reintentarlo con las variables

### PASO 2: Variables de Entorno en Vercel Dashboard

Ve a: **Vercel → Tu Proyecto → Settings → Environment Variables**

Añade las siguientes variables (clic en "Add Another" para cada una):

#### 🔐 Variables CRÍTICAS (Encrypt: ON) — Sensitive

| Variable                              | Valor                                                                                 | Environments        |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------- |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Contenido completo del JSON de Service Account en **una línea** (sin saltos de línea) | Production, Preview |
| `SUPABASE_JWT_SECRET`                 | Tu JWT secret de Supabase (Dashboard → Settings → API → JWT Secret)                   | Production, Preview |
| `DATABASE_URL`                        | Tu connection string de Supabase Postgres                                             | Production, Preview |
| `JWT_SECRET`                          | Genera uno: `openssl rand -base64 32`                                                 | Production, Preview |

#### 🔓 Variables Públicas (Encrypt: OFF) — No Sensitive

| Variable                          | Valor                                                      | Environments        |
| --------------------------------- | ---------------------------------------------------------- | ------------------- |
| `VITE_SUPABASE_URL`               | `https://gzyoxfhzuxknqacplapi.supabase.co`                 | Production, Preview |
| `VITE_SUPABASE_ANON_KEY`          | Tu anon key de Supabase (empieza con `sb_publishable_...`) | Production, Preview |
| `VITE_API_URL`                    | `https://sportmatch-connect-juan-alonso.vercel.app`        | Production, Preview |
| `FRONTEND_URL`                    | `https://sportmatch-connect-juan-alonso.vercel.app`        | Production, Preview |
| `GOOGLE_CLOUD_PROJECT`            | `sportmach-core`                                           | Production, Preview |
| `VERTEX_AI_LOCATION`              | `us-central1`                                              | Production, Preview |
| `VERTEX_AI_MODEL_ID`              | `gemini-2.5-flash`                                         | Production, Preview |
| `VERTEX_AI_MAX_TOKENS`            | `1024`                                                     | Production, Preview |
| `VERTEX_AI_TEMPERATURE`           | `0.7`                                                      | Production, Preview |
| `VERTEX_AI_MAX_RETRIES`           | `3`                                                        | Production, Preview |
| `VERTEX_AI_TIMEOUT_MS`            | `30000`                                                    | Production, Preview |
| `VERTEX_AI_RATE_LIMIT_PER_MINUTE` | `20`                                                       | Production, Preview |
| `PORT`                            | `3000`                                                     | Production, Preview |
| `NODE_ENV`                        | `production`                                               | Production, Preview |

### PASO 3: Convertir el JSON de Service Account a una sola línea

⚠️ **Crítico:** El JSON de credenciales NO se sube como archivo. Vercel serverless no tiene sistema de archivos persistente.

```bash
# En PowerShell:
$json = Get-Content "server/credentials/google-cloud-credentials.json" -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
Write-Host $json
```

Copia el output (sin saltos de línea) y pégalo en el campo "Value" de la variable `GOOGLE_APPLICATION_CREDENTIALS_JSON` en Vercel.

El resultado será algo como:

```json
{
  "type": "service_account",
  "project_id": "sportmach-core",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "sportmatch-core@sportmach-core.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/sportmatch-core%40sportmach-core.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

> 🔐 **IMPORTANTE:** Marca "Sensitive" para que Vercel encripte el valor.

### PASO 4: Configurar el proyecto

Una vez que todas las variables estén configuradas:

1. Ve a **Settings → General → Build & Development Settings**
2. **Build Command:** `npm run build` (ya está en `vercel.json`)
3. **Install Command:** `npm install --legacy-peer-deps` (ya está en `vercel.json`)
4. **Output Directory:** `dist` (se infiere de `builds[0].config.distDir`)

### PASO 5: Re-deploy

Después de configurar todas las variables:

1. Ve a **Deployments** tab
2. Click en los 3 puntos del último deploy fallido → "Redeploy"
3. ✅ Marca "Use existing Build Cache" para ahorrar tiempo
4. Click "Redeploy"

---

## 🔍 Verificación Post-Deploy

### 1. Health Check

```bash
curl https://sportmatch-connect-juan-alonso.vercel.app/api/v1/health
```

Debe retornar: `{"status":"ok",...}`

### 2. Swagger (si está habilitado)

```
https://sportmatch-connect-juan-alonso.vercel.app/docs
```

### 3. AI Chat con Token Real

```bash
# Primero obtén un token de Supabase
curl -X POST https://gzyoxfhzuxknqacplapi.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: sb_publishable_RWQAc4K1J0zI3RZKRDXHYw_QRIF30D9" \
  -d '{"email":"tu@email.com","password":"tu_password"}'

# Luego usa el token para chatear con la IA
curl -X POST https://sportmatch-connect-juan-alonso.vercel.app/api/v1/ai/chat \
  -H "Authorization: Bearer <TOKEN_AQUI>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola Sporty, ¿qué deportes recomiendas?"}'
```

---

## 🐛 Troubleshooting

| Error                                            | Causa                                              | Solución                                                                                             |
| ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Environment Variable "X" references Secret "X"` | Usaste `@` prefix en `vercel.json`                 | ❌ NO uses `@` prefix. Configura las vars en el dashboard                                            |
| `Cannot find credentials file`                   | Vercel es serverless, no tiene sistema de archivos | Usa `GOOGLE_APPLICATION_CREDENTIALS_JSON` (string) en vez de `GOOGLE_APPLICATION_CREDENTIALS` (ruta) |
| `Module not found: @google/genai`                | El backend no tiene la dependencia                 | Agrégala en `server/package.json` y al `dependencies` del `package.json` raíz                        |
| `CORS policy: Origin not allowed`                | El dominio de Vercel no está en la lista           | Agrega `https://sportmatch-connect-juan-alonso.vercel.app` a `FRONTEND_URL`                          |
| `FUNCTION_INVOCATION_TIMEOUT`                    | Vertex AI puede tardar 10-15s                      | Actualiza a Vercel Pro (60s timeout) o implementa streaming                                          |

---

## 📊 Límites de Vercel

| Recurso                 | Plan Hobby | Plan Pro |
| ----------------------- | ---------- | -------- |
| Function execution time | 10s        | 60s      |
| Function size           | 50 MB      | 50 MB    |
| Bandwidth               | 100 GB/mes | 1 TB/mes |
| Serverless invocations  | 1M/mes     | 1M/mes   |

**Recomendación:** Para el chat de IA, usar **plan Pro** para 60s de timeout.

---

## 📋 Checklist Pre-Deploy

- [ ] Repositorio conectado a Vercel
- [ ] **TODAS** las variables de entorno del PASO 2 configuradas
- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` con el JSON en una sola línea y marcado como "Sensitive"
- [ ] `vercel.json` commiteado (sin `@` prefixes)
- [ ] Build local exitoso: `npm run build`
- [ ] Dev local funciona: `npm run dev` (con `server/.env` configurado)
- [ ] CORS permite el dominio de Vercel

---

## 🚀 Workflow de Desarrollo

| Entorno                   | Comando                         | URL                                               |
| ------------------------- | ------------------------------- | ------------------------------------------------- |
| Local dev (todo el stack) | `npm run dev`                   | http://localhost:5173                             |
| Solo frontend             | `npm run dev:frontend`          | http://localhost:5173                             |
| Solo backend              | `npm run dev:backend`           | http://localhost:3000                             |
| Test E2E del chat         | `node scripts/test-ai-chat.mjs` | (requiere user real)                              |
| Build de producción       | `npm run build`                 | (genera dist/ para Vercel)                        |
| Deploy a Vercel           | (auto en push a main)           | https://sportmatch-connect-juan-alonso.vercel.app |

---

## 🔄 CI/CD Automático

- **Push a `main`** → Deploy a producción
- **Push a `edwin` u otras ramas** → Deploy a preview
- Cada PR abre un deploy preview único con URL propia

---

## 🆘 Soporte Rápido

- **Vercel Docs**: https://vercel.com/docs
- **Google Gen AI**: https://www.npmjs.com/package/@google/genai
- **Supabase**: https://supabase.com/docs
- **Logs en Vercel**: Project → Deployments → Click en deploy → "Functions" tab → Ver logs de cada lambda

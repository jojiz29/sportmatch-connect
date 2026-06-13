# 🚀 Plan de Despliegue — SportMatch Connect

## 🏗️ Arquitectura Recomendada (Monorepo Multi-Plataforma)

```
┌─────────────────────────────┐         ┌──────────────────────────────────┐
│   VERCEL                     │         │   RENDER / RAILWAY / FLY.IO      │
│   (Frontend estático)        │   ───►  │   (Backend NestJS + Prisma)     │
│   https://sportmatch...      │   API   │   https://api-sportmatch...     │
└─────────────────────────────┘         └──────────────────────────────────┘
         │                                        │
         └─────────► Hace fetch a /api/* ◄───────┘
```

**¿Por qué este split?**
- ✅ Vercel: excelente para SPAs estáticas, CDN global, deploys instantáneos
- ✅ Render: ideal para NestJS + Prisma (long-running, conexión persistente a DB)
- ✅ Serverless de Vercel **no es ideal** para:
  - Apps con binarios nativos (Prisma engine ~50MB)
  - Conexiones persistentes a PostgreSQL
  - Cold starts de 5-10s con todo el bundle de NestJS + Google SDK
- ✅ Render es **gratis para hobby** y soporta el stack completo

---

## 🚀 Deploy del Frontend en Vercel

### Paso 1: Importar el Proyecto
1. Ve a [vercel.com/new](https://vercel.com/new)
2. Conecta el repo `jojiz29/sportmatch-connect`
3. Configura el proyecto (deja los defaults; `vercel.json` se detecta automáticamente)

### Paso 2: Variables de Entorno del Frontend

Solo necesitas las variables que el **frontend** usa (con prefijo `VITE_`):

| Variable | Valor | Environments |
|----------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://gzyoxfhzuxknqacplapi.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Tu anon key pública (empieza con `sb_publishable_...`) | Production, Preview |
| `VITE_API_URL` | URL del backend desplegado (ej: `https://sportmatch-api.onrender.com`) | Production, Preview |
| `VITE_USE_MOCKS` | `false` | Production, Preview |

**NO necesitas las variables del backend** (`DATABASE_URL`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, etc.) — esas van en Render.

### Paso 3: Deploy
Click "Deploy". Vercel:
1. Ejecuta `npm install --legacy-peer-deps`
2. Ejecuta `npm run build` (genera `dist/`)
3. Sirve `dist/` como sitio estático con SPA routing
4. Resultado: `https://sportmatch-connect-juan-alonso.vercel.app`

---

## 🖥️ Deploy del Backend en Render (o Railway/Fly.io)

El `render.yaml` ya está configurado en el repo. Para activarlo:

### Opción A: Render Blueprint
1. Ve a [render.com/blueprints](https://render.com/blueprints)
2. Click "New Blueprint Instance"
3. Conecta el repo `jojiz29/sportmatch-connect`
4. Render detecta el `render.yaml` y crea el servicio automáticamente
5. Configura las **environment variables** en el dashboard de Render

### Variables de Entorno del Backend (en Render)

#### 🔐 Sensitive
| Variable | Valor |
|----------|-------|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | JSON completo del Service Account en una línea |
| `SUPABASE_JWT_SECRET` | Tu JWT secret de Supabase |
| `DATABASE_URL` | Connection string de Supabase Postgres |
| `DIRECT_URL` | Misma connection string (para migraciones Prisma) |
| `JWT_SECRET` | Clave aleatoria de 32+ caracteres |

#### 🔓 No Sensitive
| Variable | Valor |
|----------|-------|
| `FRONTEND_URL` | `https://sportmatch-connect-juan-alonso.vercel.app` |
| `PORT` | `3000` (Render lo inyecta automáticamente) |
| `GOOGLE_CLOUD_PROJECT` | `sportmach-core` |
| `VERTEX_AI_LOCATION` | `us-central1` |
| `VERTEX_AI_MODEL_ID` | `gemini-2.5-flash` |
| `VERTEX_AI_MAX_TOKENS` | `1024` |
| `VERTEX_AI_TEMPERATURE` | `0.7` |
| `VERTEX_AI_MAX_RETRIES` | `3` |
| `VERTEX_AI_TIMEOUT_MS` | `30000` |
| `VERTEX_AI_RATE_LIMIT_PER_MINUTE` | `20` |

### Variables Opcionales (B2B/Stripe)
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `RENIEC_API_KEY`
- `VERIFICAPE_API_KEY`
- `VITE_MAPBOX_TOKEN`

---

## 🔄 CORS y Conexión Frontend ↔ Backend

El backend en Render debe aceptar requests del frontend en Vercel. Ya está configurado en `server/src/main.ts` con `FRONTEND_URL` que se lee del entorno:

```typescript
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",").map(u => u.trim()).filter(Boolean);
```

**Importante:** En Render, configura `FRONTEND_URL=https://sportmatch-connect-juan-alonso.vercel.app` (sin comas adicionales, solo el dominio).

---

## 🧪 Verificación Post-Deploy

### 1. Health Check del Backend
```bash
curl https://sportmatch-api.onrender.com/api/v1/health
# → {"status":"ok","service":"sportmatch-api"}
```

### 2. Frontend Cargado
```bash
curl -I https://sportmatch-connect-juan-alonso.vercel.app
# → HTTP/2 200
```

### 3. AI Chat con Token Real
```bash
# Login
curl -X POST https://gzyoxfhzuxknqacplapi.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" -H "apikey: sb_publishable_..." \
  -d '{"email":"tu@email.com","password":"tu_pass"}'

# Chat
curl -X POST https://sportmatch-api.onrender.com/api/v1/ai/chat \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"message":"Hola Sporty"}'
```

---

## 🐛 Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| CORS error en consola del navegador | `FRONTEND_URL` no está en Render o no coincide | Verifica que el dominio de Vercel esté EXACTAMENTE en Render |
| "El modelo de IA no está disponible" | `GOOGLE_APPLICATION_CREDENTIALS_JSON` mal copiado | Usa el JSON en una sola línea (sin saltos) |
| Login falla en Vercel | `VITE_SUPABASE_ANON_KEY` incorrecta | Re-copia la key desde Supabase Dashboard → API |
| 401 en `/api/v1/ai/chat` | Token expirado o SupabaseAuthGuard no configurado | Verifica que el token se envía con prefijo `Bearer ` |
| Render free tier se duerme | Plan gratuito duerme tras 15 min sin tráfico | Upgrade a Plan Pro o usa Railway/Fly.io |

---

## 📊 Workflow de Desarrollo

| Acción | Comando |
|--------|---------|
| Iniciar todo el stack local | `npm run dev` |
| Solo frontend | `npm run dev:frontend` |
| Solo backend | `npm run dev:backend` |
| Build de producción | `npm run build` |
| Test E2E del chat | `node scripts/test-ai-chat.mjs` |

---

## 🆘 Soporte Rápido

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Google Gen AI**: https://www.npmjs.com/package/@google/genai
- **Supabase**: https://supabase.com/docs

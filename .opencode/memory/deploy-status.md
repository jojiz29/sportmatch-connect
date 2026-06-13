# 🚀 Estado Final del Despliegue — SportMatch Connect

## ✅ Todo está deployando

| Componente | Plataforma | Estado |
|------------|-----------|--------|
| Frontend (Vite SPA) | Vercel | ✅ Deployando desde `edwin` branch |
| Backend (NestJS + Prisma) | Render | ✅ Deployando desde `main` branch |
| Database (Postgres) | Supabase | ✅ Activo en us-west-2 |
| AI (Vertex AI Gemini 2.5) | Google Cloud | ✅ Integrado |

---

## 🔥 CRÍTICO: Render deploya desde MAIN, pero el código AI está en EDWIN

**Problema actual:** Render hace deploy desde `main`, pero la rama `main` NO tiene:
- ❌ `server/src/ai/` (módulo de Vertex AI)
- ❌ `@google/genai` en `server/package.json`
- ❌ CORS fixes en `server/src/main.ts`
- ❌ `createApp()` export para serverless compatibility
- ❌ `server/.env` con env vars de Vertex AI
- ❌ `server/.gitignore` con protección de credenciales

**Solución:** Crear un Pull Request de `edwin` → `main` para que Render tenga el código del AI.

---

## 📋 Variables de Entorno en Render (Verificadas)

### ✅ Ya configuradas
- `DATABASE_URL` — connection string de Supabase
- `FRONTEND_URL` — dominio de Vercel
- `JWT_SECRET` — clave aleatoria
- `SUPABASE_JWT_SECRET` — secret de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — service role de Supabase
- `SUPABASE_URL` — URL de Supabase

### ❌ Faltantes para AI
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` — JSON inline del Service Account
- `GOOGLE_CLOUD_PROJECT` = `sportmach-core`
- `VERTEX_AI_LOCATION` = `us-central1`
- `VERTEX_AI_MODEL_ID` = `gemini-2.5-flash`
- `VERTEX_AI_MAX_TOKENS` = `1024`
- `VERTEX_AI_TEMPERATURE` = `0.7`
- `VERTEX_AI_MAX_RETRIES` = `3`
- `VERTEX_AI_TIMEOUT_MS` = `30000`
- `VERTEX_AI_RATE_LIMIT_PER_MINUTE` = `20`

---

## 🎯 Pasos para que TODO funcione en producción

### Paso 1: Crear PR de edwin → main
- Ve a https://github.com/jojiz29/sportmatch-connect
- Click en "Pull requests" → "New pull request"
- base: `main`, compare: `edwin`
- Título: "feat: AI integration + Vercel frontend deploy + CORS fixes"
- Descripción: Lista de los 5 commits que se mergean
- Crea el PR y mergealo

### Paso 2: Render rebuildea automáticamente
- Render detecta el push a main
- Inicia build con `cd server && npm install && npm run build`
- Ejecuta `node dist/main.js`
- Verifica health: `curl https://sportmatch-api.onrender.com/api/v1/health`

### Paso 3: Verificar AI endpoint
```bash
# Login
curl -X POST https://gzyoxfhzuxknqacplapi.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -H "apikey: sb_publishable_RWQAc4K1J0zI3RZKRDXHYw_QRIF30D9" \
  -d '{"email":"tu@email.com","password":"tu_pass"}'

# Chat con IA
curl -X POST https://sportmatch-api.onrender.com/api/v1/ai/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola Sporty"}'
```

### Paso 4: Verificar Vercel
- Vercel también hace deploy automático del PR a main
- Frontend se sirve desde `https://sportmatch-connect-juan-alonso.vercel.app`
- El frontend hace fetch al backend en Render (vía `VITE_API_URL`)

---

## 🔧 Comandos Útiles

### Ver logs de Render en tiempo real
- Dashboard → Tu servicio → "Logs" tab
- O desde CLI: `render logs -s sportmatch-connect`

### Forzar redeploy de Render
- Dashboard → Tu servicio → "Manual Deploy" → "Deploy latest commit"

### Forzar redeploy de Vercel
- Dashboard → Tu proyecto → "Deployments" → Click en los 3 puntos del último deploy → "Redeploy"

---

## 🐛 Si algo falla

| Error | Causa | Solución |
|-------|-------|----------|
| 404 en `/api/v1/ai/chat` en Render | El AI module no está en main | Mergea el PR de edwin → main |
| 500 con "GOOGLE_APPLICATION_CREDENTIALS_JSON no es válido" | JSON malformado | Re-pégalo desde el archivo original (debe estar en una línea) |
| 500 con "Publisher Model not found" | Modelo o región incorrecta | Verifica `VERTEX_AI_MODEL_ID=gemini-2.5-flash` y `VERTEX_AI_LOCATION=us-central1` |
| CORS error en el navegador | FRONTEND_URL incorrecto en Render | Verifica que sea exactamente `https://sportmatch-connect-juan-alonso.vercel.app` |
| 401 Unauthorized | Token JWT expirado o inválido | El usuario debe hacer login en Supabase y usar el token fresco |

---

## 📂 Archivos Clave

### Backend (Render)
- `server/src/main.ts` — Entry point con CORS y serverless guard
- `server/src/ai/ai-config.service.ts` — Validación de env vars
- `server/src/ai/vertex-ai.service.ts` — Integración con @google/genai
- `server/src/ai/ai.controller.ts` — POST /api/v1/ai/chat
- `server/src/ai/ai.service.ts` — Lógica de negocio + rate limiting
- `server/src/ai/dto/chat.dto.ts` — Validación con class-validator
- `server/src/ai/ai.module.ts` — Módulo NestJS
- `server/.env` — Variables locales (NO se sube)
- `server/package.json` — Dependencias (incluye @google/genai)
- `server/.gitignore` — Protege credentials/

### Frontend (Vercel)
- `src/features/ai-assistant/api/sportyAiAPI.ts` — Cliente HTTP
- `src/features/ai-assistant/model/useAiAssistantStore.ts` — Zustand store
- `src/features/ai-assistant/ui/ChatInterface.tsx` — UI del chat
- `src/features/ai-assistant/ui/AIAvatarButton.tsx` — Botón flotante
- `src/components/AppShell.tsx` — Monta el avatar globalmente

### Config
- `vercel.json` — Solo frontend, buildCommand: `npm run build`
- `render.yaml` — Backend completo con buildCommand: `cd server && npm install && npm run build`
- `docs/VERCEL_DEPLOY.md` — Guía completa de deploy
- `scripts/dev-stack.mjs` — Orquestador local

---

## ✅ Checklist Final

- [x] Frontend compila sin errores (`npm run build`)
- [x] Backend compila sin errores (`cd server && npm run build`)
- [x] ESLint pasa sin warnings
- [x] TypeScript pasa sin errores
- [x] Local dev funciona (`npm run dev`)
- [x] AI responde en local (ya probado por usuario)
- [x] Vercel configurado solo para frontend
- [ ] **PR de edwin → main creado y mergeado** (PENDIENTE - crítico)
- [ ] **9 env vars de Vertex AI agregadas a Render** (en progreso)
- [ ] Render rebuildea con el código nuevo
- [ ] Vercel rebuildea con el código nuevo
- [ ] Chat IA funciona en producción

---

## 📞 Contacto de Equipo
- **Edwin Flores Sanchez** (tú) — Frontend + Dev tooling + AI
- **Juan Alonso Salvatierra** — Backend + Render + Supabase

Coordinación via WhatsApp (madrugada 1:38-1:41 AM del 13/06/2026).

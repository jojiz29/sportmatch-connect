# 🚀 Plan de Despliegue en Vercel — SportMatch Connect

## 📋 Resumen

SportMatch Connect requiere un despliegue en **dos partes** en Vercel:

1. **Frontend** (SPA estática) — directorio raíz `/`
2. **Backend** (NestJS API) — directorio `/server`

Vercel permite gestionar ambos con un solo repositorio mediante un `vercel.json` que enruta por path.

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
        │  (Vite SPA)       │         │  (NestJS Lambda)    │
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

## ⚙️ Configuración Paso a Paso

### 1. Preparar el Repositorio

El repositorio ya tiene la configuración lista:

- `vercel.json` en la raíz con rewrites por path
- `server/` con el código NestJS
- Variables de entorno documentadas en `server/.env`

### 2. Variables de Entorno en Vercel Dashboard

Configura las siguientes variables en **Vercel → Project Settings → Environment Variables**:

#### 🔐 Secrets Críticos (Encrypt: ON)

| Variable                              | Descripción                                                                                             | Ejemplo                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Contenido completo del JSON de Service Account (NO la ruta al archivo, sino el JSON inline como string) | `{"type":"service_account","project_id":"sportmach-core",...}` |
| `SUPABASE_JWT_SECRET`                 | JWT secret de Supabase                                                                                  | (de Supabase Dashboard)                                        |
| `JWT_SECRET`                          | Secret para tokens propios de la API                                                                    | (generar uno aleatorio)                                        |

#### 🔓 Variables Públicas (Encrypt: OFF)

| Variable                 | Descripción                             | Ejemplo                                             |
| ------------------------ | --------------------------------------- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL pública de Supabase                 | `https://gzyoxfhzuxknqacplapi.supabase.co`          |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública de Supabase            | `sb_publishable_...`                                |
| `VITE_API_URL`           | URL de la API en Vercel (mismo dominio) | `https://sportmatch-connect-juan-alonso.vercel.app` |
| `FRONTEND_URL`           | URL del frontend (para CORS)            | `https://sportmatch-connect-juan-alonso.vercel.app` |
| `GOOGLE_CLOUD_PROJECT`   | ID del proyecto GCP                     | `sportmach-core`                                    |
| `VERTEX_AI_LOCATION`     | Región de Vertex AI                     | `us-west1`                                          |
| `VERTEX_AI_MODEL_ID`     | Modelo Gemini                           | `gemini-1.5-pro-002`                                |
| `VERTEX_AI_MAX_TOKENS`   | Límite de tokens                        | `1024`                                              |
| `VERTEX_AI_TEMPERATURE`  | Temperatura del modelo                  | `0.7`                                               |

> ⚠️ **Crítico para Vertex AI:** Vercel NO tiene sistema de archivos persistente en serverless, por lo que **NO puedes usar `GOOGLE_APPLICATION_CREDENTIALS` como ruta a un archivo**. En su lugar, el código de producción debe leer el JSON desde la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS_JSON` (string).

### 3. Refactor Necesario para Producción Serverless

El `AiConfigService` actual busca el archivo en disco. Para Vercel serverless, hay que agregar fallback para leer desde variable de entorno.

---

## 🔧 Refactor Recomendado: `ai-config.service.ts`

```typescript
// En AiConfigService.onModuleInit():
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

// Caso 1: Producción serverless (Vercel) — el JSON viene como string
if (credentialsJson) {
  // El SDK de @google/genai acepta credenciales como objeto JSON directamente
  this.config = {
    credentialsJson: JSON.parse(credentialsJson),
    // ...
  };
}
// Caso 2: Desarrollo local — el JSON está en el sistema de archivos
else if (credentialsPath) {
  // Validar que existe, leer el archivo, etc.
}
```

Esto requiere actualizar `VertexAiService` para pasar el objeto JSON al SDK:

```typescript
this.genAi = new GoogleGenAI({
  vertexai: true,
  project: this.config.projectId,
  location: this.config.location,
  googleAuthOptions: this.config.credentialsJson
    ? { credentials: this.config.credentialsJson }
    : { keyFile: this.config.credentialsPath },
});
```

---

## 📦 Despliegue de un Clic

### Opción A: Vercel Dashboard (Recomendado)

1. Conecta el repo `jojiz29/sportmatch-connect` en [vercel.com](https://vercel.com/new)
2. Configura las variables de entorno (tabla arriba)
3. Vercel detecta automáticamente el `vercel.json` y configura los builds
4. Click "Deploy"

### Opción B: CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🔒 Secrets: Service Account de Google Cloud

### Paso Crítico: Convertir JSON a Variable de Entorno

El JSON del Service Account **NO se sube como archivo** a Vercel. Se inyecta como string:

```bash
# 1. Lee el JSON y minifícalo a una línea
cat server/credentials/google-cloud-credentials.json | jq -c . > credentials-min.json

# 2. En Vercel Dashboard:
#    Settings → Environment Variables → Add
#    Key:   GOOGLE_APPLICATION_CREDENTIALS_JSON
#    Value: (pega el contenido de credentials-min.json)
#    Environment: Production, Preview, Development
#    Encrypt: ON
```

⚠️ **NUNCA** commitees el JSON al repositorio. El `.gitignore` ya lo bloquea, pero es buena práctica verificar.

---

## 🧪 Testing Post-Despliegue

### 1. Health Check

```bash
curl https://sportmatch-connect-juan-alonso.vercel.app/api/v1/health
```

Debe retornar `{"status":"ok"}` o similar.

### 2. AI Chat (requiere token de Supabase)

```bash
curl -X POST https://sportmatch-connect-juan-alonso.vercel.app/api/v1/ai/chat \
  -H "Authorization: Bearer <supabase_token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola Sporty, ¿qué deportes me recomiendas?"}'
```

### 3. Swagger

Visita: `https://sportmatch-connect-juan-alonso.vercel.app/docs`

---

## 🐛 Troubleshooting

### Error: "Module not found" en Vercel

- Verifica que `package.json` (raíz) tenga `@google/genai` como dependencia
- Si el backend lo necesita, agrégalo también en `server/package.json`

### Error: "Cannot find credentials file"

- En Vercel serverless no hay archivos. Usa `GOOGLE_APPLICATION_CREDENTIALS_JSON` como string

### Error CORS

- Verifica que `FRONTEND_URL` apunte al dominio correcto de Vercel
- La lógica actual de CORS permite automáticamente el dominio de Vercel si está en `.env`

### Lambda timeout (30s)

- Vertex AI puede tardar 5-15s en responder
- Considera aumentar `maxDuration` en `vercel.json` (requiere plan Pro)

---

## 📊 Límites de Vercel (Plan Hobby)

| Recurso                         | Límite                 |
| ------------------------------- | ---------------------- |
| Function execution time         | 10s (Hobby), 60s (Pro) |
| Function size                   | 50 MB                  |
| Bandwidth                       | 100 GB/mes             |
| Serverless function invocations | 1M/mes                 |

Para el chat de IA, **recomendamos plan Pro** para tener 60s de timeout. Alternativamente, implementar streaming de respuesta con Server-Sent Events (SSE) para que la primera respuesta llegue en <10s.

---

## 🔄 CI/CD Automático

Cada `git push` a `main` o `edwin` dispara un deploy automático en Vercel.

Para deshabilitar previews de PRs no deseados:

```json
// vercel.json
"github": {
  "silent": false,
  "autoAlias": true
}
```

---

## ✅ Checklist Pre-Deploy

- [ ] JSON de credenciales Vertex AI disponible
- [ ] Variables de entorno configuradas en Vercel Dashboard
- [ ] Refactor de `AiConfigService` para soportar `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- [ ] `vercel.json` commiteado en la raíz
- [ ] `npm run dev` funciona localmente
- [ ] Tests E2E pasando (`npm run test:e2e`)
- [ ] Build local exitoso (`npm run build`)

---

## 📞 Soporte

- Vercel Docs: https://vercel.com/docs
- Google Gen AI: https://www.npmjs.com/package/@google/genai
- Supabase: https://supabase.com/docs

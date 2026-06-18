# B2B Intelligence — SportMatch Connect

Documentación técnica del módulo B2B-AI implementado en el sprint de Juan (7 días).
Cubre los 3 endpoints inteligentes que permiten a los negocios tomar decisiones
basadas en datos: **Dynamic Pricing**, **Ads Optimizer** y **Churn Predictor**.

## 📚 Índice de documentos

| Doc                                              | Contenido                                                    |
| ------------------------------------------------ | ------------------------------------------------------------ |
| [README.md](README.md)                           | Este archivo — overview, cómo levantar, troubleshooting      |
| [pricing-model.md](pricing-model.md)             | Feature #9 — Dynamic Pricing: fórmula, supuestos, casos edge |
| [ads-optimizer.md](ads-optimizer.md)             | Feature #21 — Ads Optimizer: UCB1 bandit + LLM rewriter      |
| [churn-predictor.md](churn-predictor.md)         | Feature #23 — Churn Predictor: RFM-lite scoring              |
| [data-pipeline.md](data-pipeline.md)             | Schema `usage_metrics` + queries SQL + índices               |
| [shap-explainability.md](shap-explainability.md) | ⚠️ Disclaimer: NO usamos la librería SHAP oficial            |

## 🎯 Visión general

El módulo B2B-AI ofrece **3 endpoints REST** protegidos con `@Roles("BUSINESS")`:

```
POST /api/v1/ai/b2b/pricing       → Feature #9
POST /api/v1/ai/b2b/ads/optimize  → Feature #21
POST /api/v1/ai/b2b/churn/predict → Feature #23
```

Todos comparten:

- **Arquitectura híbrida**: stats en TS + Vertex AI genera la narrativa.
- **Rate limit**: 60 req/min por usuario (bucket unificado `"b2b"`).
- **Response shape uniforme**: `{drivers: ShapFeature[], narrative: string, metadata: AiMetadata}`.
- **Fallback gracioso**: si Vertex AI falla, se devuelve un esqueleto narrativo determinista.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (FSD) — src/features/b2b-ai/                          │
│  ├─ api/b2bAiApi.ts          → HTTP client con auth + 429      │
│  ├─ model/useB2bAiStore.ts   → Zustand + demo mode fallback   │
│  └─ ui/                      → 3 paneles + SHAP waterfall      │
└────────────────────────────┬────────────────────────────────────┘
                             │ Bearer (Supabase JWT)
┌────────────────────────────▼────────────────────────────────────┐
│  BACKEND (NestJS) — server/src/ai/b2b/                         │
│  ├─ b2b-ai.controller.ts  (3 endpoints)                        │
│  ├─ b2b-ai.service.ts     (rate limit + orchestration)         │
│  └─ services/                                                   │
│       ├─ data-pipeline.service.ts  (agregaciones SQL)         │
│       ├─ pricing-engine.service.ts  (heurística)              │
│       ├─ ads-optimizer.service.ts   (UCB1 + LLM)              │
│       ├─ churn-predictor.service.ts (RFM-lite)               │
│       └─ shap-explainer.service.ts  (contribuciones)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
   bookings              business_ads       usage_metrics
   (existe)              (existe)           (migración 20260616)
```

## 🚀 Cómo levantar local

### 1. Backend

```bash
cd server
npm install
# Variables de entorno: GOOGLE_CLOUD_PROJECT, VERTEX_AI_LOCATION,
# VERTEX_AI_MODEL_ID, GOOGLE_APPLICATION_CREDENTIALS (o _JSON)
npm run start:dev
```

Verificar que arranca en `http://localhost:3000` y que el módulo B2bAiModule se
registra sin errores (busca en logs: `B2bAiController {/api/v1/ai/b2b/pricing,...}`).

### 2. Frontend

```bash
# Raíz del proyecto
npm install
npx vite
```

Configurar `.env`:

```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Migración SQL

Aplicar la migración `supabase/migrations/20260616_b2b_usage_metrics.sql` en
**Supabase SQL Editor** y ejecutar después:

```sql
NOTIFY pgrst, 'reload schema';
```

(Ver AGENTS.md → "PostgREST Cache" para por qué es necesario.)

## 🧪 Cómo probar cada endpoint

### Con cURL (autenticación Bearer requerida)

```bash
# 1. Obtener token de Supabase (ejemplo con email/password)
TOKEN="eyJhbGc..."  # access_token de supabase.auth.getSession()

# 2. Pricing
curl -X POST http://localhost:3000/api/v1/ai/b2b/pricing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courtId":"court-abc","date":"2026-06-20","hour":19}'

# 3. Ads Optimizer
curl -X POST http://localhost:3000/api/v1/ai/b2b/ads/optimize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adId":"ad-1","goal":"ctr","variantCount":3}'

# 4. Churn Predictor
curl -X POST http://localhost:3000/api/v1/ai/b2b/churn/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"businessId":"biz-1","lookbackDays":30}'
```

### Desde el frontend (modo demo)

1. Login con un usuario BUSINESS (o entrar a `/app/business` en modo demo).
2. Click en el tab **"Inteligencia IA"** en la navegación lateral.
3. El dashboard muestra los 3 paneles con sub-tabs: Churn / Pricing / Ads.
4. Los paneles cargan fixtures automáticamente al montar.

## 🛠️ Troubleshooting

### Error 429 — "demasiadas solicitudes"

Vertex AI tiene un rate limit de 20 req/min por usuario en el modelo
`gemini-2.5-flash`. Si el dashboard refresca los 3 paneles simultáneamente y
cada uno genera una llamada al LLM, podemos agotar el bucket.

**Solución aplicada:** todos los endpoints B2B-AI comparten un único bucket
de 60 req/min (más permisivo que los endpoints AI de jugadores).

**Si sigue fallando:**

- Reducir `temperature` en `b2b-ai.service.ts:120` para hacer caching más
  efectivo en Vertex AI.
- Activar la caché de respuestas en el cliente: si `metadata.latencyMs < 100`,
  reusar la última respuesta.

### Error 403 — "Acceso restringido"

El usuario no tiene `user_metadata.user_role = "BUSINESS"`. Verificar en
Supabase Dashboard → Authentication → Users → user → user_metadata.

```json
{
  "user_role": "BUSINESS",
  ...
}
```

### Error 404 en `/ai/b2b/ads/optimize`

El `adId` no existe en `business_ads` o no pertenece al `userId` autenticado.
Verificar que el anuncio fue creado por el business actual.

### Narrativa vacía o genérica

Si `narrative === "Sin datos suficientes para generar una explicación."`,
significa que:

- El LLM Vertex AI falló (timeout, quota, etc.) Y
- El skeleton fallback tampoco pudo generar nada (todos los drivers están en 0).

**Solución:** verificar que el LLM está configurado correctamente
(`GOOGLE_APPLICATION_CREDENTIALS` o `GOOGLE_APPLICATION_CREDENTIALS_JSON`).

### Migración `usage_metrics` no se aplica

Si la query a `usage_metrics` falla con "relation does not exist", significa
que la migración SQL no se aplicó. Ejecutar:

```sql
-- En Supabase SQL Editor
\i supabase/migrations/20260616_b2b_usage_metrics.sql
NOTIFY pgrst, 'reload schema';
```

El backend maneja este caso graciosamente (devuelve `usageSummary` con todos
los campos en 0), pero los modelos no tendrán engagement data.

## 📊 Métricas de testing

| Suite                                                         | Tests         | Estado |
| ------------------------------------------------------------- | ------------- | ------ |
| `server/src/ai/b2b/__tests__/pricing-engine.service.spec.ts`  | 19            | ✅     |
| `server/src/ai/b2b/__tests__/ads-optimizer.service.spec.ts`   | 13            | ✅     |
| `server/src/ai/b2b/__tests__/churn-predictor.service.spec.ts` | 12            | ✅     |
| `server/src/ai/b2b/__tests__/data-pipeline.service.spec.ts`   | 11            | ✅     |
| `server/src/ai/b2b/__tests__/b2b-ai.controller.spec.ts`       | 4             | ✅     |
| **Total backend**                                             | **59**        | **✅** |
| `src/features/b2b-ai/__tests__/pricingHelpers.test.ts`        | 26            | ✅     |
| `src/features/b2b-ai/__tests__/b2bAiApi.test.ts`              | 8             | ✅     |
| `src/features/b2b-ai/__tests__/useB2bAiStore.test.ts`         | 13            | ✅     |
| **Total frontend**                                            | **47**        | **✅** |
| **TOTAL sprint B2B Intelligence**                             | **106 tests** | **✅** |

## ⚖️ Disclaimer académico

**Los modelos NO usan la librería SHAP oficial de Python.** Las contribuciones
explicativas son calculadas en TypeScript como desviaciones marginales respecto
a un baseline. Ver [shap-explainability.md](shap-explainability.md) para el
detalle matemático y por qué esta decisión.

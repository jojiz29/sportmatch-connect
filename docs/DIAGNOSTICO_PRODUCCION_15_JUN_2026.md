# Diagnóstico de Producción — Chat Colgado (15-jun-2026)

**Reportado por:** Edwin (via opencode)
**Infraestructura inspeccionada:** Render + Vercel (con tokens del operador)

---

## Estado Real de los Servicios

### 🔴 Render: `sportmatch-connect` (srv-d8i2vqjtqb8s73an55eg)

| Campo | Valor | Notas |
|-------|-------|-------|
| **Status** | **SUSPENDED** | El servicio está pausado. No responde a ninguna request. |
| **Service URL real** | `https://sportmatch-connect.onrender.com` | NO `sportmatch-api.onrender.com` |
| **Branch desplegada** | main (deploy 1465964) | OK, último deploy verde |
| **Plan** | free (con cold-start) | |

**Env vars (16 configuradas, todas presentes):**
- `DATABASE_URL`: `postgresql://postgres.gzyoxfhzuxknqacplapi:JuanAlonso2026%@aws-1-us-west-2.pooler.supabase.com:5432/postgres`
  - ⚠️ Puerto `5432` (session mode) SIN `?pgbouncer=true`. AGENTS.md recomienda `6543` con `?pgbouncer=true` para serverless.
- `DIRECT_URL`: IGUAL a `DATABASE_URL`. Ambas en `5432` → redundante. La idea de dual-URL es: URL → pgbouncer, DIRECT_URL → session mode.
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: ✓ presente, JSON válido del Service Account `sportmatch-core`.
- `GOOGLE_CLOUD_PROJECT`: `sportmach-core` ✓
- `VERTEX_AI_LOCATION`: `us-central1` ✓
- `VERTEX_AI_MODEL_ID`: `gemini-2.5-flash` ✓
- `FRONTEND_URL`: `https://sportmatch-connect-juan-alonso.vercel.app,https://sportmatch-connect-git-juan-salvatierralonso1819-3320s-projects.vercel.app,http://localhost:5173`
  - ⚠️ **FALTA** `https://sportmatch-connect.vercel.app` (el dominio que el usuario JUAN usa para acceder al chat). Esto bloquea CORS.

### 🟡 Vercel: 3 proyectos

| Proyecto | ID | productionBranch | Último deploy desde |
|----------|-----|------------------|---------------------|
| `sportmatch-connect-czs5` | prj_Kz1dpeTTAKDoJo5rrF0JNHRnvu1B | **(vacío)** | `experimental/welcome-no-auth` ⚠️ |
| `sportmatch-connect` | prj_xkYkcOWCW33LPADuE4A5S5sBMkRj | **(vacío)** | `experimental/welcome-no-auth` ⚠️ |
| `sportmatch-connect-juan-alonso` | prj_NIumA1tC8u3RIVSXxuWBR5ffCQoz | **(vacío)** | `experimental/welcome-no-auth` ⚠️ |

**🔴 HALLAZGO CRÍTICO:** Los 3 proyectos tienen `productionBranch` **VACÍO**, lo cual significa que Vercel hace auto-deploy de la última rama pusheada. En este momento, los 3 sirven el bundle de la rama `experimental/welcome-no-auth` (que tiene el endpoint público sin auth y NO debería desplegarse a producción).

**Env vars de Vercel (cifradas, no se puede ver el valor):**
- `VITE_API_URL` (presente en los 3, valor cifrado con envelope encryption)
- `VITE_SUPABASE_URL` ✓
- `VITE_SUPABASE_ANON_KEY` ✓
- `VITE_USE_MOCKS` (algunos proyectos lo tienen vacío)

---

## 🔗 Causa Raíz del "Chat Colgado"

1. **El usuario accede a** `https://sportmatch-connect.vercel.app` (proyecto `prj_xkYkcOWCW33LPADuE4A5S5sBMkRj`).
2. **Vercel sirve el bundle de la rama `experimental/welcome-no-auth`** porque `productionBranch` está vacío.
3. **El bundle hace fetch a** `VITE_API_URL` (cuyo valor no se puede inspeccionar por estar cifrado).
4. **Si** `VITE_API_URL` apunta a `sportmatch-api.onrender.com` (subdominio que **NO EXISTE**; el real es `sportmatch-connect.onrender.com`):
   - DNS resuelve pero el host no responde → fetch cuelga.
5. **Si** apunta a `sportmatch-connect.onrender.com`:
   - El servicio está **SUSPENDED** → no responde.
6. **El fetch cuelga 30s** (timeout del `fetchWithTimeout`).
7. **El watchdog de 15s debería disparar**, pero si no se renderiza bien el mensaje de error, el usuario sigue viendo "Conectando con Sporty..." + "Analizando...".

**Si** `VITE_API_URL` apunta a un subdominio incorrecto, el CORS no interviene (porque la request nunca llega al servidor real).

---

## ✅ Acciones Recomendadas (orden de ejecución)

### 1. Reactivar el servicio de Render
- API: `POST https://api.render.com/v1/services/{id}/resume`
- Efecto: el listener de NestJS arranca de nuevo.
- Riesgo: bajo. Si hay error de env vars, el servicio arrancará en modo degraded (gracias al fix Prisma no-bloqueante del commit `32ea9d4`).

### 2. Configurar `productionBranch = "main"` en los 3 proyectos Vercel
- API: `PATCH /v9/projects/{id}` con body `{ "productionBranch": "main" }`
- Efecto: Vercel ya no hace auto-deploy de ramas experimentales; solo `main` se publica a producción.
- Riesgo: muy bajo. Es reversible.

### 3. Triggerar redeploy desde main
- API: `POST /v13/deployments` con `{"name": "...", "target": "production", "gitSource": {"ref": "main", "repoId": "..."}}`
- Efecto: los 3 proyectos sirven el bundle del commit `8f2241c` (los 4 fixes del chat colgado).
- Riesgo: bajo. Cada redeploy es instantáneo.

### 4. (Recomendado) Actualizar env vars
- En Render: añadir `https://sportmatch-connect.vercel.app` y `https://sportmatch-connect-czs5.vercel.app` a `FRONTEND_URL`.
- En Vercel: confirmar/actualizar `VITE_API_URL=https://sportmatch-connect.onrender.com` (NO `sportmatch-api.onrender.com`).

### 5. (Opcional) Mejorar DATABASE_URL
- Cambiar a `postgresql://...@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true` y dejar `DIRECT_URL` en `5432`.
- Beneficio: mejor performance en serverless, menos timeouts.

---

## 🛠 Scripts Disponibles

`scripts/infra/render-status.ps1` y `vercel-status.ps1` están listos para usar.
Ejecutan con `powershell -ExecutionPolicy Bypass -File ...` y enmascaran secretos en la salida.

---

**Decisión del operador:** ¿Procedo con las acciones 1-4 o prefieres que te pase los comandos exactos para que los ejecutes tú?

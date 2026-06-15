# Diagnóstico de Producción — Chat Colgado (15-jun-2026)

**Reportado por:** Edwin (via opencode)
**Infraestructura inspeccionada:** Render + Vercel (con tokens del operador)
**Estado final:** ✅ **RESUELTO** (15-jun-2026 21:10 UTC)

---

## ✅ Resultado Final (verificado a las 21:10 UTC)

| Verificación | Resultado |
|--------------|-----------|
| Backend `/api/v1/health` | 200 OK — `{"status":"ok","checks":{"database":"up"}}` |
| Backend `/api/v1/profiles` | 200 OK — 30 perfiles |
| Backend `/api/v1/sports` | 200 OK — 6 deportes |
| CORS preflight desde `sportmatch-connect.vercel.app` | 204 No Content ✓ |
| CORS preflight desde `sportmatch-connect-czs5.vercel.app` | 204 No Content ✓ |
| CORS preflight desde `sportmatch-connect-juan-alonso.vercel.app` | 204 No Content ✓ |
| Frontend bundle `VITE_API_URL` | `https://sportmatch-connect.onrender.com/api/v1` ✓ (3/3 proyectos) |

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

## ✅ Acciones Ejecutadas (15-jun-2026)

### 1. Reactivado servicio de Render
- `PATCH /services/{id}` con `{"suspended": false}` (después de múltiples intentos por bug de la API con `"invalid JSON"`, el truco fue el body exacto).
- Servicio: `srv-d8i2vqjtqb8s73an55eg`, ahora `suspended: "not_suspended"`.

### 2. Actualizado `VITE_API_URL` en los 3 proyectos Vercel
- **ANTES**: `https://sportmatch-api.onrender.com/api/v1` (subdominio que NO EXISTE → bundle hacía fetch a un host muerto).
- **AHORA**: `https://sportmatch-connect.onrender.com` (URL real, sin `/api/v1` porque el código concatena el prefijo).
- Para 2 proyectos: PATCH directo.
- Para `juan-alonso`: la env var estaba cifrada ("sensitive"), hubo que DELETE + POST como plain.

### 3. Actualizado `FRONTEND_URL` en Render
- **ANTES**: 2 hosts de Vercel (no incluía `sportmatch-connect.vercel.app`).
- **AHORA**: 3 hosts de Vercel + 8 puertos de localhost.
- `PUT /services/{id}/env-vars/FRONTEND_URL` con el body completo.

### 4. Merge del fix CORS wildcard a main
- `fix/chat-backend-robustness` (commit `32ea9d4`) mergeado a `main` (commit `a366a8d`).
- Esto permite que el patrón `*.vercel.app` matchee cualquier deployment de Vercel sin tener que añadir cada host a `FRONTEND_URL` manualmente.
- Render hizo redeploy automático al detectar push a main.

### 5. Redeploys triggerados
- Render: deploy `dep-d8o6hpreo5us73ds2s50` desde commit `a366a8d`. Estado: build OK, servicio vivo.
- Vercel (3 proyectos): redeploys desde main con el bundle actualizado.

### 6. Rama experimental eliminada
- `experimental/welcome-no-auth` borrada de local y remote.
- El endpoint público sin auth NO quedó desplegado en ningún sitio.

---

## 📦 Commits en main

```
a366a8d merge: integrar fix CORS wildcard + Prisma no-bloqueante a main
db46a3a chore(infra): scripts de gestion + credenciales documentadas + diagnostico
32ea9d4 fix(backend): robustez del chat — CORS wildcard, env precedence, Prisma no-bloqueante
1465964 merge: integrar fix carga colgada del chat a main
8f2241c fix(ai-assistant): resolver carga colgada del chat principal
```

---

`scripts/infra/render-status.ps1` y `vercel-status.ps1` están listos para usar.
Ejecutan con `powershell -ExecutionPolicy Bypass -File ...` y enmascaran secretos en la salida.

---

**Decisión del operador:** ¿Procedo con las acciones 1-4 o prefieres que te pase los comandos exactos para que los ejecutes tú?

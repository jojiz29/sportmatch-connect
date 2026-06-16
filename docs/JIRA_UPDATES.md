# Jira Updates — Resumen de cambios

**Fecha:** 16-jun-2026
**Proyecto:** SCRUM (USIL Software Team)
**Scrum Master/Author:** Edwin Flores Sanchez
**Release tag actual:** v3.7.0-settings-polish

Este documento documenta todas las actualizaciones realizadas a Jira el 16-jun-2026
como parte del cierre de Sprint 5, Sprint Final y preparación para la presentación
del 18-jun-2026.

## Resumen ejecutivo

| Acción | Cantidad |
|---|---:|
| US existentes transicionadas a "Finalizada" | 20 |
| US existentes que quedan en "Tareas por hacer" (trabajo futuro) | 23 |
| US nuevas creadas (SCRUM-398 a SCRUM-414) | 17 |
| US nuevas marcadas como "Finalizada" | 15 |
| US nuevas que quedan en "Tareas por hacer" | 2 |
| **Total US de Edwin actualizadas** | **60** |

## US de Edwin transicionadas a "Finalizada" (16-jun-2026)

### Sprint 5 — Features de IA (SCRUM-338..345)

| Issue | Resumen | Commit | Tag |
|---|---|---|---|
| SCRUM-338 | Sugerir comentarios inteligentes | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-339 | Etiquetar posts con hashtags | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-340 | Moderar contenido tóxico/NSFW/spam | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-341 | Múltiples idiomas (es/en/pt) | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-342 | Jerga deportiva peruana/LATAM | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-343 | Speech-to-Text (STT) | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-344 | Text-to-Speech (TTS) | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-345 | Contexto últimos 5 mensajes | b0a8ff9 | v3.0.0-sprint5 |

### Sprint 5 — HIST Sprint 5 (SCRUM-358, 359, 362, 366)

| Issue | Resumen | Commit | Tag |
|---|---|---|---|
| SCRUM-358 | Vertex AI real (gemini-2.5-flash) | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-359 | Refactorización Sistema de Temas | 378a487 | v3.7.0 |
| SCRUM-362 | NSFW moderación cliente (useNSFWJS) | b0a8ff9 | v3.0.0-sprint5 |
| SCRUM-366 | Tests moderación IA + Error Boundaries | 378a487 | v3.7.0 |

### Wallet (SCRUM-188, 190, 191, 192)

| Issue | Resumen | Commit | Tag |
|---|---|---|---|
| SCRUM-188 | Cancelación reservas con reembolso | 302de94 | v3.2.0 |
| SCRUM-190 | Saldo FitCoins | 302de94 | v3.2.0 |
| SCRUM-191 | Historial transacciones | 302de94 | v3.2.0 |
| SCRUM-192 | Recompensas FitCoins por asistencia | 302de94 | v3.2.0 |

### A11y + i18n + Privacidad (SCRUM-237, 238, 240, 244)

| Issue | Resumen | Commit | Tag |
|---|---|---|---|
| SCRUM-237 | WCAG 2.2 AA (lectores pantalla) | 378a487 | v3.7.0 |
| SCRUM-238 | Modo alto contraste | 378a487 | v3.7.0 |
| SCRUM-240 | Formato LATAM (es-419, America/Lima) | 0eeeade | v3.5.0 |
| SCRUM-244 | Visibilidad perfil (3 niveles) | 0eeeade | v3.5.0 |

## US nuevas creadas (SCRUM-398..414)

### Settings — Vista completa + Backend + Polish

| Issue | Resumen | Estado | Tag |
|---|---|---|---|
| SCRUM-398 | Settings UI completa con 8 secciones | Finalizada | v3.5.0-settings |
| SCRUM-399 | Backend NestJS /users/me (9 endpoints) | Finalizada | v3.5.0-settings |
| SCRUM-400 | Settings UI polish + mobile-first + WCAG 2.2 AA | Finalizada | v3.7.0-settings-polish |
| SCRUM-414 | Settings search con Command Palette (Cmd+K) | Finalizada | v3.7.0-settings-polish |

### Chat + Voice + AI (Sprint Final)

| Issue | Resumen | Estado | Tag |
|---|---|---|---|
| SCRUM-401 | Chat fixes (idempotencia, useRef, watchdog, AbortController) | Finalizada | v3.1.0-chat-fixed |
| SCRUM-402 | Voice module con Web Speech + Google Cloud STT fallback | Finalizada | v3.3.0-voice-humanized |
| SCRUM-403 | Chat desde búsqueda con auto-conexión | Finalizada | v3.2.0-chat-fixed |
| SCRUM-404 | Sporty humanizado (jerga LATAM multi-idioma) | Finalizada | v3.0.0-sprint5 |

### Arquitectura + DevOps + Seguridad

| Issue | Resumen | Estado | Tag |
|---|---|---|---|
| SCRUM-405 | ADR-001 PostgreSQL/Supabase persistencia | Finalizada | v3.6.0-adr-001 |
| SCRUM-406 | Credenciales centralizadas (sportmatch-infrastructure.json) | Finalizada | (sin tag, repo config) |
| SCRUM-407 | Fix Render DI — AiCoreModule @Global | Finalizada | (sprint 5 fix) |
| SCRUM-408 | Upgrade NestJS 10→11.1.27 (7 vulns high) | Finalizada | (sprint 5 fix) |
| SCRUM-409 | Wallet P0001 fix (trigger protection GUC) | Finalizada | v3.2.0-chat-fixed |
| SCRUM-412 | Vercel/Render fixes (CDN, baseUrl, .vercelignore) | Finalizada | (sprint 5 fix) |
| SCRUM-413 | Eliminación usuario usil (GDPR) | Finalizada | v3.4.0-bugfix-fase1 |

### Pendientes (Tareas por hacer)

| Issue | Resumen | Estado | Por hacer |
|---|---|---|---|
| SCRUM-410 | Eliminación cuenta con derecho al olvido (GDPR) | Tareas por hacer | UI ✓, backend DELETE /users/me con cascada pendiente |
| SCRUM-411 | Funcionar sin conexión (Service Worker + cache datos) | Tareas por hacer | PWA v1.3.0 ✓, logica de cache IndexedDB pendiente |

## Métricas del Sprint Final (16-jun-2026)

### Commits por tag

| Tag | Commit | Tema | US cubiertas |
|---|---|---|---|
| v3.0.0-sprint5 | b0a8ff9 | 8 features IA completas | SCRUM-338..345, 358, 362, 404 |
| v3.1.0-chat-fixed | 8f2241c | Chat bug fixes | SCRUM-401 |
| v3.2.0-chat-fixed | cbc373a | Chat desde búsqueda + wallet fix | SCRUM-403, 409 |
| v3.3.0-voice-humanized | (cbc373a) | Voice natural | SCRUM-402 |
| v3.4.0-bugfix-fase1 | cbc373a | Bug fixes fase 1 | SCRUM-413 |
| v3.5.0-settings | 0eeeade | Vista de Configuración | SCRUM-240, 244, 398, 399 |
| v3.6.0-adr-001 | c544082 | ADR PostgreSQL | SCRUM-405 |
| v3.7.0-settings-polish | 378a487 | Settings polish + a11y | SCRUM-237, 238, 359, 366, 400, 414 |

### Validación de calidad

| Métrica | Valor |
|---|---:|
| Tests unitarios | **78/78 pasan** |
| Errores TypeScript (FE) | 0 |
| Errores TypeScript (BE) | 0 |
| Errores ESLint | 0 |
| Vulnerabilidades npm audit (producción) | 0 |
| Build de Vite | OK 48.26s |
| GitHub Actions CI | ✓ success |
| Backend health `/api/v1/health` | 200 OK, `database: up` |

### Métricas de la base de datos (esquema real)

| Métrica | Valor |
|---|---:|
| Tablas | 30 |
| Funciones RPC | 16 |
| Triggers | 14 |
| RLS policies | 78 |
| Índices | 58 |
| Extensiones | postgis, pgcrypto, uuid-ossp |
| Profiles activos | 32 |

## Plan de crecimiento documentado (ADR-001)

El ADR-001 documenta el plan en 4 fases:

1. **Fase 1 (0-1K usuarios) — HOY:** Supabase Free/Pro, 1 instancia us-west-2, pooler + conexión directa
2. **Fase 2 (1K-10K):** Supabase Pro, read replica en us-east-1, particionado en tablas de alto churn
3. **Fase 3 (10K-100K):** Supabase Team / self-hosted AWS RDS, cache Redis (Upstash), BullMQ, full-text search dedicado
4. **Fase 4 (100K+):** Sharding por region/sport_id, CockroachDB/YugabyteDB si geo-distribución es crítica

## Criterios para revisar ADR-001

1. Coste mensual de Supabase > $500
2. Latencia p95 > 500ms con caché caliente
3. >100K usuarios activos mensuales
4. Nueva feature requiere modelo radicalmente diferente
5. PostgREST/Supabase se discontinúa

## Pendientes para futuro sprint

| Issue | Resumen | Estimación |
|---|---|---|
| SCRUM-210 | Canchas: Mapa interactivo con filtros | 8h |
| SCRUM-211 | Canchas: Vista detallada de fotos y tarifas | 6h |
| SCRUM-212 | Canchas: Registro de canchas favoritas | 4h |
| SCRUM-213 | Admin: Adición de canchas con PostGIS y precio | 6h |
| SCRUM-186 | Reservas: Calendario interactivo | 8h |
| SCRUM-187 | Reservas: Estado de horarios ocupados en tiempo real | 6h |
| SCRUM-189 | Notificaciones: Recordatorio de reserva por push | 4h |
| SCRUM-193 | Admin: Ajuste de precios de canchas en FitCoins | 3h |
| SCRUM-228 | Completar desafíos semanales para ganar FitCoins extra | 8h |
| SCRUM-229 | Mostrar indicador de nivel XP | 4h |
| SCRUM-230 | Alerta visual al subir de nivel XP | 3h |
| SCRUM-233 | Reseñas y calificaciones de marketplace | 12h |
| SCRUM-234 | Compartir logros en redes sociales | 4h |
| SCRUM-235 | Sincronizar actividades de Strava | 16h |
| SCRUM-242 | Funcionar sin conexión (PWA cache) | 12h |
| SCRUM-245 | Eliminación cuenta (backend delete real) | 6h |
| SCRUM-250 | Documento de arquitectura con diagramas de BD | 4h |
| SCRUM-251 | Storybook con componentes UI documentados | 16h |
| SCRUM-252 | Documentar Edge Functions de Supabase | 4h |
| SCRUM-253 | Dashboard de métricas para product owner | 12h |
| SCRUM-254 | Alertas automatizadas para usuarios inactivos | 6h |
| SCRUM-255 | Retar amigos con enlace dinámico compartible | 8h |
| SCRUM-256 | Pronóstico meteorológico en canchas outdoor | 8h |
| SCRUM-257 | Exportar reporte financiero FitCoins | 6h |
| SCRUM-410 | Eliminación cuenta con derecho al olvido (backend) | 6h |
| SCRUM-411 | Funcionar sin conexión (cache IndexedDB) | 12h |

## Total estimación backlog: ~200h

## Cómo se verificó la conexión a Jira

Credenciales en `.env.local` (Basic Auth con email + API Token de Atlassian).

```powershell
# Verificar conexión
& curl.exe -s --max-time 30 -u $env:JIRA_USER_EMAIL`:$env:JIRA_API_TOKEN `
  "https://edwinfloress.atlassian.net/rest/api/3/myself"
```

Endpoint API usado: `/rest/api/3/search/jql` (nueva API que sustituye `/search` deprecated).

## Referencias

- Documentación Jira API v3: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- ADR-001: `docs/adr/ADR-001-database-persistence.md`
- Plan Sprint Final: `.opencode/plans/PLAN_MASTER_15_JUN.md`
- Diagnóstico producción 15-jun: `docs/DIAGNOSTICO_PRODUCCION_15_JUN_2026.md`

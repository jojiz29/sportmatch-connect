# ADR-001: PostgreSQL/Supabase como sistema de persistencia principal

- **Estado:** Aceptada
- **Fecha:** 16-jun-2026
- **Autor:** Edwin Junia
- **Última revisión:** 16-jun-2026
- **Próxima revisión:** 16-dic-2026 (6 meses) o al alcanzar 50K usuarios activos mensuales

## Contexto

SportMatch Connect es una red social deportiva con 30 tablas en su esquema de producción
(ver `scripts/db/stats.mjs`), 16 funciones RPC, 14 triggers, 78 policies de RLS, 58 índices
y extensiones `postgis`, `pgcrypto` y `uuid-ossp`. La arquitectura actual es:

- **Frontend:** React 19 + Vite (FSD) desplegado en Vercel
- **Backend:** NestJS 11 + Prisma desplegado en Render
- **Persistencia:** Supabase (PostgreSQL 15) con Row Level Security habilitado

En una sesión de revisión de arquitectura surgió la pregunta: **¿deberíamos migrar a
una base de datos NoSQL (MongoDB, Firestore, DynamoDB) para escalar mejor?**

Esta ADR documenta la decisión de **mantener PostgreSQL/Supabase** como sistema
principal, con un plan claro de cuándo reconsiderar.

## Decisión

**Mantenemos PostgreSQL/Supabase** como sistema de persistencia principal. No
migramos a NoSQL.

Justificación basada en los 5 factores que más impactan a este proyecto:

1. **Integridad referencial.** El dominio tiene relaciones complejas:
   `profiles` ↔ `squads` ↔ `squad_members` ↔ `matches` ↔ `match_participants` ↔
   `courts` ↔ `bookings` ↔ `reviews` ↔ `business_catalog`. Un match relacional con
   foreign keys es **más barato de mantener** que replicar esa lógica en aplicación
   con un store de documentos.

2. **Geolocalización nativa.** `PostGIS` ya está instalado y `venue_activities`
   lo usa para venues cercanos. Migrar a MongoDB con `2dsphere` duplicaría la
   dependencia y perderíamos la integración con PostgREST/Supabase.

3. **RLS (Row Level Security) es un diferenciador.** 78 policies declarativas
   en DB evitan repetir autorización en el backend. En MongoDB/Firestore hay que
   implementar el control de acceso en cada query o en un middleware, lo que es
   propenso a errores.

4. **JSONB para flexibilidad.** Ya usamos columnas `JSONB` en
   `user_preferences`, `rewards.criteria`, `posts.metadata` para datos
   semiestructurados. Esto cubre el caso de uso típico de NoSQL sin sus trade-offs.

5. **Coste operacional.** Migrar a MongoDB Atlas o DynamoDB implicaría una
   segunda base de datos que sincronizar con Supabase Auth, lo que duplica
   superficie de fallo y coste de monitorización.

## Estado actual (16-jun-2026)

Métricas reales del esquema en producción:

| Métrica | Valor |
|---|---:|
| Tablas | 30 |
| Filas totales estimadas | 583 |
| Funciones RPC | 16 |
| Triggers | 14 |
| RLS policies | 78 |
| Índices | 58 |
| Extensiones | `postgis`, `pgcrypto`, `uuid-ossp` |
| Usuarios activos (`profiles`) | 32 |

Las tablas más grandes son `courts` (433 filas) — datos de canchas pre-cargados —
y `profiles` (32) — usuarios reales. El sistema está en fase early-adopter con
miles de filas, **no millones**.

## Alternativas consideradas

### A. MongoDB Atlas

- **A favor:** esquema flexible, replicación geográfica, escalado horizontal.
- **En contra:** perdemos RLS declarativa, FKs, PostGIS, integridad referencial
  para 30 tablas con relaciones densas. Coste aproximado: $57/mes (M10) +
  migración de 6 meses de datos y reescritura de 16 RPCs.
- **Veredicto:** no aporta valor sobre `JSONB` + `JSON` columns que ya tenemos.

### B. Firebase / Firestore

- **A favor:** SDK cliente nativo, sync en tiempo real, auth integrado.
- **En contra:** ya usamos Supabase Auth (que también lo da), RLS no existe
  (security rules son más limitadas), queries complejas requieren
  `collectionGroup` con índices manuales. Coste: $25/mes (Blaze) + riesgo de
  vendor lock-in con Google.
- **Veredicto:** Supabase ofrece la misma propuesta open-source y portable.

### C. DynamoDB

- **A favor:** escala infinita, latencia <10ms, serverless.
- **En contra:** modelo de datos completamente diferente (key-value + GSI),
  ningún concepto de JOIN. Toda la lógica de relaciones se reescribe en
  aplicación. Coste: variable, difícil de predecir.
- **Veredicto:** óptimo para casos de uso muy concretos (e.g. carritos de
  compra), **no** para una red social con 30 entidades relacionadas.

### D. Multi-modelo (Polyglot persistence)

- **A favor:** la herramienta correcta para cada caso.
- **En contra:** introduce complejidad operacional. Un equipo de 1-2 devs no
  debería mantener 3+ sistemas de persistencia. Solo se justifica si una
  necesidad concreta lo demanda.
- **Veredicto:** lo consideramos **dentro de PostgreSQL** con JSONB. Si en el
  futuro hace falta full-text search avanzado, evaluamos
  `pg_search` o `Meilisearch` como servicio externo, no como reemplazo.

## Consecuencias

### Positivas

- **Una sola fuente de verdad** para datos relacionales y documentos
  (`JSONB` cubre el 95% de los casos de uso de NoSQL).
- **RLS declarativa** en 78 policies: imposible saltarse la autorización sin
  tocar la DB directamente.
- **Triggers en DB** (`protect_profile_fields`, `sync_profile_wallet_balance`)
  garantizan invariantes sin confiar en que la aplicación lo haga bien.
- **PostgREST** (auto-generado por Supabase) nos da una API REST + Realtime
  sin escribir código.
- **Backups, point-in-time recovery, read replicas** incluidos en Supabase Pro.

### Negativas

- **Escalado vertical antes que horizontal.** Si llegamos a >100K usuarios
  activos concurrentes en una sola query pesada, hay que pensar en
  partitioning o réplicas de lectura. La mitigación está en la sección
  "Plan de crecimiento".
- **Coste por filas en Supabase Pro:** $25/mes incluye 8GB, suficiente para
  los próximos 2-3 años al ritmo actual.
- **Pooler `pgbouncer` en modo transaction** puede romper `LISTEN/NOTIFY`
  o features que usen prepared statements. La mitigación es `DIRECT_URL`
  para migraciones, configurado en `server/.env` y `prisma/schema.prisma`
  con dual-routing (ver `AGENTS.md`).

## Plan de crecimiento por fases

### Fase 1: Early adopter (0-1K usuarios) — **HOY**

- Plan Supabase Free/Pro (8GB).
- Una sola instancia en `us-west-2` (Supabase Oregon).
- Una sola réplica de lectura no es necesaria todavía.
- Pooler compartido (6543) + conexión directa (5432) para migraciones.

### Fase 2: Crecimiento (1K-10K usuarios)

- Plan Supabase Pro ($25/mes) con 8GB incluidos, $0.125/GB extra.
- Activar **read replica** en `us-east-1` para queries pesadas de
  matchmaking/feed (read-heavy).
- Activar **connection pooler en modo session** si el plan free-tier se queda
  corto.
- Implementar **particionado por fecha** en tablas con alto churn:
  `notifications`, `wallet_transactions`, `messages` (mensajería).
- **Monitoreo:** activar `pg_stat_statements` y `auto_explain` para detectar
  queries lentas antes de que sean un problema.

### Fase 3: Escala (10K-100K usuarios)

- Migrar de Supabase Pro a **Supabase Team** o self-hosted en AWS RDS.
  Auto-scaling de read replicas, particionado mensual en
  `wallet_transactions` y `messages`.
- **Cache layer:** Redis (Upstash o ElastiCache) para feed de posts,
  matchmaking, leaderboards. 5min TTL.
- **CDN agresivo** en Vercel para assets estáticos (ya activo).
- **Full-text search** dedicado: `pg_search` (BM25) o Meilisearch en
  Railway/Render. Sustituir `ILIKE` en búsqueda de perfiles/squads.
- **Jobs asíncronos:** BullMQ (Redis) para emails, notificaciones push,
  generación de thumbnails. Hoy se ejecutan inline.

### Fase 4: Hiperescala (100K+ usuarios)

- **Solo si el negocio lo justifica.** Coste estimado >$2K/mes.
- **Considerar sharding** por `region` o `sport_id` en `profiles` y tablas
  asociadas. Hoy **no** es necesario.
- **Evaluar ClickHouse o DuckDB** para analítica de eventos
  (separar OLTP de OLAP).
- **Evaluar CockroachDB o YugabyteDB** si la geo-distribución se vuelve
  crítica. Supabase no escala multi-región automáticamente.

## Cuándo reconsiderar esta decisión

Activamos una revisión de ADR-001 si:

1. **Coste mensual de Supabase > $500** sin un ROI claro → evaluar
   self-hosted PostgreSQL en Hetzner o AWS RDS.
2. **Latencia p95 > 500ms** en queries de feed con caché caliente →
   evaluar read replicas más agresivas, o servicio de búsqueda dedicado.
3. **>100K usuarios activos mensuales** → considerar particionado o sharding.
4. **Una nueva feature necesita un modelo de datos radicalmente diferente**
   (e.g. grafo social con 5+ niveles de profundidad) → evaluar Neo4j
   **como complemento**, no como reemplazo.
5. **PostgREST/Supabase se discontinúa** → poco probable, pero la portabilidad
   de SQL estándar nos da vía de escape a Postgres vanilla o RDS.

## Referencias

- Schema actual: `server/prisma/schema.prisma` (30 modelos).
- Migraciones: `supabase/migrations/` (16 archivos .sql).
- Dual-URL Prisma setup: `AGENTS.md` → "Database & Prisma Dual-URL Architecture".
- Métricas: `scripts/db/stats.mjs` (ejecutable, conecta a Supabase).
- RLS policies: 78 activas, ver `select * from pg_policies where schemaname='public';`
- Stack: Supabase (PostgreSQL 15), PostGIS, pgcrypto, uuid-ossp.

## Notas

- Esta ADR **no descarta NoSQL** como tecnología. Solo argumenta que, para
  **este caso de uso y esta etapa**, PostgreSQL es la elección correcta.
- Si en el futuro una sola parte del sistema necesita NoSQL (e.g. real-time
  feed con Firestore, búsqueda con Elasticsearch), lo evaluamos **dentro**
  de una ADR específica, no reemplazando esta.
- Compatible con la presentación del 18-jun-2026: muestra que la decisión
  arquitectónica está documentada y es defendible.

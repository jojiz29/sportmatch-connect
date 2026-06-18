# Data Pipeline — usage_metrics y agregaciones

## Resumen

El módulo B2B-AI consume datos de **3 fuentes**:

- `bookings` (existe desde el inicio)
- `business_ads` (existe, gestionada por Supabase PostgREST)
- `usage_metrics` (nueva, creada en migración 20260616)

## Schema: `usage_metrics`

```sql
CREATE TYPE b2b_metric_type AS ENUM (
  'profile_view',     -- Apertura del CommercialSheetModal
  'ad_view',          -- Visualización de un business_ad en el feed
  'ad_click',         -- Click en un business_ad
  'ad_contact',       -- Click en WhatsApp/contacto de un business_ad
  'map_pin_click',    -- Click en el pin del negocio en el mapa
  'venue_booking'     -- Reserva creada en una cancha del negocio
);

CREATE TABLE usage_metrics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type  b2b_metric_type NOT NULL,
  value        numeric NOT NULL DEFAULT 1,
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  day_bucket   date NOT NULL GENERATED ALWAYS AS (date_trunc('day', recorded_at)::date) STORED
);

CREATE INDEX idx_usage_metrics_business_day ON usage_metrics (business_id, day_bucket DESC);
CREATE INDEX idx_usage_metrics_type_day ON usage_metrics (metric_type, day_bucket DESC);
```

### Decisiones de diseño

**`day_bucket` es GENERATED** — no se actualiza manualmente, siempre es
consistente con `recorded_at`. Ahorra errores y simplifica queries de
agregación (no hay que hacer `date_trunc` en cada GROUP BY).

**`value` es `numeric` en vez de `int`** — flexibilidad futura para
métricas ponderadas (ej: engagement con pesos distintos).

**`metric_type` es `enum`** — mejor rendimiento que `text` + check constraint
y previene typos a nivel de BD.

### Row Level Security (RLS)

```sql
-- El dueño del negocio puede leer SOLO sus propias métricas
CREATE POLICY "Business owners can read own metrics"
  ON usage_metrics FOR SELECT
  USING (auth.uid() = business_id);

-- Cualquier cliente autenticado puede insertar
CREATE POLICY "Authenticated users can insert metrics"
  ON usage_metrics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

Esto permite que el cliente (frontend) inserte sin necesidad de pasar por el
backend, pero solo el dueño puede leer las suyas.

## RPC: `track_b2b_metric`

```sql
CREATE OR REPLACE FUNCTION track_b2b_metric(
  p_business_id uuid,
  p_metric_type b2b_metric_type,
  p_value       numeric DEFAULT 1
) RETURNS void AS $$
BEGIN
  INSERT INTO usage_metrics (business_id, metric_type, value)
  VALUES (p_business_id, p_metric_type, COALESCE(p_value, 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

`SECURITY DEFINER` permite que la función ejecute con permisos del owner
(supabase service_role), evitando depender de la policy de INSERT.

**Payload típico desde el cliente:**

```ts
const { error } = await supabase.rpc("track_b2b_metric", {
  p_business_id: businessId,
  p_metric_type: "profile_view",
  p_value: 1,
});
```

**Performance:** el RPC hace 1 round-trip y 1 INSERT. Es seguro llamarlo
en cada `useEffect` de apertura de modal sin throttling.

## Post-migración obligatorio

Tras aplicar la migración en Supabase Dashboard:

```sql
NOTIFY pgrst, 'reload schema';
```

(Ver AGENTS.md → "PostgREST Cache" — sin esto, el cliente no verá la
nueva tabla hasta el próximo deploy.)

## Queries agregadas (backend)

### Ocupación por hora de una cancha

```sql
SELECT time
FROM bookings
WHERE court_id = $1::uuid
  AND date >= $2
```

Luego se cuenta en TypeScript con `extractHourFromTimeSlot()`. Esto evita
un `GROUP BY` costoso y deja el procesamiento en memoria.

### Métricas de ads por business

```sql
SELECT id, title, views, clicks, contacts, created_at
FROM business_ads
WHERE business_id = $1::uuid
ORDER BY created_at DESC
LIMIT 50
```

**Nota:** `business_ads` se gestiona vía Supabase PostgREST (no está en
`schema.prisma`). Usamos `$queryRaw` directamente con fallback gracioso
si la query falla.

### Usage summary últimos N días

```sql
SELECT metric_type::text AS metric_type,
       SUM(value)::bigint AS total,
       day_bucket
FROM usage_metrics
WHERE business_id = $1::uuid
  AND recorded_at >= $2::timestamptz
GROUP BY metric_type, day_bucket
ORDER BY day_bucket ASC
```

Devuelve totales por tipo + serie temporal por día para gráficos.

### Revenue agregado por business

```sql
SELECT COALESCE(SUM(b.total_cobrado), 0)::numeric AS total
FROM bookings b
INNER JOIN courts c ON c.id = b.court_id
WHERE c.owner_id = $1::uuid
  AND b.date >= $2
```

Join a través de `courts.owner_id` porque `bookings` no tiene `business_id`
directo.

## Tracking desde el frontend

El servicio `src/shared/api/usageMetricsService.ts` centraliza el tracking:

```ts
import { usageMetricsService } from "@/shared/api/usageMetricsService";

await usageMetricsService.track(businessId, "profile_view");
```

Implementado en:

- `src/features/business/ui/CommercialSheetModal.tsx` → `profile_view`

### Puntos pendientes de instrumentar

- `ad_view` cuando un `business_ad` aparece en el feed (FeedService)
- `ad_click` cuando se hace click en un ad (CommercialSheetModal)
- `ad_contact` cuando se abre WhatsApp (CommercialSheetModal)
- `map_pin_click` cuando se clickea el pin del negocio en el mapa (VenueLocationPicker)
- `venue_booking` cuando se confirma una reserva (BookingModal)

## Modo demo (sin backend)

En modo demo (`useAuthStore.isDemoMode === true`), `usageMetricsService`
persiste en `localStorage`:

```ts
const STORAGE_KEY = "sportmatch_demo_usage_metrics";
```

Esto permite que el dashboard funcione end-to-end sin credenciales de
Supabase, y que las features de B2B-AI tengan engagement data mínimo
para probar el Churn Predictor.

## Tests relevantes

- `server/src/ai/b2b/__tests__/data-pipeline.service.spec.ts` (11 tests)
  - Cubre `$queryRaw` mocks con respuestas vacías, NULL values, fallos
- `src/features/b2b-ai/__tests__/useB2bAiStore.test.ts` (13 tests)
  - Cubre fallback demo mode y error handling

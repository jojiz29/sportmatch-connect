-- ============================================================
-- 20260616_b2b_usage_metrics.sql
-- Tabla mínima para alimentar los modelos B2B-AI (pricing, ads, churn).
-- JUAN — Sprint B2B Intelligence, Día 1.
--
-- Datos que captura:
--   - profile_view:    Apertura del CommercialSheetModal de un negocio
--   - ad_view:         Visualización de un business_ad en el feed
--   - ad_click:        Click en un business_ad
--   - ad_contact:      Click en WhatsApp/contacto de un business_ad
--   - map_pin_click:   Click en el pin del negocio en el mapa
--   - venue_booking:   Reserva creada en una cancha del negocio
--
-- El RPC track_b2b_metric permite al cliente ingestar sin enviar el row
-- completo, reduciendo el payload en tracking de UI.
-- ============================================================

CREATE TYPE b2b_metric_type AS ENUM (
  'profile_view',
  'ad_view',
  'ad_click',
  'ad_contact',
  'map_pin_click',
  'venue_booking'
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type  b2b_metric_type NOT NULL,
  value        numeric NOT NULL DEFAULT 1,
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  day_bucket   date NOT NULL GENERATED ALWAYS AS (date_trunc('day', recorded_at)::date) STORED
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_business_day
  ON usage_metrics (business_id, day_bucket DESC);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_type_day
  ON usage_metrics (metric_type, day_bucket DESC);

ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- El dueño del negocio puede leer SOLO sus propias métricas
DROP POLICY IF EXISTS "Business owners can read own metrics" ON usage_metrics;
CREATE POLICY "Business owners can read own metrics"
  ON usage_metrics FOR SELECT
  USING (auth.uid() = business_id);

-- Cualquier cliente autenticado puede insertar (tracking desde UI)
DROP POLICY IF EXISTS "Authenticated users can insert metrics" ON usage_metrics;
CREATE POLICY "Authenticated users can insert metrics"
  ON usage_metrics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- RPC: track_b2b_metric
-- Ingesta barata desde el cliente (1 round-trip, payload mínimo).
-- SECURITY DEFINER: se ejecuta con permisos del owner de la función,
-- evitando depender de la policy de INSERT para uso server-side.
-- ============================================================
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

-- ============================================================
-- Vista materializada opcional (no creada aquí): vm_b2b_daily_metrics
-- Se puede agregar en una migración futura si las agregaciones en
-- tiempo real se vuelven costosas. Por ahora el backend agrega on-demand.
-- ============================================================

-- ============================================================
-- POST-MIGRACIÓN OBLIGATORIO:
-- Ejecutar en SQL Editor de Supabase para refrescar el cache de PostgREST:
--   NOTIFY pgrst, 'reload schema';
-- (Ver AGENTS.md → "PostgREST Cache")
-- ============================================================

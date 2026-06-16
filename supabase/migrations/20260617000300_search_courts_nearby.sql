-- ============================================================
-- 20260617000300_search_courts_nearby.sql
-- SCRUM-210: Mapa interactivo de canchas con filtros
-- RPC PostGIS para buscar canchas cercanas con filtros
-- ============================================================

-- Verificar que la extension postgis este habilitada
CREATE EXTENSION IF NOT EXISTS postgis;

-- RPC: buscar canchas cercanas con filtros
-- Retorna canchas dentro de un radio (km) desde un punto (lng, lat)
-- Opcionalmente filtra por deporte y precio maximo
CREATE OR REPLACE FUNCTION search_courts_nearby(
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_radius_km INTEGER DEFAULT 25,
  p_sport TEXT DEFAULT NULL,
  p_max_price INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  sport TEXT,
  price_per_hour NUMERIC,
  distance_km DOUBLE PRECISION,
  photo_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_point GEOMETRY;
BEGIN
  -- Construir punto PostGIS
  v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.address::TEXT,
    c.sport::TEXT,
    c.price_per_hour,
    (ST_Distance(c.location::geography, v_point::geography) / 1000)::DOUBLE PRECISION AS distance_km,
    c.photo_url::TEXT,
    ST_Y(c.location)::DOUBLE PRECISION AS lat,
    ST_X(c.location)::DOUBLE PRECISION AS lng
  FROM courts c
  WHERE ST_DWithin(
    c.location::geography,
    v_point::geography,
    p_radius_km * 1000
  )
  AND (p_sport IS NULL OR c.sport = p_sport)
  AND (p_max_price IS NULL OR c.price_per_hour <= p_max_price)
  ORDER BY distance_km ASC
  LIMIT 200;
END;
$$;

GRANT EXECUTE ON FUNCTION search_courts_nearby TO authenticated, anon;

COMMENT ON FUNCTION search_courts_nearby IS 'Busca canchas cercanas con PostGIS. Parametros: lng, lat, radius_km (default 25), sport (opcional), max_price (opcional).';

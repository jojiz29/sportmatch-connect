-- ============================================================
-- 20260617000200_booking_calendar.sql
-- SCRUM-186: Calendario interactivo de reservas
-- Anade indices, vista SQL y constraint anti-solapamiento.
-- ============================================================

-- 1) Indice principal: busqueda de reservas por cancha y fecha
CREATE INDEX IF NOT EXISTS idx_bookings_court_date
  ON bookings(court_id, date);

-- 2) Indice para "mis reservas" (user_id + date)
CREATE INDEX IF NOT EXISTS idx_bookings_user_date
  ON bookings(user_id, date DESC);

-- 3) Indice por time_slot para ordenamiento
CREATE INDEX IF NOT EXISTS idx_bookings_time_slot
  ON bookings(date, time_slot);

-- 4) Constraint unico para evitar doble booking
--     (misma cancha, mismo dia, mismo time_slot)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uniq_court_date_slot'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT uniq_court_date_slot
      UNIQUE (court_id, date, time_slot);
  END IF;
END $$;

-- 5) Vista SQL: disponibilidad por cancha y dia
--    Devuelve slots de 1h (8:00-22:00) con estado booked/available
CREATE OR REPLACE VIEW v_court_availability AS
SELECT
  c.id AS court_id,
  c.name AS court_name,
  d::date AS date,
  s.time_slot,
  (b.id IS NOT NULL) AS is_booked,
  b.user_id AS booked_by,
  b.precio_cancha
FROM courts c
CROSS JOIN generate_series(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '60 days',
  INTERVAL '1 day'
) AS d
CROSS JOIN (
  SELECT '08:00-09:00' AS time_slot UNION ALL
  SELECT '09:00-10:00' UNION ALL
  SELECT '10:00-11:00' UNION ALL
  SELECT '11:00-12:00' UNION ALL
  SELECT '12:00-13:00' UNION ALL
  SELECT '13:00-14:00' UNION ALL
  SELECT '14:00-15:00' UNION ALL
  SELECT '15:00-16:00' UNION ALL
  SELECT '16:00-17:00' UNION ALL
  SELECT '17:00-18:00' UNION ALL
  SELECT '18:00-19:00' UNION ALL
  SELECT '19:00-20:00' UNION ALL
  SELECT '20:00-21:00' UNION ALL
  SELECT '21:00-22:00'
) AS s
LEFT JOIN bookings b
  ON b.court_id = c.id
  AND b.date = d::date
  AND b.time_slot = s.time_slot;

COMMENT ON VIEW v_court_availability IS 'Disponibilidad de canchas por dia y time_slot (1h)';
COMMENT ON CONSTRAINT uniq_court_date_slot ON bookings IS 'Previene doble booking de la misma cancha, mismo dia, mismo slot';

-- 6) Permisos para la vista
GRANT SELECT ON v_court_availability TO authenticated, anon;

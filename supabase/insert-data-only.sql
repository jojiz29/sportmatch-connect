-- Script para insertar SOLO datos de prueba (sin políticas ni tablas)
-- Ejecuta esto en el SQL editor de Supabase

-- COURTS
INSERT INTO public.courts (
  id, created_at, name, sport, price_per_hour, rating, 
  reviews_count, lat, lng, image_url, amenities, is_available
) VALUES
('00000000-0000-0000-0000-000000000101', now(), 'Pádel Center Surco', 'Pádel', 40, 4.8, 312, -12.145, -77.0, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', ARRAY['Iluminación','Vestuarios','Parking','Cafetería'], true),
('00000000-0000-0000-0000-000000000102', now(), 'Complejo Deportivo Jorge Chávez', 'Fútbol', 120, 4.6, 480, -12.155, -77.005, 'https://images.unsplash.com/photo-1551958219-acbc608c6377', ARRAY['Pasto sintético','Gradas','Duchas'], true),
('00000000-0000-0000-0000-000000000103', now(), 'Tenis Club San Borja', 'Tenis', 35, 4.9, 215, -12.1084, -77.0025, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', ARRAY['Vestuarios','Cafetería','Parking'], true);

-- MATCHES
INSERT INTO public.matches (id, created_at, court_id, sport, title, date, time, max_players, required_level, creator_id) VALUES
('00000000-0000-0000-0000-000000000201', now(), '00000000-0000-0000-0000-000000000101', 'Pádel', 'Dobles mixto tarde', '2026-06-05', '18:00', 4, 'Intermedio', '00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000202', now(), '00000000-0000-0000-0000-000000000102', 'Fútbol', '5 vs 5 nocturno', '2026-06-06', '20:00', 10, 'Avanzado', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000203', now(), '00000000-0000-0000-0000-000000000103', 'Tenis', 'Singles mañana', '2026-06-07', '09:00', 2, 'Intermedio', '00000000-0000-0000-0000-000000000007');

-- MATCH PLAYERS
INSERT INTO public.match_players (match_id, user_id) VALUES
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000000'),
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000006'),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000005'),
('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000007');

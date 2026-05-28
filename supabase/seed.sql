-- =====================================================================
-- 🏆 SPORTMATCH CONNECT — SUPABASE SEED DATA DEFINITIVO
-- 💻 Copiar y pegar COMPLETO en el SQL Editor de Supabase
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 👤 1. SEED DATA: PERFILES (PROFILES)
-- ─────────────────────────────────────────────────────────────────────
-- Respetando la regla de B2B: nombres humanos en 'name' y marcas en 'company_name'
-- =====================================================================
INSERT INTO public.profiles (
  id, created_at, name, age, city, avatar_url, bio, 
  trust_score, matches_played, fitcoins_balance, level, 
  preferred_sports, last_location_lat, last_location_lng, 
  user_role, company_name, business_category, is_sponsored, is_admin
) VALUES
-- Administradores y Jugadores Humanos (user_role = 'PLAYER')
('00000000-0000-0000-0000-000000000000', now(), 'Edwin Flores', 29, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Edwin', 'Administrador Principal de la plataforma.', 100, 15, 5000, 'Elite', ARRAY['Pádel','Fútbol'], -12.14, -76.995, 'PLAYER', NULL, NULL, false, true),
('00000000-0000-0000-0000-000000000010', now(), 'Juan Alonso', 26, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan', 'Arquitecto UI/UX. Jugando tenis los fines de semana.', 95, 8, 1500, 'Intermedio', ARRAY['Pádel','Tenis'], -12.13, -76.98, 'PLAYER', NULL, NULL, false, false),
('00000000-0000-0000-0000-000000000020', now(), 'Erick Espinoza', 27, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Erick', 'Desarrollador backend. Buscando retos de fútbol 7.', 92, 12, 1850, 'Avanzado', ARRAY['Pádel','Fútbol'], -12.1189, -76.995, 'PLAYER', NULL, NULL, false, false),
('00000000-0000-0000-0000-000000000030', now(), 'Camila Torres', 24, 'Miraflores', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila', 'Compito en torneos los fines de semana.', 96, 12, 1240, 'Avanzado', ARRAY['Pádel'], -12.1221, -77.0298, 'PLAYER', NULL, NULL, false, false),
('00000000-0000-0000-0000-000000000040', now(), 'Diego Ramírez', 28, 'San Borja', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego', 'Mediocampista. Juego martes y jueves.', 88, 12, 860, 'Intermedio', ARRAY['Fútbol'], -12.1084, -76.9981, 'PLAYER', NULL, NULL, false, false),

-- Cuentas Corporativas B2B (user_role = 'BUSINESS' / is_sponsored = true)
('00000000-0000-0000-0000-000000000080', now(), 'Manuel Puka', 42, 'Surco', 'https://api.dicebear.com/7.x/identicon/svg?seed=Puka', 'Representante de bebidas premium energéticas.', 100, 0, 10000, 'Elite', ARRAY[]::text[], -12.086, -76.975, 'BUSINESS', 'Puka Power Inc.', 'Bebidas', true, false),
('00000000-0000-0000-0000-000000000090', now(), 'Roberto Arena', 38, 'Surco', 'https://api.dicebear.com/7.x/identicon/svg?seed=Arena', 'Gestión de complejos deportivos de alta gama.', 100, 0, 15000, 'Elite', ARRAY[]::text[], -12.148, -77.019, 'BUSINESS', 'SportMatch Arena Surco', 'Canchas', true, false)

ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  age = excluded.age,
  city = excluded.city,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  trust_score = excluded.trust_score,
  fitcoins_balance = excluded.fitcoins_balance,
  level = excluded.level,
  preferred_sports = excluded.preferred_sports,
  last_location_lat = excluded.last_location_lat,
  last_location_lng = excluded.last_location_lng,
  user_role = excluded.user_role,
  company_name = excluded.company_name,
  business_category = excluded.business_category,
  is_sponsored = excluded.is_sponsored,
  is_admin = excluded.is_admin;

-- ─────────────────────────────────────────────────────────────────────
-- 🏟️ 2. SEED DATA: CANCHAS (COURTS)
-- ─────────────────────────────────────────────────────────────────────
-- Coordenadas estrictas de Santiago de Surco usando st_setsrid(st_point(lng, lat), 4326)::geography
-- Nota: Longitud primero, Latitud segundo.
-- Vinculadas al negocio patrocinador 'SportMatch Arena Surco' (owner_id = '...0090')
-- =====================================================================
INSERT INTO public.courts (
  id, created_at, name, sport, price_per_hour, rating, 
  reviews_count, lat, lng, location, image_url, amenities, is_available, address, owner_id
) VALUES
(
  '00000000-0000-0000-0000-000000000101', 
  now(), 
  'Pádel Center Surco', 
  'Pádel', 
  40, 4.8, 312, 
  -12.086, -76.975, -- Cerca al Jockey Plaza
  st_setsrid(st_point(-76.975, -12.086), 4326)::geography, 
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', 
  ARRAY['Iluminación','Vestuarios','Parking','Cafetería'], 
  true, 
  'CC Jockey Plaza, Santiago de Surco', 
  '00000000-0000-0000-0000-000000000090'
),
(
  '00000000-0000-0000-0000-000000000102', 
  now(), 
  'Complejo Deportivo Jorge Chávez', 
  'Fútbol', 
  120, 4.6, 480, 
  -12.148, -77.019, -- Cerca a Makro de Jorge Chávez
  st_setsrid(st_point(-77.019, -12.148), 4326)::geography, 
  'https://images.unsplash.com/photo-1551958219-acbc608c6377', 
  ARRAY['Pasto sintético','Gradas','Duchas'], 
  true, 
  'Av. Jorge Chávez 456, Santiago de Surco', 
  '00000000-0000-0000-0000-000000000090'
)
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  sport = excluded.sport,
  price_per_hour = excluded.price_per_hour,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  lat = excluded.lat,
  lng = excluded.lng,
  location = excluded.location,
  image_url = excluded.image_url,
  amenities = excluded.amenities,
  is_available = excluded.is_available,
  address = excluded.address,
  owner_id = excluded.owner_id;

-- ─────────────────────────────────────────────────────────────────────
-- 🛍️ 3. SEED DATA: CATÁLOGO B2B (BUSINESS CATALOG)
-- ─────────────────────────────────────────────────────────────────────
-- Productos vinculados de manera consistente a 'Puka Power Inc.' (business_id = '...0080')
-- =====================================================================
INSERT INTO public.business_catalog (
  id, created_at, business_id, name, description, price, type, image_url
) VALUES
(
  'puka-power-bottle', 
  now(), 
  '00000000-0000-0000-0000-000000000080', 
  'Botella Puka Power', 
  'Bebida energética de 500ml para máxima resistencia.', 
  150, 
  'PRODUCT', 
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97'
),
(
  'puka-pack-6', 
  now(), 
  '00000000-0000-0000-0000-000000000080', 
  'Puka Pack (6 botellas)', 
  'Caja de 6 botellas para compartir con tu squad.', 
  800, 
  'PRODUCT', 
  'https://images.unsplash.com/photo-1546429070-1fc422f1d77a'
),
(
  'puka-vip-pass', 
  now(), 
  '00000000-0000-0000-0000-000000000080', 
  'Acceso VIP Arena Puka', 
  'Entrada exclusiva para eventos de pádel patrocinados.', 
  2500, 
  'SERVICE', 
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8'
)
ON CONFLICT (id) DO UPDATE SET
  business_id = excluded.business_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  type = excluded.type,
  image_url = excluded.image_url;

-- ─────────────────────────────────────────────────────────────────────
-- 🏟️ 4. SEED DATA: PARTIDOS (MATCHES)
-- ─────────────────────────────────────────────────────────────────────
-- Partidos creados con estatus por defecto 'Open' y asignados a sus creadores
-- =====================================================================
INSERT INTO public.matches (
  id, created_at, court_id, creator_id, sport, title, date, time, max_players, required_level, status
) VALUES
(
  '00000000-0000-0000-0000-000000000201', 
  now(), 
  '00000000-0000-0000-0000-000000000101', 
  '00000000-0000-0000-0000-000000000000', -- Creado por Edwin
  'Pádel', 
  'Dobles mixto tarde', 
  '2026-06-05', 
  '18:00', 
  4, 
  'Intermedio', 
  'Open'
),
(
  '00000000-0000-0000-0000-000000000202', 
  now(), 
  '00000000-0000-0000-0000-000000000102', 
  '00000000-0000-0000-0000-000000000020', -- Creado por Erick
  'Fútbol', 
  '5 vs 5 nocturno', 
  '2026-06-06', 
  '20:00', 
  10, 
  'Avanzado', 
  'Open'
)
ON CONFLICT (id) DO UPDATE SET
  court_id = excluded.court_id,
  creator_id = excluded.creator_id,
  sport = excluded.sport,
  title = excluded.title,
  date = excluded.date,
  time = excluded.time,
  max_players = excluded.max_players,
  required_level = excluded.required_level,
  status = excluded.status;

-- ─────────────────────────────────────────────────────────────────────
-- 👥 5. SEED DATA: PARTICIPANTES (MATCH PARTICIPANTS)
-- ─────────────────────────────────────────────────────────────────────
-- Agrega a los jugadores en los partidos creados de manera consistente
-- =====================================================================
INSERT INTO public.match_participants (
  match_id, user_id, status, joined_at
) VALUES
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000000', 'ACCEPTED', now()),
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000010', 'ACCEPTED', now()),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000020', 'ACCEPTED', now()),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000030', 'ACCEPTED', now())
ON CONFLICT (match_id, user_id) DO NOTHING;

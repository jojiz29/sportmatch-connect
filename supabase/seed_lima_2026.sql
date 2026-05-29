-- =====================================================================
-- 🏆 SPORTMATCH CONNECT — MASTER DATA SEED LIMA METROPOLITANA 2026
-- 💻 Copiar y pegar COMPLETO en el SQL Editor de Supabase
-- =====================================================================

-- Aseguramos la existencia de la cuenta corporativa owner_id de respaldo si no existe
INSERT INTO public.profiles (
  id, name, age, city, avatar_url, bio, trust_score, matches_played, fitcoins_balance, level,
  preferred_sports, last_location_lat, last_location_lng, user_role, company_name, business_category, is_sponsored, is_admin
) VALUES (
  '00000000-0000-0000-0000-000000000090', 'Roberto Arena', 38, 'Surco', 
  'https://api.dicebear.com/7.x/identicon/svg?seed=Arena', 'Gestión de complejos deportivos de alta gama.', 
  100, 0, 15000, 'Elite', ARRAY[]::text[], -12.148, -77.019, 'BUSINESS', 'SportMatch Arena Surco', 'Canchas', true, false
) ON CONFLICT (id) DO NOTHING;

-- Insertar las 15 canchas reales de Lima Metropolitana 2026
INSERT INTO public.courts (
  id, created_at, name, sport, price_per_hour, rating, 
  reviews_count, lat, lng, location, image_url, amenities, is_available, address, owner_id, is_sponsored, max_players, operating_hours
) VALUES
(
  'lima-court-01', now(), 'Miraflores Padel Club', 'Pádel', 120, 4.9, 142,
  -12.1221, -77.0298, st_setsrid(st_point(-77.0298, -12.1221), 4326)::geography,
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vestuarios', 'Iluminación Led', 'Estacionamiento', 'Cafetería Pro'], true,
  'Malecón de la Reserva 610, Miraflores', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '21:00']
),
(
  'lima-court-02', now(), 'Padel Surco Club', 'Pádel', 100, 4.7, 98,
  -12.1284, -76.9745, st_setsrid(st_point(-76.9745, -12.1284), 4326)::geography,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
  ARRAY['Estacionamiento', 'Alquiler de Palas', 'Duchas', 'Bebidas'], true,
  'Av. Cerros de Camacho 500, Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']
),
(
  'lima-court-03', now(), 'La Molina Padel Arena', 'Pádel', 130, 4.8, 64,
  -12.0854, -76.9452, st_setsrid(st_point(-76.9452, -12.0854), 4326)::geography,
  'https://images.unsplash.com/photo-1546429070-1fc422f1d77a?auto=format&fit=crop&q=80&w=600',
  ARRAY['Techado completo', 'Gimnasio integrado', 'Duchas Premium', 'Parking Privado'], true,
  'Av. Raúl Ferrero 1200, La Molina', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-04', now(), 'Pádel Club Rinconada', 'Pádel', 120, 4.6, 37,
  -12.0982, -76.9324, st_setsrid(st_point(-76.9324, -12.0982), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Seguridad 24h', 'Snack Bar', 'Wifi', 'Tribuna'], true,
  'Calle El Rincón 200, La Molina', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-05', now(), 'Padel Lima Club - San Borja', 'Pádel', 110, 4.7, 85,
  -12.1021, -76.9932, st_setsrid(st_point(-76.9932, -12.1021), 4326)::geography,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
  ARRAY['Luz Artificial Pro', 'Cafetería', 'Lockers', 'Pádel Shop'], true,
  'Av. San Luis 1520, San Borja', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-06', now(), 'Deporcentro Casuarinas', 'Fútbol', 90, 4.5, 210,
  -12.1174, -76.9682, st_setsrid(st_point(-76.9682, -12.1174), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pasto Sintético FIFA', 'Vestuarios amplios', 'Estacionamiento', 'Luz de Noche'], true,
  'Av. Jacarandá 850, Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 14,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-07', now(), 'La 10 - Surco (Fútbol 7)', 'Fútbol', 80, 4.4, 156,
  -12.1382, -76.9805, st_setsrid(st_point(-76.9805, -12.1382), 4326)::geography,
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600',
  ARRAY['Tribuna techada', 'Arbitraje opcional', 'Snacks', 'Estacionamiento'], true,
  'Av. Caminos del Inca 256, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 14,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-08', now(), 'Futbol Plaza La Molina', 'Fútbol', 70, 4.3, 112,
  -12.0721, -76.9582, st_setsrid(st_point(-76.9582, -12.0721), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Césped Sintético', 'Luz artificial', 'Parking gratis'], true,
  'Av. Separadora Industrial 3050, La Molina', '00000000-0000-0000-0000-000000000090', false, 14,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-09', now(), 'San Borja Fútbol Club', 'Fútbol', 85, 4.6, 93,
  -12.0912, -77.0123, st_setsrid(st_point(-77.0123, -12.0912), 4326)::geography,
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vestuarios', 'Seguridad Municipal', 'Estacionamiento', 'Parrillas'], true,
  'Av. Javier Prado Este 2500, San Borja', '00000000-0000-0000-0000-000000000090', false, 14,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-10', now(), 'Complejo DeporLima Surco', 'Fútbol', 80, 4.5, 78,
  -12.1450, -76.9910, st_setsrid(st_point(-76.9910, -12.1450), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Duchas caliente', 'Cafetería', 'Luz de Noche', 'Chalecos gratis'], true,
  'Jr. Batallón Callao 400, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 14,
  ARRAY['17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-11', now(), 'Centro Deportivo Municipal de Surco', 'Vóley', 60, 4.7, 240,
  -12.1332, -76.9992, st_setsrid(st_point(-76.9992, -12.1332), 4326)::geography,
  'https://images.unsplash.com/photo-1592656094247-b98a09698714?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pabellón Cubierto', 'Tribunas', 'Servicio Médico', 'Cafetería'], true,
  'Av. Loma Amarilla, Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 12,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
),
(
  'lima-court-12', now(), 'Complejo Manuel Bonilla Vóley', 'Vóley', 75, 4.5, 115,
  -12.1091, -77.0423, st_setsrid(st_point(-77.0423, -12.1091), 4326)::geography,
  'https://images.unsplash.com/photo-1592656094247-b98a09698714?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vista al Mar', 'Estacionamiento', 'Luces Artificiales', 'Tribuna'], true,
  'Av. Ejército 1300, Miraflores', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-13', now(), 'Miraflores Tennis Center', 'Tenis', 80, 4.8, 164,
  -12.1232, -77.0374, st_setsrid(st_point(-77.0374, -12.1232), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Arcilla Roja', 'Entrenadores ATP', 'Vestuarios', 'Tennis Bar'], true,
  'Av. Larco 1150, Miraflores', '00000000-0000-0000-0000-000000000090', false, 2,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
),
(
  'lima-court-14', now(), 'San Borja Tenis y Pádel Club', 'Tenis', 100, 4.6, 74,
  -12.0954, -76.9982, st_setsrid(st_point(-76.9982, -12.0954), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas rápidas', 'Cafetería', 'Lockers', 'Estacionamiento'], true,
  'Av. Boulevard de la Surco 300, San Borja', '00000000-0000-0000-0000-000000000090', false, 2,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
),
(
  'lima-court-15', now(), 'Rinconada Country Club Padel', 'Pádel', 150, 4.9, 212,
  -12.0911, -76.9234, st_setsrid(st_point(-76.9234, -12.0911), 4326)::geography,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
  ARRAY['Doble vidrio templado', 'Club House Premium', 'Piscina', 'Duchas Vip'], true,
  'Av. Manuel Prado Ugarteche, La Molina', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
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
  owner_id = excluded.owner_id,
  is_sponsored = excluded.is_sponsored,
  max_players = excluded.max_players,
  operating_hours = excluded.operating_hours;

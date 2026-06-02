-- =====================================================================
-- 🏆 SPORTMATCH CONNECT — LIMA 2026 COURT SEED CORRECTIONS
-- =====================================================================

-- Ensure Roberto Arena business owner profile exists
INSERT INTO public.profiles (
  id, name, age, city, avatar_url, bio, trust_score, matches_played, fitcoins_balance, level,
  preferred_sports, last_location_lat, last_location_lng, user_role, company_name, business_category, is_sponsored, is_admin
) VALUES (
  '00000000-0000-0000-0000-000000000090', 'Roberto Arena', 38, 'Surco', 
  'https://api.dicebear.com/7.x/identicon/svg?seed=Arena', 'Gestión de complejos deportivos de alta gama.', 
  100, 0, 15000, 'Elite', ARRAY[]::text[], -12.148, -77.019, 'BUSINESS', 'SportMatch Arena Surco', 'Canchas', true, false
) ON CONFLICT (id) DO NOTHING;

-- Populate/Upsert the 5 specified real locations in courts table
INSERT INTO public.courts (
  id, created_at, name, sport, price_per_hour, rating, 
  reviews_count, lat, lng, location, image_url, amenities, is_available, address, owner_id, is_sponsored, max_players, operating_hours
) VALUES
(
  'lima-court-01', now(), 'Miraflores Pádel Club', 'Pádel', 120, 4.9, 142,
  -12.1225, -77.0361, st_setsrid(st_point(-77.0361, -12.1225), 4326)::geography,
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vestuarios', 'Iluminación Led', 'Estacionamiento', 'Cafetería Pro'], true,
  'Malecón de la Reserva 610, Miraflores', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '21:00']
),
(
  'lima-court-02', now(), 'Padel Center Surco', 'Pádel', 100, 4.7, 98,
  -12.1314, -76.9812, st_setsrid(st_point(-76.9812, -12.1314), 4326)::geography,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
  ARRAY['Estacionamiento', 'Alquiler de Palas', 'Duchas', 'Bebidas'], true,
  'Av. Cerros de Camacho 500, Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']
),
(
  'lima-court-06', now(), 'Deporcentro Casuarinas', 'Fútbol', 90, 4.5, 210,
  -12.1158, -76.9675, st_setsrid(st_point(-76.9675, -12.1158), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pasto Sintético FIFA', 'Vestuarios amplios', 'Estacionamiento', 'Luz de Noche'], true,
  'Av. Jacarandá 850, Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 14,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-16', now(), 'Complejo Huantille', 'Fútbol', 80, 4.6, 88,
  -12.0945, -77.0689, st_setsrid(st_point(-77.0689, -12.0945), 4326)::geography,
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
  ARRAY['Césped artificial', 'Duchas', 'Iluminación Led', 'Estacionamiento'], true,
  'Jr. Huantille 350, Magdalena del Mar', '00000000-0000-0000-0000-000000000090', false, 14,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
),
(
  'lima-court-17', now(), 'Tennis Club San Borja', 'Tenis', 100, 4.7, 56,
  -12.1067, -76.9989, st_setsrid(st_point(-76.9989, -12.1067), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas de Arcilla', 'Cafetería', 'Lockers', 'Estacionamiento'], true,
  'Av. Boulevard de la Nación 300, San Borja', '00000000-0000-0000-0000-000000000090', false, 2,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
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

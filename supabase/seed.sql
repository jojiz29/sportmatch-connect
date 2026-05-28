-- Supabase Row Level Security (RLS) Policies para SportMatch Connect

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. USERS
-- Los perfiles son públicos (para poder ver avatares en matchmaking y mapa)
CREATE POLICY "Profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. MATCHES
-- Los partidos son públicos
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
-- Solo los usuarios logueados pueden crear partidos
CREATE POLICY "Authenticated users can create matches" ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Solo los dueños (o participantes en el futuro) pueden editar/borrar
CREATE POLICY "Owners can update their matches" ON public.matches FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Owners can delete their matches" ON public.matches FOR DELETE USING (auth.uid() = creator_id);

-- 3. COURTS
-- Las canchas son públicas pero solo las puede editar el admin
CREATE POLICY "Courts are viewable by everyone" ON public.courts FOR SELECT USING (true);
-- (Opcional) Restringir INSERT/UPDATE/DELETE a rol admin
-- CREATE POLICY "Admins can modify courts" ON public.courts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. TRANSACTIONS (FitCoins)
-- ALTA SEGURIDAD: Los usuarios SOLO pueden ver sus propias transacciones
CREATE POLICY "Users can only see their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
-- IMPORTANTE: Bloquear INSERT desde el cliente para evitar fraude. 
-- Los INSERTS deberían hacerse SÓLO a través de Supabase Edge Functions con Service Role.
-- Si queremos permitir inserts directos para la PoC:
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SEED DATA: Usuarios de Prueba
-- =========================
-- USERS (12 usuarios en formato correcto Supabase)
-- =========================
INSERT INTO public.users (
  id, created_at, name, age, city, avatar_url, bio, 
  trust_score, matches_played, fitcoins_balance, level, 
  preferred_sports, last_location_lat, last_location_lng, 
  email, password
) VALUES
('00000000-0000-0000-0000-000000000000', now(), 'Edwin Flores', 29, 'Surco', 'https://i.pravatar.cc/150?u=edwin', 'Usuario Maestro Edwin.', 99, 15, 3500, 'Elite', ARRAY['Pádel','Fútbol'], -12.14, -76.995, 'ejuniorfloress@gmail.com', 'EdwinFlores123?'),
('00000000-0000-0000-0000-000000000011', now(), 'Fabiola', 26, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fabiola', 'Buscando partidos de tenis y pádel.', 95, 8, 1200, 'Intermedio', ARRAY['Pádel','Tenis'], -12.13, -76.98, NULL, NULL),
('00000000-0000-0000-0000-000000000001', now(), 'Alex Rivera', 27, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'Amante del Pádel. Juego siempre que puedo.', 93, 12, 1850, 'Avanzado', ARRAY['Pádel','Fútbol'], -12.1189, -76.995, NULL, NULL),
('00000000-0000-0000-0000-000000000002', now(), 'Camila Torres', 24, 'Miraflores', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila', 'Compito en torneos los fines de semana.', 96, 12, 1240, 'Avanzado', ARRAY['Pádel'], -12.1221, -77.0298, NULL, NULL),
('00000000-0000-0000-0000-000000000003', now(), 'Diego Ramírez', 28, 'San Borja', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego', 'Mediocampista. Juego martes y jueves.', 88, 12, 860, 'Intermedio', ARRAY['Fútbol'], -12.1084, -76.9981, NULL, NULL),
('00000000-0000-0000-0000-000000000004', now(), 'Sofia Silva', 31, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia', 'Crossfit y Running. Empujando límites.', 99, 12, 3200, 'Avanzado', ARRAY['Running'], -12.115, -76.98, NULL, NULL),
('00000000-0000-0000-0000-000000000005', now(), 'Mateo Ortiz', 22, 'Barranco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mateo', 'Futbol y amigos.', 82, 12, 450, 'Principiante', ARRAY['Fútbol'], -12.14, -77.02, NULL, NULL),
('00000000-0000-0000-0000-000000000006', now(), 'Valentina Vega', 26, 'Miraflores', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valentina', 'Buscando dupla de pádel femenino.', 95, 12, 1100, 'Intermedio', ARRAY['Pádel'], -12.128, -77.035, NULL, NULL),
('00000000-0000-0000-0000-000000000007', now(), 'Lucas Castro', 29, 'San Isidro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', 'Tenis de polvo de ladrillo.', 91, 12, 2100, 'Avanzado', ARRAY['Tenis'], -12.095, -77.03, NULL, NULL),
('00000000-0000-0000-0000-000000000008', now(), 'Elena Ramos', 33, 'San Borja', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', 'Yoga y Pilates.', 98, 12, 400, 'Intermedio', ARRAY['Running'], -12.1, -77.0, NULL, NULL),
('00000000-0000-0000-0000-000000000009', now(), 'Martin Luna', 25, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin', 'Defensa central duro pero limpio.', 85, 12, 600, 'Avanzado', ARRAY['Fútbol'], -12.13, -76.99, NULL, NULL),
('00000000-0000-0000-0000-000000000010', now(), 'Julia Soto', 27, 'Miraflores', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia', 'Revés a dos manos.', 92, 12, 1550, 'Intermedio', ARRAY['Tenis'], -12.12, -77.025, NULL, NULL);

-- =========================
-- COURTS (3 canchas de prueba)
-- =========================
INSERT INTO public.courts (
  id, created_at, name, sport, price_per_hour, rating, 
  reviews_count, lat, lng, image_url, amenities, is_available
) VALUES
('00000000-0000-0000-0000-000000000101', now(), 'Pádel Center Surco', 'Pádel', 40, 4.8, 312, -12.145, -77.0, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', ARRAY['Iluminación','Vestuarios','Parking','Cafetería'], true),
('00000000-0000-0000-0000-000000000102', now(), 'Complejo Deportivo Jorge Chávez', 'Fútbol', 120, 4.6, 480, -12.155, -77.005, 'https://images.unsplash.com/photo-1551958219-acbc608c6377', ARRAY['Pasto sintético','Gradas','Duchas'], true),
('00000000-0000-0000-0000-000000000103', now(), 'Tenis Club San Borja', 'Tenis', 35, 4.9, 215, -12.1084, -77.0025, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', ARRAY['Vestuarios','Cafetería','Parking'], true);

-- SEED DATA: Partidos de Prueba (Corregido)
INSERT INTO public.matches (id, created_at, court_id, sport, title, date, time, max_players, required_level, creator_id) VALUES
('00000000-0000-0000-0000-000000000201', now(), '00000000-0000-0000-0000-000000000101', 'Pádel', 'Dobles mixto tarde', '2026-06-05', '18:00', 4, 'Intermedio', '00000000-0000-0000-0000-000000000000'), -- Cambiado a UUID de Edwin
('00000000-0000-0000-0000-000000000202', now(), '00000000-0000-0000-0000-000000000102', 'Fútbol', '5 vs 5 nocturno', '2026-06-06', '20:00', 10, 'Avanzado', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000203', now(), '00000000-0000-0000-0000-000000000103', 'Tenis', 'Singles mañana', '2026-06-07', '09:00', 2, 'Intermedio', '00000000-0000-0000-0000-000000000007');

-- SEED DATA: Jugadores en Partidos (Corregido)
INSERT INTO public.match_players (match_id, user_id) VALUES
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000000'), -- Cambiado a UUID de Edwin
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000006'),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000005'),
('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000007');
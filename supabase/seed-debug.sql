-- TEMPORAL: Deshabilitar RLS para debugging
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Insertar datos de prueba
INSERT INTO public.users (id, created_at, name, age, city, avatar_url, bio, trust_score, matches_played, fitcoins_balance, level, preferred_sports, last_location_lat, last_location_lng, email, password) VALUES
('user-edwin-master', now(), 'Edwin Flores', 29, 'Surco', 'https://i.pravatar.cc/150?u=edwin', 'Usuario Maestro Edwin.', 99, 15, 3500, 'Elite', '["Pádel", "Fútbol"]', -12.14, -76.995, 'ejuniorfloress@gmail.com', 'EdwinFlores123?'),
('user-fabiola', now(), 'Fabiola', 26, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fabiola', 'Buscando partidos de tenis y pádel.', 95, 8, 1200, 'Intermedio', '["Pádel", "Tenis"]', -12.13, -76.98, NULL, NULL),
('00000000-0000-0000-0000-000000000001', now(), 'Alex Rivera', 27, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'Amante del Pádel. Juego siempre que puedo.', 93, 12, 1850, 'Avanzado', '["Pádel", "Fútbol"]', -12.1189, -76.995, NULL, NULL),
('00000000-0000-0000-0000-000000000002', now(), 'Camila Torres', 24, 'Miraflores', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila', 'Compito en torneos los fines de semana.', 96, 12, 1240, 'Avanzado', '["Pádel"]', -12.1221, -77.0298, NULL, NULL),
('00000000-0000-0000-0000-000000000003', now(), 'Diego Ramírez', 28, 'San Borja', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego', 'Mediocampista. Juego martes y jueves.', 88, 12, 860, 'Intermedio', '["Fútbol"]', -12.1084, -76.9981, NULL, NULL),
('00000000-0000-0000-0000-000000000004', now(), 'Sofia Silva', 31, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia', 'Crossfit y Running. Empujando límites.', 99, 12, 3200, 'Avanzado', '["Running"]', -12.115, -76.98, NULL, NULL),
('00000000-0000-0000-0000-000000000005', now(), 'Mateo Ortiz', 22, 'Barranco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mateo', 'Futbol y amigos.', 82, 12, 450, 'Principiante', '["Fútbol"]', -12.14, -77.02, NULL, NULL),
('00000000-0000-0000-0000-000000000006', now(), 'Valentina Vega', 26, 'Miraflores', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valentina', 'Buscando dupla de pádel femenino.', 95, 12, 1100, 'Intermedio', '["Pádel"]', -12.128, -77.035, NULL, NULL),
('00000000-0000-0000-0000-000000000007', now(), 'Lucas Castro', 29, 'San Isidro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', 'Tenis de polvo de ladrillo.', 91, 12, 2100, 'Avanzado', '["Tenis"]', -12.095, -77.03, NULL, NULL),
('00000000-0000-0000-0000-000000000008', now(), 'Elena Ramos', 33, 'San Borja', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', 'Yoga y Pilates.', 98, 12, 400, 'Intermedio', '["Running"]', -12.1, -77.0, NULL, NULL),
('00000000-0000-0000-0000-000000000009', now(), 'Martin Luna', 25, 'Surco', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin', 'Defensa central duro pero limpio.', 85, 12, 600, 'Avanzado', '["Fútbol"]', -12.13, -76.99, NULL, NULL),
('00000000-0000-0000-0000-000000000010', now(), 'Julia Soto', 27, 'Miraflores', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia', 'Revés a dos manos.', 92, 12, 1550, 'Intermedio', '["Tenis"]', -12.12, -77.025, NULL, NULL);

-- Insertar canchas
INSERT INTO public.courts (id, created_at, name, sport, price_per_hour, rating, reviews_count, lat, lng, image_url, amenities, is_available) VALUES
('00000000-0000-0000-0000-000000000101', now(), 'Pádel Center Surco', 'Pádel', 40, 4.8, 312, -12.145, -77.0, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', '["Iluminación", "Vestuarios", "Parking", "Cafetería"]', true),
('00000000-0000-0000-0000-000000000102', now(), 'Complejo Deportivo Jorge Chávez', 'Fútbol', 120, 4.6, 480, -12.155, -77.005, 'https://images.unsplash.com/photo-1551958219-acbc608c6377', '["Pasto sintético", "Gradas", "Duchas"]', true),
('00000000-0000-0000-0000-000000000103', now(), 'Tenis Club San Borja', 'Tenis', 35, 4.9, 215, -12.1084, -77.0025, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', '["Vestuarios", "Cafetería", "Parking"]', true);

-- Volver a habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

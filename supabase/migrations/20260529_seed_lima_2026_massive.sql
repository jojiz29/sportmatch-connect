-- =====================================================================
-- 🏆 SPORTMATCH CONNECT — LIMA 2026 MASSIVE COURT SEEDING & TRIGGER
-- =====================================================================

-- 1. Create or replace the function to automate Match creation from Bookings (Social Cascade)
CREATE OR REPLACE FUNCTION public.create_match_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_sport text;
  v_court_name text;
  v_max_players int;
  v_user_level text;
  v_match_id uuid;
BEGIN
  BEGIN
    -- Get court details
    SELECT sport, name, max_players 
    INTO v_sport, v_court_name, v_max_players
    FROM public.courts
    WHERE id = NEW.court_id;

    -- Get user details (level)
    SELECT level 
    INTO v_user_level
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF v_user_level IS NULL THEN
      v_user_level := 'Intermedio';
    END IF;

    -- Insert into matches table
    INSERT INTO public.matches (
      court_id, creator_id, sport, title, date, time, max_players, required_level, status
    ) VALUES (
      NEW.court_id,
      NEW.user_id,
      COALESCE(v_sport, 'Pádel'),
      'Partido en ' || COALESCE(v_court_name, 'Cancha'),
      NEW.date,
      NEW.time_slot::time,
      COALESCE(v_max_players, 4),
      COALESCE(v_user_level, 'Intermedio'),
      'Open'
    ) RETURNING id INTO v_match_id;

    -- Insert creator into match participants table as ACCEPTED
    INSERT INTO public.match_participants (match_id, user_id, status)
    VALUES (v_match_id, NEW.user_id, 'ACCEPTED');

  EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail/rollback the booking insert transaction
    RAISE WARNING 'Failed to create match from booking: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on public.bookings
DROP TRIGGER IF EXISTS trigger_create_match_from_booking ON public.bookings;
CREATE TRIGGER trigger_create_match_from_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_from_booking();


-- 2. Ensure Roberto Arena business owner profile exists (owner of seeded courts)
INSERT INTO public.profiles (
  id, name, age, city, avatar_url, bio, trust_score, matches_played, fitcoins_balance, level,
  preferred_sports, last_location_lat, last_location_lng, user_role, company_name, business_category, is_sponsored, is_admin
) VALUES (
  '00000000-0000-0000-0000-000000000090', 'Roberto Arena', 38, 'Surco', 
  'https://api.dicebear.com/7.x/identicon/svg?seed=Arena', 'Gestión de complejos deportivos de alta gama.', 
  100, 0, 15000, 'Elite', ARRAY[]::text[], -12.148, -77.019, 'BUSINESS', 'SportMatch Arena Surco', 'Canchas', true, false
) ON CONFLICT (id) DO NOTHING;


-- 3. Seeding the 35 Specified Real Venues
INSERT INTO public.courts (
  id, created_at, name, sport, price_per_hour, rating, 
  reviews_count, lat, lng, location, image_url, amenities, is_available, address, owner_id, is_sponsored, max_players, operating_hours
) VALUES
-- --- Santiago de Surco (15 locations) ---
(
  'lima-court-01', now(), 'Padel Center Surco', 'Pádel', 100, 4.7, 98,
  -12.1314, -76.9812, st_setsrid(st_point(-76.9812, -12.1314), 4326)::geography,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
  ARRAY['Estacionamiento', 'Alquiler de Palas', 'Duchas', 'Cafetería'], true,
  'Av. Cerros de Camacho 500, Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']
),
(
  'lima-court-02', now(), 'Deporcentro Casuarinas', 'Fútbol', 160, 4.5, 210,
  -12.1158, -76.9675, st_setsrid(st_point(-76.9675, -12.1158), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pasto Sintético FIFA', 'Vestuarios amplios', 'Estacionamiento', 'Luz de Noche'], true,
  'Av. Jacarandá 850, Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 14,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-03', now(), 'Complejo Municipal Surco', 'Vóley', 50, 4.2, 75,
  -12.1450, -77.0120, st_setsrid(st_point(-77.0120, -12.1450), 4326)::geography,
  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=600',
  ARRAY['Piso de Parquet', 'Tableros Electrónicos', 'Estacionamiento'], true,
  'Av. Caminos del Inca 1800, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-04', now(), 'Soccer City Surco', 'Fútbol', 120, 4.4, 115,
  -12.1280, -76.9850, st_setsrid(st_point(-76.9850, -12.1280), 4326)::geography,
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
  ARRAY['Césped artificial', 'Vestuarios', 'Snack Bar', 'Wifi'], true,
  'Av. Jorge Chávez 120, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-05', now(), 'Alborada Tennis Club', 'Tenis', 80, 4.6, 62,
  -12.1100, -76.9890, st_setsrid(st_point(-76.9890, -12.1100), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas de Arcilla', 'Duchas', 'Profesores Particulares'], true,
  'Av. La Alborada 230, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
),
(
  'lima-court-06', now(), 'Club Germania', 'Running', 40, 4.5, 89,
  -12.1350, -76.9750, st_setsrid(st_point(-76.9750, -12.1350), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Piscina Temperada', 'Pista de Correr', 'Restaurante', 'Sauna'], true,
  'Av. Casuarinas 600, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 20,
  ARRAY['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-07', now(), 'La 10 - Surco', 'Fútbol', 140, 4.3, 143,
  -12.1205, -76.9780, st_setsrid(st_point(-76.9780, -12.1205), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pasto Sintético', 'Gradas Techadas', 'Estacionamiento Vigilado'], true,
  'Av. Primavera 1490, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 14,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-08', now(), 'Padel Rooftop Jockey', 'Pádel', 130, 4.9, 156,
  -12.0880, -76.9720, st_setsrid(st_point(-76.9720, -12.0880), 4326)::geography,
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas Panorámicas', 'Rooftop Bar', 'Tienda Pro Shop', 'Vestuarios Vip'], true,
  'Jockey Plaza (Piso 5), Santiago de Surco', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
),
(
  'lima-court-09', now(), 'Polideportivo Sagitario', 'Básquet', 45, 4.0, 41,
  -12.1550, -76.9950, st_setsrid(st_point(-76.9950, -12.1550), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Luz Led', 'Seguridad', 'Baños Públicos'], true,
  'Calle Las Gaviotas 320, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 10,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-10', now(), 'Vikingos Padel Club', 'Pádel', 110, 4.6, 73,
  -12.1390, -76.9805, st_setsrid(st_point(-76.9805, -12.1390), 4326)::geography,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
  ARRAY['Alquiler de Palas', 'Bebidas e Hidratación', 'Estacionamiento'], true,
  'Av. Caminos del Inca 2500, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']
),
(
  'lima-court-11', now(), 'Gimnasio Smart Fit Surco', 'Running', 25, 4.3, 190,
  -12.1250, -76.9830, st_setsrid(st_point(-76.9830, -12.1250), 4326)::geography,
  'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=600',
  ARRAY['Treadmills Importados', 'Duchas con agua caliente', 'Lockers con contraseña'], true,
  'Av. Benavides 4500, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 30,
  ARRAY['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
),
(
  'lima-court-12', now(), 'Club Monterrico', 'Running', 55, 4.6, 52,
  -12.1020, -76.9650, st_setsrid(st_point(-76.9650, -12.1020), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Piscina Semi-olímpica', 'Zona de Picnic', 'Estacionamiento'], true,
  'Av. Circunvalación del Club Golf Los Incas, Surco', '00000000-0000-0000-0000-000000000090', false, 15,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
),
(
  'lima-court-13', now(), 'Canchas El Gol', 'Fútbol', 90, 4.2, 85,
  -12.1480, -77.0010, st_setsrid(st_point(-77.0010, -12.1480), 4326)::geography,
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
  ARRAY['Luz de Noche', 'Chalecos gratis', 'Estacionamiento'], true,
  'Av. Los Próceres 400, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 10,
  ARRAY['17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-14', now(), 'Surco Vóley Club', 'Vóley', 40, 4.4, 47,
  -12.1320, -76.9920, st_setsrid(st_point(-76.9920, -12.1320), 4326)::geography,
  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pelotas de Vóley gratis', 'Canchas techadas', 'Lockers'], true,
  'Jr. Teodoro Cárdenas 120, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-15', now(), 'Skatepark Surco', 'Running', 0, 4.1, 103,
  -12.1410, -77.0080, st_setsrid(st_point(-77.0080, -12.1410), 4326)::geography,
  'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=600',
  ARRAY['Rampas profesionales', 'Área verde', 'Entrada Libre'], true,
  'Av. Loma Amarilla s/n, Santiago de Surco', '00000000-0000-0000-0000-000000000090', false, 50,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
),

-- --- San Borja & Miraflores (10 locations) ---
(
  'lima-court-16', now(), 'Polideportivo Limatambo', 'Básquet', 60, 4.5, 142,
  -12.1067, -76.9989, st_setsrid(st_point(-76.9989, -12.1067), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas techadas', 'Tableros Acrílicos', 'Duchas', 'Estacionamiento'], true,
  'Av. Malachowski 560, San Borja', '00000000-0000-0000-0000-000000000090', true, 10,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-17', now(), 'Pentagonito (Running Hub)', 'Running', 0, 4.9, 532,
  -12.1010, -76.9950, st_setsrid(st_point(-76.9950, -12.1010), 4326)::geography,
  'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pista atlética', 'Gimnasio al aire libre', 'Seguridad Municipal'], true,
  'Av. San Borja Sur s/n, San Borja', '00000000-0000-0000-0000-000000000090', true, 20,
  ARRAY['06:00', '07:00', '08:00', '09:00', '17:00', '18:00', '19:00', '20:00']
),
(
  'lima-court-18', now(), 'Tennis Club San Borja', 'Tenis', 90, 4.7, 85,
  -12.1030, -77.0010, st_setsrid(st_point(-77.0010, -12.1030), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas de Arcilla', 'Luz Pro', 'Camarines', 'Cafetería'], true,
  'Av. Boulevard de la Nación 300, San Borja', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
),
(
  'lima-court-19', now(), 'Miraflores Padel Club', 'Pádel', 140, 4.9, 215,
  -12.1225, -77.0361, st_setsrid(st_point(-77.0361, -12.1225), 4326)::geography,
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vestuarios', 'Iluminación Led Pro', 'Cafetería Pro', 'Palas Test'], true,
  'Malecón de la Reserva 610, Miraflores', '00000000-0000-0000-0000-000000000090', true, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-20', now(), 'Estadio Manuel Bonilla', 'Vóley', 70, 4.4, 110,
  -12.1150, -77.0420, st_setsrid(st_point(-77.0420, -12.1150), 4326)::geography,
  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=600',
  ARRAY['Coliseo Cerrado', 'Tribunas', 'Estacionamiento', 'Servicios Médicos'], true,
  'Av. El Ejército 1300, Miraflores', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-21', now(), 'Centro Naval San Borja', 'Running', 50, 4.6, 92,
  -12.0950, -76.9920, st_setsrid(st_point(-76.9920, -12.0950), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Piscina Olímpica', 'Vestuarios', 'Restaurante', 'Seguridad Privada'], true,
  'Av. San Luis 2400, San Borja', '00000000-0000-0000-0000-000000000090', false, 15,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00']
),
(
  'lima-court-22', now(), 'Rooftop Tennis Miraflores', 'Tenis', 110, 4.8, 88,
  -12.1280, -77.0290, st_setsrid(st_point(-77.0290, -12.1280), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas Rápidas', 'Vista Panorámica', 'Drinks & Snacks'], true,
  'Calle Cantuarias 350, Miraflores', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-23', now(), 'Complejo Chino Vasquez', 'Vóley', 30, 4.5, 120,
  -12.1350, -77.0380, st_setsrid(st_point(-77.0380, -12.1350), 4326)::geography,
  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vóley Playa', 'Duchas Exteriores', 'Frente al Mar'], true,
  'Playa Los Delfines, Miraflores', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
),
(
  'lima-court-24', now(), 'San Borja Sur Soccer', 'Fútbol', 130, 4.4, 95,
  -12.1120, -76.9900, st_setsrid(st_point(-76.9900, -12.1120), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Fútbol 6', 'Césped Pro', 'Snack Bar', 'Parrillas'], true,
  'Av. San Borja Sur 890, San Borja', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-25', now(), 'Miraflores Skate Park', 'Running', 0, 4.6, 212,
  -12.1200, -77.0450, st_setsrid(st_point(-77.0450, -12.1200), 4326)::geography,
  'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=600',
  ARRAY['Obstáculos Pro', 'Malecón Vista al Mar', 'Entrada Libre'], true,
  'Malecón de la Marina, Miraflores', '00000000-0000-0000-0000-000000000090', false, 50,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
),

-- --- Lince / Magdalena / Jesús María / Lima / San Isidro (10 locations) ---
(
  'lima-court-26', now(), 'Campo de Marte', 'Fútbol', 45, 4.4, 320,
  -12.0680, -77.0410, st_setsrid(st_point(-77.0410, -12.0680), 4326)::geography,
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
  ARRAY['Fútbol 7', 'Césped Sintético', 'Gran Parqueo', 'Duchas'], true,
  'Av. de la Peruanidad s/n, Jesús María', '00000000-0000-0000-0000-000000000090', false, 14,
  ARRAY['17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-27', now(), 'Complejo Huantille', 'Vóley', 55, 4.6, 88,
  -12.0945, -77.0689, st_setsrid(st_point(-77.0689, -12.0945), 4326)::geography,
  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vóley / Básquet', 'Cancha Losa Pintada', 'Iluminación Led'], true,
  'Jr. Huantille 350, Magdalena del Mar', '00000000-0000-0000-0000-000000000090', false, 12,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-28', now(), 'Estadio Nacional (IPD)', 'Running', 20, 4.9, 610,
  -12.0670, -77.0330, st_setsrid(st_point(-77.0330, -12.0670), 4326)::geography,
  'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=600',
  ARRAY['Pista Atlética Profesional', 'Camarines Oficiales', 'Médico en Turno'], true,
  'Calle José Díaz s/n, Lima', '00000000-0000-0000-0000-000000000090', true, 20,
  ARRAY['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
),
(
  'lima-court-29', now(), 'Ymca Perú', 'Running', 60, 4.7, 185,
  -12.0820, -77.0350, st_setsrid(st_point(-77.0350, -12.0820), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Natación', 'Gimnasio de pesas', 'Clases dirigidas', 'Lockers'], true,
  'Av. Bolívar 350, Lince', '00000000-0000-0000-0000-000000000090', false, 15,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00']
),
(
  'lima-court-30', now(), 'Complejo Mariscal Castilla', 'Básquet', 40, 4.3, 76,
  -12.0850, -77.0310, st_setsrid(st_point(-77.0310, -12.0850), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas Losa', 'Baños', 'Kiosko de Refrescos', 'Seguridad Vecinal'], true,
  'Av. Joaquín Madrid s/n, Lince', '00000000-0000-0000-0000-000000000090', false, 10,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-31', now(), 'Magdalena Padel', 'Pádel', 115, 4.6, 94,
  -12.0910, -77.0620, st_setsrid(st_point(-77.0620, -12.0910), 4326)::geography,
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600',
  ARRAY['Vidrio Templado', 'Alquiler de Palas', 'Duchas', 'Parking Gratis'], true,
  'Jr. Alfonso Ugarte 120, Magdalena del Mar', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
),
(
  'lima-court-32', now(), 'Centro Juvenil Lince', 'Fútbol', 85, 4.2, 54,
  -12.0880, -77.0290, st_setsrid(st_point(-77.0290, -12.0880), 4326)::geography,
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  ARRAY['Fútbol 5', 'Césped Sintético', 'Chalecos gratis', 'Baños'], true,
  'Jr. Bernardo Alcedo 400, Lince', '00000000-0000-0000-0000-000000000090', false, 10,
  ARRAY['18:00', '19:00', '20:00', '21:00', '22:00']
),
(
  'lima-court-33', now(), 'Piscina Olímpica', 'Running', 30, 4.8, 147,
  -12.0710, -77.0380, st_setsrid(st_point(-77.0380, -12.0710), 4326)::geography,
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600',
  ARRAY['Piscina Temperada 50m', 'Vestuarios con calefacción', 'Seguridad'], true,
  'Av. Petit Thouars 1200, Lima', '00000000-0000-0000-0000-000000000090', false, 15,
  ARRAY['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
),
(
  'lima-court-34', now(), 'Círculo Militar', 'Tenis', 95, 4.7, 108,
  -12.0780, -77.0450, st_setsrid(st_point(-77.0450, -12.0780), 4326)::geography,
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
  ARRAY['Canchas de Tenis de Arcilla', 'Fútbol Sintético', 'Club House', 'Restaurant'], true,
  'Av. Salaverry 1650, Jesús María', '00000000-0000-0000-0000-000000000090', false, 4,
  ARRAY['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00']
),
(
  'lima-court-35', now(), 'Costa Verde Sports', 'Running', 0, 4.9, 420,
  -12.1050, -77.0550, st_setsrid(st_point(-77.0550, -12.1050), 4326)::geography,
  'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=600',
  ARRAY['Ciclovía Costanera', 'Pista de Running', 'Entrada Libre', 'Vista al Mar'], true,
  'Circuito de Playas, San Isidro', '00000000-0000-0000-0000-000000000090', true, 20,
  ARRAY['05:00', '06:00', '07:00', '08:00', '09:00', '16:00', '17:00', '18:00', '19:00']
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

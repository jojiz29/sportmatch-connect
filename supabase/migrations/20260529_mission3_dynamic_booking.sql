-- Migration: Dynamic Booking Engine, Court Registration & Sports Expansion (Mission 3)

-- 1. Create sports table
CREATE TABLE IF NOT EXISTS public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon_slug text not null,
  default_max_players int not null default 4 check (default_max_players > 0),
  created_at timestamptz default now() not null
);

ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sports' AND policyname = 'sports_public_read'
  ) THEN
    CREATE POLICY "sports_public_read" ON public.sports FOR SELECT USING (true);
  END IF;
END $$;

-- Insert initial sports if they don't exist
INSERT INTO public.sports (id, name, icon_slug, default_max_players) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Pádel', 'paddle', 4),
  ('00000000-0000-0000-0000-000000000002', 'Fútbol', 'football', 10),
  ('00000000-0000-0000-0000-000000000003', 'Tenis', 'tennis', 2),
  ('00000000-0000-0000-0000-000000000004', 'Básquet', 'basketball', 10),
  ('00000000-0000-0000-0000-000000000005', 'Vóley', 'volleyball', 12),
  ('00000000-0000-0000-0000-000000000006', 'Running', 'running', 1)
ON CONFLICT (name) DO UPDATE SET
  icon_slug = excluded.icon_slug,
  default_max_players = excluded.default_max_players;

-- 2. Add columns to courts table
ALTER TABLE public.courts 
  ADD COLUMN IF NOT EXISTS max_players integer default 4 check (max_players > 0),
  ADD COLUMN IF NOT EXISTS operating_hours text[] default ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00'];

-- Update existing courts max_players and operating_hours based on sport type
UPDATE public.courts SET max_players = 4, operating_hours = ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00'] WHERE sport = 'Pádel';
UPDATE public.courts SET max_players = 10, operating_hours = ARRAY['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'] WHERE sport = 'Fútbol';
UPDATE public.courts SET max_players = 2, operating_hours = ARRAY['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30'] WHERE sport = 'Tenis';

-- 3. Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now() not null,
  court_id    uuid references public.courts(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  date        date not null,
  time_slot   text not null,
  unique (court_id, date, time_slot)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_public_read'
  ) THEN
    CREATE POLICY "bookings_public_read" ON public.bookings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_user_insert'
  ) THEN
    CREATE POLICY "bookings_user_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_user_delete'
  ) THEN
    CREATE POLICY "bookings_user_delete" ON public.bookings FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Enable Supabase Realtime for bookings, sports, and courts (adding to publication)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- Add tables if not already in publication
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
    ) then
      alter publication supabase_realtime add table public.bookings;
    end if;

    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sports'
    ) then
      alter publication supabase_realtime add table public.sports;
    end if;

    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'courts'
    ) then
      alter publication supabase_realtime add table public.courts;
    end if;
  end if;
end $$;

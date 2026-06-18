-- ============================================================
-- Migración SQL: 20260619000200_premium_features.sql
-- Propósito: Agregar columna 'tier' a profiles y crear las tablas
--            subscriptions, squad_challenges y premium_nutrition_logs.
-- ============================================================

-- Agregar columna tier a profiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'FREE';

-- Crear tabla public.subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  price_id VARCHAR(255),
  tier VARCHAR(20) DEFAULT 'FREE',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_id_sub UNIQUE (user_id)
);

-- Habilitar RLS en subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Crear tabla public.squad_challenges
CREATE TABLE IF NOT EXISTS public.squad_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  challenged_squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  sport VARCHAR(50) NOT NULL,
  scheduled_date VARCHAR(50) NOT NULL,
  scheduled_time VARCHAR(50) NOT NULL,
  court_id UUID REFERENCES public.courts(id) ON DELETE SET NULL,
  bet_amount INT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  winner_squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en squad_challenges
ALTER TABLE public.squad_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view squad challenges"
  ON public.squad_challenges
  FOR SELECT
  USING (true);

CREATE POLICY "Squad members can insert challenges"
  ON public.squad_challenges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE squad_members.squad_id = challenger_squad_id
        AND squad_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Squad members can update challenges"
  ON public.squad_challenges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE (squad_members.squad_id = challenger_squad_id OR squad_members.squad_id = challenged_squad_id)
        AND squad_members.profile_id = auth.uid()
    )
  );

-- Crear tabla public.premium_nutrition_logs
CREATE TABLE IF NOT EXISTS public.premium_nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  sport VARCHAR(50) NOT NULL,
  duration INT NOT NULL,
  intensity VARCHAR(20) NOT NULL,
  calories_burned INT NOT NULL,
  snack_name VARCHAR(100) NOT NULL,
  snack_image VARCHAR(255),
  calories INT NOT NULL,
  ingredients TEXT[] NOT NULL,
  reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en premium_nutrition_logs
ALTER TABLE public.premium_nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own nutrition logs"
  ON public.premium_nutrition_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
  ON public.premium_nutrition_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recargar esquema PostgREST
NOTIFY pgrst, 'reload schema';

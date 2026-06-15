-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — COMPLETE WALLET SCHEMA & RPCs
-- =====================================================================
-- Fecha: 2026-06-15
-- Issue: Las tablas wallets, rewards, user_rewards y la RPC redeem_reward
--        NUNCA fueron aplicadas a producción. Solo existen los triggers
--        huérfanos que apuntan a tablas inexistentes, lo que causa
--        errores tipo "relation does not exist" o P0001.
--
-- Esta migración crea los objetos faltantes y los conecta con los
-- triggers ya existentes (post-fix-20260615193000).
-- =====================================================================

-- 1. Tabla: wallets (source of truth del saldo)
CREATE TABLE IF NOT EXISTS public.wallets (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  fitcoins_balance INTEGER DEFAULT 0 NOT NULL CHECK (fitcoins_balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "wallets_select_all_authenticated" ON public.wallets;
CREATE POLICY "wallets_select_all_authenticated" ON public.wallets
  FOR SELECT TO authenticated USING (true);

-- 2. Tabla: rewards
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cost_fitcoins INTEGER NOT NULL CHECK (cost_fitcoins >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rewards_public_read" ON public.rewards;
CREATE POLICY "rewards_public_read" ON public.rewards
  FOR SELECT USING (true);

-- 3. Tabla: user_rewards (ledger de canjes)
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_rewards_select_own" ON public.user_rewards;
CREATE POLICY "user_rewards_select_own" ON public.user_rewards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_rewards_insert_own" ON public.user_rewards;
CREATE POLICY "user_rewards_insert_own" ON public.user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Poblar wallets con balances existentes
INSERT INTO public.wallets (profile_id, fitcoins_balance)
SELECT id, COALESCE(fitcoins_balance, 0) FROM public.profiles
ON CONFLICT (profile_id) DO UPDATE SET
  fitcoins_balance = EXCLUDED.fitcoins_balance,
  updated_at = now();

-- 5. Trigger: sync_profile_to_wallet (mantiene wallets sincronizado con profiles)
CREATE OR REPLACE FUNCTION public.sync_profile_to_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (profile_id, fitcoins_balance)
  VALUES (NEW.id, COALESCE(NEW.fitcoins_balance, 0))
  ON CONFLICT (profile_id) DO UPDATE SET
    fitcoins_balance = EXCLUDED.fitcoins_balance,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_profile_to_wallet ON public.profiles;
CREATE TRIGGER trigger_sync_profile_to_wallet
  AFTER INSERT OR UPDATE OF fitcoins_balance ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_profile_to_wallet();

-- 6. RPC: redeem_reward (canje atómico de recompensas)
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INT;
  v_stock INT;
  v_balance INT;
  v_title TEXT;
BEGIN
  -- Obtener detalles de la recompensa
  SELECT cost_fitcoins, stock, title
  INTO v_cost, v_stock, v_title
  FROM public.rewards
  WHERE id = p_reward_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  -- Verificar stock
  IF v_stock <= 0 THEN
    RAISE EXCEPTION 'Reward out of stock';
  END IF;

  -- Verificar saldo en wallets
  SELECT fitcoins_balance INTO v_balance
  FROM public.wallets
  WHERE profile_id = p_user_id;

  IF v_balance IS NULL OR v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient FitCoins balance for this transaction';
  END IF;

  -- Insertar transacción (esto dispara sync_profile_wallet_balance
  -- que actualiza profiles.fitcoins_balance via trusted GUC)
  INSERT INTO public.wallet_transactions (user_id, amount, description, type)
  VALUES (p_user_id, -v_cost, 'Canje: ' || v_title, 'SPEND');

  -- Actualizar stock
  UPDATE public.rewards
  SET stock = stock - 1
  WHERE id = p_reward_id;

  -- Registrar en user_rewards (inmutable)
  INSERT INTO public.user_rewards (user_id, reward_id, claimed_at)
  VALUES (p_user_id, p_reward_id, now());

  RETURN TRUE;
END;
$$;

-- 7. Grants para usuarios autenticados y anónimos
GRANT ALL ON public.wallets TO anon, authenticated;
GRANT ALL ON public.rewards TO anon, authenticated;
GRANT ALL ON public.user_rewards TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 8. Seed de recompensas iniciales (idempotente)
INSERT INTO public.rewards (id, title, description, cost_fitcoins, stock, image_url, category) VALUES
  ('00000000-0000-0000-0000-000000000091', 'Hora gratis de pádel', 'Descuento para una hora de alquiler de cancha de pádel en cualquier complejo afiliado.', 500, 50, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8', 'Canchas'),
  ('00000000-0000-0000-0000-000000000092', 'Powerade Sports Drink', 'Bebida isotónica Powerade de 500ml para recuperar electrolitos.', 50, 100, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97', 'Bebidas'),
  ('00000000-0000-0000-0000-000000000093', 'Pelota oficial', 'Pelota oficial de tenis o fútbol de alta durabilidad.', 800, 25, 'https://images.unsplash.com/photo-1551958219-acbc608c6377', 'Equipamiento'),
  ('00000000-0000-0000-0000-000000000094', 'Camiseta SportMatch', 'Camiseta oficial técnica transpirable de SportMatch.', 1200, 30, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27', 'Ropa')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  cost_fitcoins = EXCLUDED.cost_fitcoins,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

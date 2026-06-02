-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — SERVER-SIDE WALLET VALIDATION & REWARDS SCHEMA
-- =====================================================================

-- 1. Create wallets table referencing public.profiles(id)
CREATE TABLE IF NOT EXISTS public.wallets (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  fitcoins_balance INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = profile_id);

-- Populate wallets table with existing profiles
INSERT INTO public.wallets (profile_id, fitcoins_balance)
SELECT id, fitcoins_balance FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;

-- Trigger to automatically insert a wallet row when a new profile is created
CREATE OR REPLACE FUNCTION public.sync_profile_to_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.wallets (profile_id, fitcoins_balance)
  VALUES (NEW.id, NEW.fitcoins_balance)
  ON CONFLICT (profile_id) DO UPDATE SET
    fitcoins_balance = EXCLUDED.fitcoins_balance;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_profile_to_wallet ON public.profiles;
CREATE TRIGGER trigger_sync_profile_to_wallet
  AFTER INSERT OR UPDATE OF fitcoins_balance ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_profile_to_wallet();

-- Update sync_profile_wallet_balance trigger function (inserts into wallets as well)
CREATE OR REPLACE FUNCTION public.sync_profile_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET fitcoins_balance = fitcoins_balance + NEW.amount
  WHERE id = NEW.user_id;

  INSERT INTO public.wallets (profile_id, fitcoins_balance)
  VALUES (NEW.user_id, NEW.amount)
  ON CONFLICT (profile_id) DO UPDATE SET
    fitcoins_balance = public.wallets.fitcoins_balance + EXCLUDED.fitcoins_balance;

  RETURN NEW;
END;
$$;

-- 2. Create rewards table
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

-- Enable RLS on rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rewards_public_read" ON public.rewards
  FOR SELECT USING (true);

-- 3. Populate rewards table with initial seeded entities
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

-- 4. Create user_rewards junction table
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on user_rewards
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_rewards_select_own" ON public.user_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_rewards_insert_own" ON public.user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Define before insert check triggers for bookings & match_participants
CREATE OR REPLACE FUNCTION public.check_booking_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_court_price NUMERIC;
  v_court_max_players INT;
  v_booking_cost INT;
  v_balance INT;
BEGIN
  -- Get court details
  SELECT price_per_hour, COALESCE(max_players, 4)
  INTO v_court_price, v_court_max_players
  FROM public.courts
  WHERE id::text = NEW.court_id::text;

  IF v_court_price IS NULL THEN
    v_court_price := 0;
  END IF;

  -- Default cost calculation (court price + 3 service fee) / max_players, ceiling
  v_booking_cost := CEIL((v_court_price + 3.0) / v_court_max_players);

  -- Fetch user balance from public.wallets
  SELECT fitcoins_balance INTO v_balance
  FROM public.wallets
  WHERE profile_id = NEW.user_id;

  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  IF v_balance < v_booking_cost THEN
    RAISE EXCEPTION 'Insufficient FitCoins balance for this transaction';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_booking_insert_trigger ON public.bookings;
CREATE TRIGGER before_booking_insert_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_booking_balance();

CREATE OR REPLACE FUNCTION public.check_participant_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match_court_id VARCHAR(100);
  v_match_max_players INT;
  v_court_price NUMERIC;
  v_participant_cost INT;
  v_balance INT;
BEGIN
  -- Get match details
  SELECT court_id, COALESCE(max_players, 4)
  INTO v_match_court_id, v_match_max_players
  FROM public.matches
  WHERE id = NEW.match_id;

  -- Get court details
  SELECT price_per_hour
  INTO v_court_price
  FROM public.courts
  WHERE id::text = v_match_court_id::text;

  IF v_court_price IS NULL THEN
    v_court_price := 0;
  END IF;

  -- Cost of joining match: ceil(court_price / max_players)
  v_participant_cost := CEIL(v_court_price / v_match_max_players);

  -- Fetch user balance from public.wallets
  SELECT fitcoins_balance INTO v_balance
  FROM public.wallets
  WHERE profile_id = NEW.user_id;

  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  IF v_balance < v_participant_cost THEN
    RAISE EXCEPTION 'Insufficient FitCoins balance for this transaction';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_participant_insert_trigger ON public.match_participants;
CREATE TRIGGER before_participant_insert_trigger
  BEFORE INSERT ON public.match_participants
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_participant_balance();

-- 6. Define RPC function redeem_reward to run atomic rewards redemptions
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost INT;
  v_stock INT;
  v_balance INT;
  v_title TEXT;
BEGIN
  -- Get reward details
  SELECT cost_fitcoins, stock, title
  INTO v_cost, v_stock, v_title
  FROM public.rewards
  WHERE id = p_reward_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  -- Check stock
  IF v_stock <= 0 THEN
    RAISE EXCEPTION 'Reward out of stock';
  END IF;

  -- Check wallet balance
  SELECT fitcoins_balance INTO v_balance
  FROM public.wallets
  WHERE profile_id = p_user_id;

  IF v_balance IS NULL OR v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient FitCoins balance for this transaction';
  END IF;

  -- Deduct cost via wallet_transactions ledger row
  INSERT INTO public.wallet_transactions (user_id, amount, description, type)
  VALUES (p_user_id, -v_cost, 'Canje: ' || v_title, 'SPEND');

  -- Update rewards stock
  UPDATE public.rewards
  SET stock = stock - 1
  WHERE id = p_reward_id;

  -- Insert immutable user reward ledger row
  INSERT INTO public.user_rewards (user_id, reward_id, claimed_at)
  VALUES (p_user_id, p_reward_id, now());

  RETURN TRUE;
END;
$$;

-- Grant permissions to anonymous and authenticated users
GRANT ALL ON public.wallets TO anon, authenticated;
GRANT ALL ON public.rewards TO anon, authenticated;
GRANT ALL ON public.user_rewards TO anon, authenticated;

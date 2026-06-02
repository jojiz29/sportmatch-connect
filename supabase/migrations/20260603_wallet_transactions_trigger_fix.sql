-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — WALLET TRANSACTIONS TRIGGER & ACHIEVEMENTS SCHEMA
-- =====================================================================

-- 1. Re-declare sync_profile_wallet_balance function to update profile and wallets
CREATE OR REPLACE FUNCTION public.sync_profile_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profiles table
  UPDATE public.profiles
  SET fitcoins_balance = fitcoins_balance + NEW.amount
  WHERE id = NEW.user_id;

  -- Ensure wallets table is updated/inserted
  INSERT INTO public.wallets (profile_id, fitcoins_balance)
  VALUES (NEW.user_id, NEW.amount)
  ON CONFLICT (profile_id) DO UPDATE SET
    fitcoins_balance = public.wallets.fitcoins_balance + EXCLUDED.fitcoins_balance;

  RETURN NEW;
END;
$$;

-- 2. Bind the trigger to public.wallet_transactions
DROP TRIGGER IF EXISTS on_wallet_transaction_inserted ON public.wallet_transactions;
CREATE TRIGGER on_wallet_transaction_inserted
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_profile_wallet_balance();

-- 3. Create user_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key VARCHAR(100) NOT NULL, -- e.g., 'streak', 'partner', 'mvp', 'top'
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_key)
);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_select_own" ON public.user_achievements;
CREATE POLICY "user_achievements_select_own" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_insert_own" ON public.user_achievements;
CREATE POLICY "user_achievements_insert_own" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant privileges
GRANT ALL ON public.user_achievements TO anon, authenticated;

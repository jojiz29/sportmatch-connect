-- =====================================================================
-- Fix: sync_profile_wallet_balance trigger con INSERT seguro
-- =====================================================================
-- Issue: el INSERT inicial usa NEW.amount que puede ser negativo
--        (SPEND), violando el CHECK >= 0. La intención del trigger
--        es que el ON CONFLICT actualice, pero la fila se intenta
--        insertar primero.
-- Fix: usar 0 en el INSERT inicial (caso edge: el row no existe).
--      El ON CONFLICT es el path normal y maneja la actualización.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marca el siguiente UPDATE como proveniente de un trigger
  -- de confianza. protect_profile_fields() lo detectará y no
  -- bloqueará la operación.
  PERFORM set_config('app.in_trusted_wallet_sync', 'true', true);

  -- Sincronizar profiles.fitcoins_balance
  UPDATE public.profiles
  SET fitcoins_balance = GREATEST(0, fitcoins_balance + NEW.amount)
  WHERE id = NEW.user_id;

  -- Limpiar flag
  PERFORM set_config('app.in_trusted_wallet_sync', 'false', true);

  -- Sincronizar wallets.fitcoins_balance (source of truth)
  -- El INSERT usa 0 como fallback (caso edge: row no existe).
  -- El path normal es ON CONFLICT que suma NEW.amount al balance actual.
  INSERT INTO public.wallets (profile_id, fitcoins_balance)
  VALUES (NEW.user_id, GREATEST(0, NEW.amount))
  ON CONFLICT (profile_id) DO UPDATE SET
    fitcoins_balance = GREATEST(0, public.wallets.fitcoins_balance + EXCLUDED.fitcoins_balance),
    updated_at = now();

  RETURN NEW;
END;
$$;

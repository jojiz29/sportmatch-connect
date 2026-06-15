-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — FIX WALLET PROTECTION TRIGGER CONFLICT
-- =====================================================================
-- Fecha: 2026-06-15
-- Issue: El trigger protect_profile_fields() bloquea updates a
--        profiles.fitcoins_balance que vienen del trigger
--        sync_profile_wallet_balance() (AFTER INSERT en wallet_transactions).
--        Resultado: "Restricción de Seguridad: El saldo de FitCoins no
--        puede ser modificado directamente desde el cliente. (P0001)"
--        al intentar reclamar retos o canjear recompensas.
--
-- Causa raíz: el trigger protect_profile_fields() chequea
--   current_setting('role', true) in ('anon', 'authenticated')
-- El setting 'role' NO cambia cuando se invoca una función
-- SECURITY DEFINER. Por tanto, el trigger detecta el rol del cliente
-- (anon/authenticated) y bloquea el UPDATE.
--
-- Solución: usar un GUC de aplicación (app.in_trusted_wallet_sync)
-- que el trigger de wallet setea antes del UPDATE y el trigger
-- de protección chequea para permitir updates desde contextos
-- confiables (otros triggers SECURITY DEFINER).
-- =====================================================================

-- 1. protect_profile_fields(): permitir updates desde triggers
--    de confianza que setean app.in_trusted_wallet_sync='true'
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  -- Si el cambio viene de un trigger de confianza (wallet sync),
  -- permitirlo sin restricción.
  if coalesce(current_setting('app.in_trusted_wallet_sync', true), 'false') = 'true' then
    return new;
  end if;

  -- Protección estándar contra modificaciones directas del cliente
  if current_setting('role', true) in ('anon', 'authenticated') then
    if old.fitcoins_balance <> new.fitcoins_balance then
      raise exception 'Restricción de Seguridad: El saldo de FitCoins no puede ser modificado directamente desde el cliente.';
    end if;
    if old.trust_score <> new.trust_score then
      raise exception 'Restricción de Seguridad: El Trust Score no puede ser modificado directamente desde el cliente.';
    end if;
    if old.user_role <> new.user_role then
      raise exception 'Restricción de Seguridad: El rol de usuario no puede ser modificado directamente desde el cliente.';
    end if;
    if old.is_admin <> new.is_admin then
      raise exception 'Restricción de Seguridad: Los privilegios de administrador no pueden ser modificados directamente desde el cliente.';
    end if;
  end if;
  return new;
end;
$$;

-- 2. sync_profile_wallet_balance(): setear GUC antes del UPDATE
--    y limpiarlo después para mantener el alcance transaccional.
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
  SET fitcoins_balance = fitcoins_balance + NEW.amount
  WHERE id = NEW.user_id;

  -- Limpiar flag para no afectar updates posteriores en la misma tx
  PERFORM set_config('app.in_trusted_wallet_sync', 'false', true);

  -- Sincronizar wallets.fitcoins_balance (source of truth)
  INSERT INTO public.wallets (profile_id, fitcoins_balance)
  VALUES (NEW.user_id, NEW.amount)
  ON CONFLICT (profile_id) DO UPDATE SET
    fitcoins_balance = public.wallets.fitcoins_balance + EXCLUDED.fitcoins_balance;

  RETURN NEW;
END;
$$;

-- 3. También extender la misma protección a redeem_reward y otros
--    RPCs de wallet que indirectamente disparan protect_profile_fields.
--    (No requieren cambio porque ya pasan por sync_profile_wallet_balance
--    al insertar en wallet_transactions.)

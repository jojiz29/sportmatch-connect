-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — DATABASE STABILIZATION & B2B RPC
-- =====================================================================

-- 1. Re-create search_nearby_courts with correct search_path to support extensions.geography
CREATE OR REPLACE FUNCTION public.search_nearby_courts(
  latitude             numeric,
  longitude            numeric,
  max_distance_meters  numeric default 50000
)
RETURNS TABLE (
  id              varchar(100),
  created_at      timestamptz,
  name            text,
  sport           text,
  price_per_hour  numeric,
  rating          numeric,
  reviews_count   int,
  lat             numeric,
  lng             numeric,
  image_url       text,
  amenities       text[],
  is_available    boolean,
  address         text,
  is_sponsored    boolean,
  distance_km     double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id::varchar(100),
    c.created_at,
    c.name,
    c.sport,
    c.price_per_hour,
    c.rating,
    c.reviews_count,
    c.lat,
    c.lng,
    c.image_url,
    c.amenities,
    c.is_available,
    c.address,
    c.is_sponsored,
    ST_Distance(
      c.location,
      ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography
    ) / 1000.0 AS distance_km
  FROM public.courts c
  WHERE ST_DWithin(
    c.location,
    ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography,
    max_distance_meters
  )
  ORDER BY distance_km ASC;
END;
$$;


-- 2. Create purchase_catalog_item RPC function to perform atomic B2B purchases bypassing client RLS constraints
CREATE OR REPLACE FUNCTION public.purchase_catalog_item(
  p_buyer_id uuid,
  p_item_id varchar(100)
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
  v_business_id uuid;
  v_item_name text;
  v_buyer_balance int;
  v_buyer_name text;
BEGIN
  -- Get item details
  SELECT price, business_id::uuid, name 
  INTO v_price, v_business_id, v_item_name
  FROM public.business_catalog
  WHERE id = p_item_id;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  -- Get buyer details
  SELECT fitcoins_balance, name
  INTO v_buyer_balance, v_buyer_name
  FROM public.profiles
  WHERE id = p_buyer_id;

  IF v_buyer_balance < v_price THEN
    RAISE EXCEPTION 'Saldo insuficiente para esta compra';
  END IF;

  -- Insert spend transaction for buyer
  INSERT INTO public.wallet_transactions (user_id, amount, description, type)
  VALUES (p_buyer_id, -v_price, 'Compra: ' || v_item_name, 'SPEND');

  -- Insert earn transaction for seller
  INSERT INTO public.wallet_transactions (user_id, amount, description, type)
  VALUES (v_business_id, v_price, 'Venta: ' || v_item_name || ' a ' || v_buyer_name, 'EARN');

  RETURN true;
END;
$$;

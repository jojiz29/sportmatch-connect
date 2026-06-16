-- ============================================================
-- MIGRACIÓN: 20260618001000 — RLS + RPCs para tabla followers
-- Sprint V2.1 — Social Graph & Followers
-- ============================================================
-- Objetivo:
--   1. Políticas RLS sobre la tabla `followers` existente
--   2. RPC get_follow_stats(p_user_id) → conteos seguidores/seguidos
--   3. RPC get_follow_suggestions(p_user_id, p_limit, p_sport)
--      → recomienda usuarios por deportes compartidos
-- ============================================================
-- Nomenclatura:
--   follower_id  = quien realiza la acción de seguir
--   following_id = quien es seguido
-- ============================================================

-- ============================================================
-- 1. HABILITAR RLS (si no está ya habilitado)
-- ============================================================
DO $$
BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'followers';
  IF FOUND THEN
    ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================
-- 2. ELIMINAR POLÍTICAS EXISTENTES (idempotencia)
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'followers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.followers', r.policyname);
  END LOOP;
END $$;

-- ============================================================
-- 3. CREAR POLÍTICAS RLS
-- ============================================================

-- POLICY: SELECT — usuarios autenticados pueden ver relaciones de follow
-- (necesario para: conteos, listas de seguidores/seguidos)
CREATE POLICY "followers_select_authenticated" ON public.followers
  FOR SELECT
  TO authenticated
  USING (true);

-- POLICY: INSERT — solo el propio usuario puede seguir a alguien
-- auth.uid() debe coincidir con follower_id
CREATE POLICY "followers_insert_own" ON public.followers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = follower_id::text);

-- POLICY: DELETE — solo el seguidor puede dejar de seguir
CREATE POLICY "followers_delete_own" ON public.followers
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = follower_id::text);

-- ============================================================
-- 4. RPC: get_follow_stats(p_user_id)
-- ============================================================
-- Retorna conteo de seguidores + seguidos para un usuario.
-- SECURITY DEFINER: permite acceso aunque el caller no tenga
-- permisos directos sobre la tabla followers.
-- search_path = public: previene ataques de type confusion.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_follow_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_followers_count integer;
  v_following_count integer;
BEGIN
  SELECT COUNT(*) INTO v_followers_count
  FROM public.followers
  WHERE following_id = p_user_id;

  SELECT COUNT(*) INTO v_following_count
  FROM public.followers
  WHERE follower_id = p_user_id;

  RETURN jsonb_build_object(
    'followers_count', v_followers_count,
    'following_count', v_following_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_follow_stats(uuid) TO authenticated, anon, service_role;

-- ============================================================
-- 5. RPC: get_follow_suggestions(p_user_id, p_limit, p_sport)
-- ============================================================
-- Recomienda usuarios que el usuario aún no sigue, priorizando:
--   1. Coincidencia de deportes (cantidad de deportes en común)
--   2. trust_score descendente
--   3. Excluye al propio usuario
--   4. Excluye perfiles ya seguidos
--   5. Excluye perfiles eliminados (deleted_at IS NOT NULL)
--   6. Filtro opcional por deporte (p_sport)
-- SECURITY DEFINER por la misma razón que arriba.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_follow_suggestions(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_sport text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  avatar_url text,
  bio text,
  preferred_sports text[],
  trust_score integer,
  city text,
  followers_count integer,
  matches_played integer,
  common_sports_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_preferred_sports text[];
BEGIN
  -- Obtener los deportes preferidos del usuario solicitante
  SELECT p.preferred_sports INTO v_user_preferred_sports
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Si el usuario no tiene preferred_sports, usar array vacío
  IF v_user_preferred_sports IS NULL THEN
    v_user_preferred_sports := ARRAY[]::text[];
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.avatar_url,
    p.bio,
    p.preferred_sports,
    p.trust_score,
    p.city,
    COALESCE(fs.followers_count, 0)::integer AS followers_count,
    COALESCE(p.matches_played, 0)::integer AS matches_played,
    (
      SELECT COUNT(*) FROM (
        SELECT unnest(p.preferred_sports)
        INTERSECT
        SELECT unnest(v_user_preferred_sports)
      ) t
    )::integer AS common_sports_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT following_id, COUNT(*) AS followers_count
    FROM public.followers
    GROUP BY following_id
  ) fs ON fs.following_id = p.id
  WHERE p.id != p_user_id
    AND p.deleted_at IS NULL
    -- Excluir usuarios que ya sigue
    AND p.id NOT IN (
      SELECT f.following_id
      FROM public.followers f
      WHERE f.follower_id = p_user_id
    )
    -- Filtro opcional por deporte
    AND (
      p_sport IS NULL
      OR p_sport = ANY(p.preferred_sports)
    )
    -- Solo mostrar perfiles con nombre (onboarding completado)
    AND p.name IS NOT NULL
  ORDER BY
    common_sports_count DESC,
    p.trust_score DESC NULLS LAST,
    p.matches_played DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_follow_suggestions(uuid, integer, text) TO authenticated, anon, service_role;

-- ============================================================
-- 6. ÍNDICE de soporte para las RPCs
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);

-- NOTIFY PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';

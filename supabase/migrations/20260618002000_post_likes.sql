-- ============================================================
-- MIGRACIÓN: 20260618002000 — Post likes
-- Sprint V2.2 (adelantada por eficiencia) — Social Feed
-- ============================================================
-- Objetivo:
--   1. Tabla post_likes con RLS
--   2. Columna desnormalizada likes_count en posts
--   3. RPC toggle_post_like → operación atómica like/unlike
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA post_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_post_likes PRIMARY KEY (post_id, user_id)
);

-- FKs condicionales (no fallan si las tablas referenciadas no existen aún)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'posts') THEN
    -- FK a posts
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_post_likes_post'
    ) THEN
      ALTER TABLE public.post_likes
      ADD CONSTRAINT fk_post_likes_post
        FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- FK a profiles
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_post_likes_user'
    ) THEN
      ALTER TABLE public.post_likes
      ADD CONSTRAINT fk_post_likes_user
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 2. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- ============================================================
-- 3. HABILITAR RLS
-- ============================================================
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_likes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.post_likes', r.policyname);
  END LOOP;
END $$;

-- SELECT: cualquier autenticado puede ver los likes
CREATE POLICY "post_likes_select_authenticated" ON public.post_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo el propio usuario puede dar like
CREATE POLICY "post_likes_insert_own" ON public.post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- DELETE: solo el propio usuario puede quitar su like
CREATE POLICY "post_likes_delete_own" ON public.post_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- ============================================================
-- 4. AÑADIR likes_count a posts (desnormalizado)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'posts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'posts'
        AND column_name = 'likes_count'
    ) THEN
      ALTER TABLE public.posts
      ADD COLUMN likes_count integer NOT NULL DEFAULT 0;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 5. RPC: toggle_post_like(p_post_id)
-- ============================================================
-- Operación atómica: si ya tiene like → unlike, si no → like.
-- Actualiza likes_count en posts desnormalizado.
-- SECURITY DEFINER: usa auth.uid() internamente, funciona
-- tanto desde frontend (PostgREST) como backend.
-- ============================================================
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_already_liked boolean;
  v_likes_count integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verificar si ya dio like
  SELECT EXISTS(
    SELECT 1 FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = v_user_id
  ) INTO v_already_liked;

  IF v_already_liked THEN
    -- UNLIKE
    DELETE FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = v_user_id;

    UPDATE public.posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = p_post_id;
  ELSE
    -- LIKE
    INSERT INTO public.post_likes (post_id, user_id)
    VALUES (p_post_id, v_user_id);

    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = p_post_id;
  END IF;

  SELECT p.likes_count INTO v_likes_count
  FROM public.posts p
  WHERE p.id = p_post_id;

  RETURN jsonb_build_object(
    'liked', NOT v_already_liked,
    'likes_count', COALESCE(v_likes_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_post_like(uuid) TO authenticated, service_role;

-- NOTIFY PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';

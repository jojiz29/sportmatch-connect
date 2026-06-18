-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — SEGURIDAD AVANZADA CON IA
-- =====================================================================
-- Fecha: 2026-06-19
-- Épica: Seguridad Avanzada con IA (Smart Block & Moderación)
--
-- Esta migración añade soporte para:
-- 1. moderation_logs: Registro detallado de decisiones tomadas
--    por el ensemble de modelos de seguridad con IA.
-- 2. user_blocks: Nuevas columnas para control automático
--    y expiración de bloqueos temporales por IA.
-- =====================================================================

-- ============================================================
-- 1. TABLA: moderation_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  context_type TEXT NOT NULL, -- 'mensaje' | 'comentario' | 'perfil'
  ensemble_score INT NOT NULL, -- 0 a 100
  action_recommended TEXT NOT NULL, -- 'allow' | 'warn' | 'block'
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento en búsquedas y auditoría
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_created
  ON public.moderation_logs (user_id, created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad:
-- - Un usuario autenticado solo puede leer sus propios logs de moderación
DROP POLICY IF EXISTS "moderation_logs_read_own" ON public.moderation_logs;
CREATE POLICY "moderation_logs_read_own" ON public.moderation_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- - Permite inserciones automáticas a usuarios autenticados para sus propios logs
DROP POLICY IF EXISTS "moderation_logs_insert_own" ON public.moderation_logs;
CREATE POLICY "moderation_logs_insert_own" ON public.moderation_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. MODIFICAR TABLA: user_blocks
-- ============================================================
-- Agregar columnas opcionales/nuevas para auditoría de IA y expiración
ALTER TABLE public.user_blocks
  ADD COLUMN IF NOT EXISTS ensemble_score INT,
  ADD COLUMN IF NOT EXISTS timestamp_inicio TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS timestamp_fin TIMESTAMPTZ;

-- Índice para búsqueda de bloqueos activos y expiraciones
CREATE INDEX IF NOT EXISTS idx_user_blocks_expiration
  ON public.user_blocks (blocked_id, timestamp_fin DESC);

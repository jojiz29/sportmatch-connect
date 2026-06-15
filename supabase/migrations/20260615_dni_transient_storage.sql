-- ============================================================
-- DNI Transient Storage — consentimiento biométrico + eliminar rutas
-- Las imágenes biométricas no se persisten; solo el consentimiento.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consentimiento_bio TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS dni_document_path,
  DROP COLUMN IF EXISTS dni_selfie_path;

NOTIFY pgrst, 'reload schema';

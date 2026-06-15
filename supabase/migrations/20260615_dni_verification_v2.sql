-- ============================================================
-- DNI Verification 2.0 — Columnas adicionales en profiles
-- + bucket identity-documents (privado, owner-only)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dni_verification_version TEXT,
  ADD COLUMN IF NOT EXISTS dni_document_path TEXT,
  ADD COLUMN IF NOT EXISTS dni_selfie_path TEXT,
  ADD COLUMN IF NOT EXISTS dni_ai_confidence DOUBLE PRECISION;

-- Bucket privado para documentos de identidad (no público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-documents',
  'identity-documents',
  false,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- INSERT: solo el dueño puede subir a su carpeta {user_id}/*
CREATE POLICY "Identity docs upload: owner only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: solo el dueño puede leer sus documentos
CREATE POLICY "Identity docs select: owner only"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: solo el dueño
CREATE POLICY "Identity docs update: owner only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'identity-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: solo el dueño
CREATE POLICY "Identity docs delete: owner only"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Recargar cache PostgREST
NOTIFY pgrst, 'reload schema';

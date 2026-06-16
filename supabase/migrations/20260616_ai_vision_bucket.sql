-- ============================================================
-- AI Vision Bucket — Almacenamiento público temporal
-- Para subir imágenes temporales y ser analizadas por la IA
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-vision',
  'ai-vision',
  true, -- Público para que NestJS pueda descargar la imagen mediante URL
  10485760, -- Límite de 10MB
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas para subir archivos
CREATE POLICY "AI Vision upload: authenticated only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-vision'
);

-- Políticas para seleccionar archivos (público)
CREATE POLICY "AI Vision select: public"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'ai-vision'
);

-- Políticas para eliminar archivos
CREATE POLICY "AI Vision delete: authenticated only"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-vision'
);

-- Recargar cache PostgREST
NOTIFY pgrst, 'reload schema';

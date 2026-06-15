/**
 * Sube una imagen de identidad comprimida a WebP en Supabase Storage.
 * Reutiliza el patrón de IdentityStep / app.profile.index (avatars).
 */
import { supabase } from "@/shared/api/supabase";
import { compressToWebP } from "@/shared/lib/imageUtils";

const IDENTITY_BUCKET = "identity-documents";

export type IdentityImageKind = "document" | "selfie";

export async function uploadIdentityImage(
  userId: string,
  file: File,
  kind: IdentityImageKind,
): Promise<string> {
  const webpBlob = await compressToWebP(file, kind === "document" ? 1200 : 800, 0.85);
  const suffix = kind === "document" ? "dni-front" : "selfie";
  const filePath = `${userId}/${suffix}_${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(IDENTITY_BUCKET)
    .upload(filePath, webpBlob, { contentType: "image/webp", upsert: true });

  if (uploadError) throw uploadError;
  return filePath;
}

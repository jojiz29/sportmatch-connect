/**
 * ===================================================================
 * ARCHIVO: src/shared/lib/imageUtils.ts
 * PROPÓSITO: Utilidades de compresión de imágenes y selección de
 *            imágenes fallback por deporte.
 * INCLUYE:
 *   - compressToWebP(): Comprime imágenes usando Canvas API a WebP
 *   - getSportFallbackImage(): Retorna URL de imagen por defecto
 *     según el deporte
 * ===================================================================
 */

// ==============================================================
// COMPRESIÓN DE IMÁGENES (Canvas API)
// ==============================================================
/**
 * compressToWebP(): Comprime un archivo de imagen a formato WebP
 * ------------------------------------------------------------------
 * Usa el Canvas API del navegador para redimensionar y comprimir
 * imágenes sin dependencias externas.
 *
 * @param file     - Archivo de imagen original (File)
 * @param maxWidth - Ancho máximo en píxeles (default: 400)
 * @param quality  - Calidad WebP entre 0 y 1 (default: 0.8)
 * @returns Promise<Blob> - Blob comprimido en formato WebP
 */
export function compressToWebP(file: File, maxWidth = 400, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calcula dimensiones escaladas manteniendo relación de aspecto
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }

      // Dibuja la imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convierte a WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob returned null"));
          }
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = objectUrl;
  });
}

// ==============================================================
// IMÁGENES FALLBACK POR DEPORTE
// ==============================================================
// Mapa de deporte -> ruta de imagen predeterminada
// Se usa cuando una cancha o perfil no tiene imagen propia.
const SPORT_FALLBACK_IMAGES: Record<string, string> = {
  futbol: "/images/sports/futbol.jpg",
  basquet: "/images/sports/basquet.jpg",
  voley: "/images/sports/voley.jpg",
  padel: "/images/sports/padel.jpg",
  natacion: "/images/sports/natacion.jpg",
  gimnasio: "/images/sports/gimnasio.jpg",
  running: "/images/sports/running.jpg",
  tenis: "/images/sports/tenis.jpg",
  default: "/images/sports/default.jpg",
};

/**
 * getSportFallbackImage(): Retorna imagen predeterminada según deporte
 * ------------------------------------------------------------------
 * Normaliza el nombre del deporte (quita acentos, minúsculas) y
 * busca coincidencias parciales. Si no encuentra, retorna default.
 *
 * @param sport - Nombre del deporte (ej: "Pádel", "Fútbol")
 * @returns Ruta de la imagen fallback
 */
export function getSportFallbackImage(sport?: string): string {
  if (!sport) return SPORT_FALLBACK_IMAGES.default;

  const cleaned = sport
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Elimina acentos (ej: "Pádel" -> "padel")

  if (cleaned.includes("futbol") || cleaned.includes("futsal")) return SPORT_FALLBACK_IMAGES.futbol;
  if (cleaned.includes("basquet")) return SPORT_FALLBACK_IMAGES.basquet;
  if (cleaned.includes("voley")) return SPORT_FALLBACK_IMAGES.voley;
  if (cleaned.includes("padel")) return SPORT_FALLBACK_IMAGES.padel;
  if (cleaned.includes("natacion")) return SPORT_FALLBACK_IMAGES.natacion;
  if (cleaned.includes("gimnasio") || cleaned.includes("funcional"))
    return SPORT_FALLBACK_IMAGES.gimnasio;
  if (cleaned.includes("running") || cleaned.includes("atletismo"))
    return SPORT_FALLBACK_IMAGES.running;
  if (cleaned.includes("tenis")) return SPORT_FALLBACK_IMAGES.tenis;

  return SPORT_FALLBACK_IMAGES.default;
}

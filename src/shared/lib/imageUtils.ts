/**
 * src/shared/lib/imageUtils.ts
 * Zero-dependency HTML5 Canvas image compression utility.
 * Resizes images to a maximum width and converts them to WebP format.
 */

/**
 * Compresses a File using the browser's Canvas API.
 * @param file     - The input image File (any browser-supported format).
 * @param maxWidth - Maximum output width in pixels. Default: 400.
 * @param quality  - WebP quality between 0 and 1. Default: 0.8.
 * @returns        - A Promise resolving to a compressed WebP Blob.
 */
export function compressToWebP(file: File, maxWidth = 400, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate scaled dimensions keeping aspect ratio
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

      // Draw the image scaled
      ctx.drawImage(img, 0, 0, width, height);

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

export function getSportFallbackImage(sport?: string): string {
  if (!sport) return SPORT_FALLBACK_IMAGES.default;
  const cleaned = sport
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove accents like ú, á, é

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

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

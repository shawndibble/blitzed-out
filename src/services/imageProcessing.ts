// Re-encodes uploaded images to drop embedded metadata (EXIF, including GPS location).

const FORMAT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const JPEG_QUALITY = 0.92;

/**
 * Re-encodes a base64 image through a canvas, which discards EXIF/metadata such as
 * GPS coordinates. Animated/unsupported formats (e.g. gif) are passed through untouched
 * so we never flatten animation or silently change the encoding away from the stored
 * file extension. Any failure resolves with the original data — stripping is best-effort
 * and must never block an upload.
 *
 * @param base64String bare base64 payload (no `data:` prefix), as Capacitor Camera returns
 * @param format the image format/extension (jpeg, png, webp, ...)
 * @returns bare base64 payload, stripped when possible, original otherwise
 */
export function stripImageMetadata(base64String: string, format: string): Promise<string> {
  const mime = FORMAT_MIME[format?.toLowerCase()];
  if (!base64String || !mime) {
    return Promise.resolve(base64String);
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx || !canvas.width || !canvas.height) {
            resolve(base64String);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const stripped = canvas.toDataURL(mime, JPEG_QUALITY).split(',')[1];
          resolve(stripped || base64String);
        } catch {
          resolve(base64String);
        }
      };
      img.onerror = () => resolve(base64String);
      img.src = `data:${mime};base64,${base64String}`;
    } catch {
      resolve(base64String);
    }
  });
}

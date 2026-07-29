/* Hallmark · locked system applied (Taller) · src/lib/image/resize.ts
 * Client-side image resize before upload. Keeps Server Action bodies under
 * the 1 MB default limit by downsizing oversized photos on the browser.
 *
 * Strategy: keep iterating (smaller dimensions, lower quality) until the
 * result is under `maxBytes`. Most phone photos of product packaging fit
 * under 800 KB after one pass at 1600 px / JPEG q=0.85.
 */

const DEFAULT_MAX_SIDE = 1600;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_MAX_BYTES = 900_000; // stay safely under 1 MB

type ResizeOptions = {
  maxSide?: number;
  quality?: number;
  maxBytes?: number;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = url;
  });
}

function fitInside(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  if (width <= maxSide && height <= maxSide) {
    return { width, height };
  }
  if (width >= height) {
    return { width: maxSide, height: Math.round((height * maxSide) / width) };
  }
  return { width: Math.round((width * maxSide) / height), height: maxSide };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function replaceExt(name: string, newExt: string): string {
  return name.replace(/\.[^.]+$/, `.${newExt}`);
}

/**
 * Resize an image File to fit within `maxSide` and stay under `maxBytes`.
 * Returns the original file if it's already small enough.
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (file.size <= maxBytes) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    // Iterate: try a few (maxSide, quality) combos until the result fits.
    const presets: Array<{ maxSide: number; quality: number }> = [
      { maxSide: options.maxSide ?? DEFAULT_MAX_SIDE, quality: options.quality ?? DEFAULT_QUALITY },
      { maxSide: 1280, quality: 0.8 },
      { maxSide: 1024, quality: 0.75 },
      { maxSide: 800, quality: 0.7 },
    ];

    let bestBlob: Blob | null = null;
    for (const preset of presets) {
      const { width, height } = fitInside(
        img.naturalWidth,
        img.naturalHeight,
        preset.maxSide,
      );
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await canvasToBlob(
        canvas,
        "image/jpeg",
        preset.quality,
      );
      if (!blob) continue;
      if (blob.size <= maxBytes) {
        bestBlob = blob;
        break;
      }
      // Keep the smallest one we've seen so far as a fallback.
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }
    }

    if (!bestBlob) return file; // Could not compress — return original.

    return new File(
      [bestBlob],
      replaceExt(file.name, "jpg"),
      { type: "image/jpeg", lastModified: Date.now() },
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
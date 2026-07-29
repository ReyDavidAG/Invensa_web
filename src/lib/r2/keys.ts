/* Hallmark · locked system applied · src/lib/r2/keys.ts
 * Helpers to build deterministic, safe object keys for R2.
 * UUIDv4 prevents collisions and avoids leaking product codes in URLs.
 */

import { randomUUID } from "node:crypto";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

export type BuildProductKeyInput = {
  productId?: string;
  filename: string;
};

export function buildProductKey(input: BuildProductKeyInput): string {
  const rawExt = input.filename.split(".").pop()?.toLowerCase() ?? "";
  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Unsupported file extension: ${rawExt || "(none)"}`);
  }
  const folder = input.productId
    ? input.productId
    : `tmp/${new Date().toISOString().slice(0, 10)}`;
  return `products/${folder}/${randomUUID()}.${ext}`;
}

export function publicUrlFor(key: string, publicBase: string): string {
  const trimmedBase = publicBase.replace(/\/$/, "");
  return `${trimmedBase}/${key}`;
}
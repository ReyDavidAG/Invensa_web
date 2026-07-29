"use server";

/* Hallmark · locked system applied · src/app/actions/storage.ts
 * Server Actions for product image uploads to Cloudflare R2. The browser
 * calls `requestProductImageUploadAction` to get a presigned PUT URL, then
 * uploads the file directly to R2. Once the PUT succeeds, the form save
 * persists the public URL via `createProductAction` / `updateProductAction`.
 *
 * The action only issues the URL — it does NOT touch the database. That keeps
 * this file independent of the products module while reusing the admin guard.
 */

import { requireAdmin } from "@/app/actions/_guards";
import { getServerEnv } from "@/lib/env";
import { buildProductKey, publicUrlFor } from "@/lib/r2/keys";
import { buildPutObjectUrl } from "@/lib/r2/presign";
import { presignRequestSchema } from "@/lib/schemas/upload";

export type PresignActionResult =
  | {
      ok: true;
      uploadUrl: string;
      publicUrl: string;
      key: string;
      expiresIn: number;
    }
  | { ok: false; error: string };

export async function requestProductImageUploadAction(
  _state: unknown,
  formData: FormData,
): Promise<PresignActionResult> {
  const auth = await requireAdmin({ actionLabel: "subir imágenes" });
  if ("ok" in auth) return auth;

  const parsed = presignRequestSchema.safeParse({
    contentType: formData.get("contentType"),
    contentLength: formData.get("contentLength"),
    filename: formData.get("filename"),
    productId: formData.get("productId") || undefined,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { ok: false, error: first };
  }

  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_R2_PUBLIC_URL) {
    return {
      ok: false,
      error: "El almacenamiento de imágenes no está configurado.",
    };
  }

  const key = buildProductKey({
    productId: parsed.data.productId || undefined,
    filename: parsed.data.filename,
  });

  const presigned = await buildPutObjectUrl({
    key,
    contentType: parsed.data.contentType,
    contentLength: parsed.data.contentLength,
  });

  return {
    ok: true,
    uploadUrl: presigned.url,
    publicUrl: publicUrlFor(key, env.NEXT_PUBLIC_R2_PUBLIC_URL),
    key,
    expiresIn: presigned.expiresIn,
  };
}
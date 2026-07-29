"use server";

import { requireAdmin } from "@/app/actions/_guards";
import { getServerEnv } from "@/lib/env";
import { buildProductKey, buildPutObjectUrl } from "@/lib/r2";
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
    publicUrl: `${env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`,
    key,
    expiresIn: presigned.expiresIn,
  };
}

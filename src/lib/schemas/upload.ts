/* Hallmark · locked system applied · src/lib/schemas/upload.ts
 * Zod schema for presigned upload requests. Mirrors the client-side checks in
 * the dropzone so a tampered request can't sneak past validation.
 */

import { z } from "zod";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const presignRequestSchema = z.object({
  contentType: z
    .string()
    .refine((m) => ALLOWED_MIME.has(m), "Tipo de imagen no soportado"),
  contentLength: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_BYTES, "La imagen pesa más de 5 MB"),
  filename: z.string().trim().min(1, "Falta el nombre del archivo").max(120),
  productId: z
    .string()
    .uuid("Identificador de producto inválido")
    .optional()
    .or(z.literal("")),
});

export type PresignRequestInput = z.input<typeof presignRequestSchema>;
export type PresignRequest = z.output<typeof presignRequestSchema>;
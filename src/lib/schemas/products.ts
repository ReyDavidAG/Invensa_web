/* Hallmark · locked system applied · src/lib/schemas/products.ts
 * Zod schemas for the products module. Server Actions re-validate with the
 * same schema; client forms use zodResolver via @hookform/resolvers.
 */

import { z } from "zod";

export const productCreateSchema = z.object({
  code: z.string().trim().min(1, "Requerido").max(64, "Máximo 64 caracteres"),
  name: z.string().trim().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  categoryId: z.string().uuid("Selecciona una categoría"),
  unitId: z.string().uuid("Selecciona una unidad"),
  priceSale: z.coerce.number().min(0, "Debe ser ≥ 0"),
  priceBuy: z.coerce.number().min(0, "Debe ser ≥ 0"),
  stockLowThreshold: z.coerce.number().min(0, "Debe ser ≥ 0").default(5),
  initialStock: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),
  imageUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductCreateFormValues = z.input<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductUpdateFormValues = z.input<typeof productUpdateSchema>;

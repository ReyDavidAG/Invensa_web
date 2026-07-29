import { z } from "zod";

export const BULK_CSV_COLUMNS = [
  "Código",
  "Nombre",
  "Categoría",
  "Unidad",
  "Precio compra",
  "Precio venta",
  "Stock inicial",
  "Umbral",
] as const;

export type BulkCsvColumn = (typeof BULK_CSV_COLUMNS)[number];

export const bulkCsvRowSchema = z.object({
  code: z.string().trim().min(1, "Requerido").max(64, "Máximo 64 caracteres"),
  name: z.string().trim().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  categoryName: z.string().trim().min(1, "Requerido"),
  unitCode: z.string().trim().min(1, "Requerido"),
  priceBuy: z.coerce.number().min(0, "Debe ser ≥ 0"),
  priceSale: z.coerce.number().min(0, "Debe ser ≥ 0"),
  initialStock: z.coerce.number().min(0, "Debe ser ≥ 0").default(0),
  stockLowThreshold: z.coerce.number().min(0, "Debe ser ≥ 0").default(5),
});

export type BulkCsvRow = z.infer<typeof bulkCsvRowSchema>;

/** Header row from the pasted CSV. Empty string if not provided. */
export const bulkCsvHeaderRowSchema = z
  .array(z.string())
  .length(BULK_CSV_COLUMNS.length);

export type BulkCsvHeaderRow = z.infer<typeof bulkCsvHeaderRowSchema>;

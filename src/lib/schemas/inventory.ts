/* Hallmark · locked system applied · src/lib/schemas/inventory.ts
 * Zod schema for manual inventory movements. Used by the "+ Movimiento"
 * dialog and the initial-stock path on product create.
 *
 * The action interprets movementType semantically:
 *  - "in" / "out" → write to `quantity` (positive magnitude)
 *  - "adjustment" → write to `quantity_adj` (signed delta)
 * This matches the CHECK constraint in supabase/migrations/0003_sales.sql.
 */

import { z } from "zod";

export const inventoryMovementCreateSchema = z.object({
  productId: z.string().uuid("Producto inválido"),
  movementType: z.enum(["in", "out", "adjustment"], {
    message: "Tipo requerido",
  }),
  quantity: z.coerce.number().refine((n) => n > 0, {
    message: "Cantidad debe ser > 0",
  }),
  note: z
    .string()
    .trim()
    .max(250, "Máximo 250 caracteres")
    .optional()
    .or(z.literal("")),
});

export type InventoryMovementCreateInput = z.infer<
  typeof inventoryMovementCreateSchema
>;
export type InventoryMovementCreateFormValues = z.input<
  typeof inventoryMovementCreateSchema
>;
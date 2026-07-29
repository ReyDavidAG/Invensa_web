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

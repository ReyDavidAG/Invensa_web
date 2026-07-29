/* Hallmark · locked system applied (Taller) · src/lib/schemas/sales.ts
 * Zod schemas for the sales module. The same schema validates on both the
 * client (zodResolver) and the server (safeParse inside createSaleAction).
 *
 * Numeric inputs come from <input type="number"> which always sends strings,
 * so coerce is used everywhere. The output type matches what the server
 * inserts (decimal columns).
 */

import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().uuid("Producto inválido"),
  quantity: z.coerce.number().positive("Cantidad debe ser > 0"),
  unitPrice: z.coerce.number().min(0, "Precio debe ser ≥ 0"),
});

export const saleItemFormSchema = saleItemSchema;
export type SaleItemInput = z.infer<typeof saleItemSchema>;

export const saleCreateSchema = z
  .object({
    clientId: z.string().uuid("Cliente inválido").nullable().optional(),
    paymentMethod: z.enum(["cash", "transfer", "mixed"], {
      message: "Método de pago requerido",
    }),
    status: z.enum(["paid", "credit"], {
      message: "Estado requerido",
    }),
    paidAmount: z.coerce.number().min(0, "Monto pagado ≥ 0"),
    notes: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .or(z.literal("")),
    items: z.array(saleItemSchema).min(1, "Agrega al menos un producto"),
  })
  .refine((data) => data.status !== "credit" || data.clientId != null, {
    message: "Selecciona un cliente para registrar un fiado",
    path: ["clientId"],
  });

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
export type SaleCreateFormValues = z.input<typeof saleCreateSchema>;

/* Hallmark · locked system applied (Taller) · src/lib/schemas/customers.ts
 * Zod schemas for the customers module. Same schema validates on both the
 * client (zodResolver) and the server (safeParse inside the action).
 *
 * The customers module is intentionally simple right now — name is
 * required, everything else is optional (a fiado client may not have an
 * email yet). Validation runs per-field with Spanish copy.
 */

import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  phone: z
    .string()
    .trim()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(250, "Máximo 250 caracteres")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerCreateFormValues = z.input<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerUpdateFormValues = z.input<typeof customerUpdateSchema>;

/* Hallmark · locked system applied · src/lib/schemas/ai-product.ts
 * Zod schema for the structured output the AI returns when extracting
 * product fields from a photo. Every field is nullable — the AI may not
 * be confident in all of them.
 */

import { z } from "zod";

export const aiProductParsedSchema = z.object({
  name: z.string().trim().max(160).nullable(),
  code: z.string().trim().max(64).nullable(),
  unitCode: z
    .string()
    .trim()
    .max(16)
    .nullable()
    .describe("Suggested unit code: PZA, L, KG, ML, etc."),
  priceSale: z.number().nonnegative().nullable(),
  priceBuy: z.number().nonnegative().nullable(),
  categoryName: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .describe("e.g. 'Limpieza', 'Refacciones'"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("0-1; overall confidence in the extracted fields"),
});

export type AiProductParsed = z.infer<typeof aiProductParsedSchema>;
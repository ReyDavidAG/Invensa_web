import { z } from "zod";

// AI text-suggest schema. The user-supplied description may include prices
// and quantities ("lo compro en 10, vendo en 16, tengo 10 piezas") — we
// extract those too. But the IA does NOT invent them: every numeric field
// is null unless the user said it.

export const aiProductTextSuggestionSchema = z.object({
  name: z
    .string()
    .trim()
    .max(160)
    .nullable()
    .describe("Commercial name as it would appear on the shelf."),
  categoryName: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .describe("Exact name from the existing categories list, if any match."),
  unitCode: z
    .string()
    .trim()
    .max(16)
    .nullable()
    .describe(
      "Code from the existing units list: PZA, KG, G, L, ML, M, PAQ, CAJA, BOLSA.",
    ),
  priceBuy: z
    .number()
    .nonnegative()
    .nullable()
    .describe(
      "Cost price the user mentioned, e.g. 10 for 'lo compro en 10'. Null if not stated.",
    ),
  priceSale: z
    .number()
    .nonnegative()
    .nullable()
    .describe(
      "Sale price the user mentioned, e.g. 16 for 'lo vendo en 16'. Null if not stated.",
    ),
  initialStock: z
    .number()
    .nonnegative()
    .nullable()
    .describe(
      "Units in stock the user mentioned, e.g. 10 for 'tengo 10 piezas'. Null if not stated.",
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("0-1; overall confidence in the suggestions."),
});

export type AiProductTextSuggestion = z.infer<
  typeof aiProductTextSuggestionSchema
>;

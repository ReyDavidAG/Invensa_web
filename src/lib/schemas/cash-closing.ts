import { z } from "zod";

export const cashClosingCloseSchema = z.object({
  countedCash: z
    .number({ message: "Monto requerido" })
    .min(0, "Monto debe ser ≥ 0"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type CashClosingCloseInput = z.infer<typeof cashClosingCloseSchema>;

export type CashClosingRow = {
  id: string;
  date: string;
  opened_at: string;
  closed_at: string | null;
  expected_cash: number;
  counted_cash: number | null;
  diff: number | null;
  notes: string | null;
  closed_by: string | null;
  status: "open" | "closed";
};

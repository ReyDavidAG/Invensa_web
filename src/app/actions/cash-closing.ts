"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { todayMexicoISODate } from "@/lib/datetime";
import {
  type CashClosingRow,
  cashClosingCloseSchema,
} from "@/lib/schemas/cash-closing";

export type CashClosingActionResult =
  | { ok: true; row: CashClosingRow }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireUser(): Promise<
  { userId: string } | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }
  return { userId: user.id };
}

async function computeExpectedCash(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("vw_cash_sales_by_day")
    .select("net_cash")
    .eq("sale_date", date)
    .maybeSingle();
  if (error) return 0;
  return Number(data?.net_cash ?? 0);
}

async function loadOrOpen(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string,
  date: string,
): Promise<CashClosingRow> {
  const { data: existing } = await supabase
    .from("cash_closings")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (existing) return existing as CashClosingRow;

  const expected = await computeExpectedCash(supabase, date);
  const { data: inserted, error } = await supabase
    .from("cash_closings")
    .insert({
      date,
      expected_cash: expected,
      status: "open",
      opened_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !inserted) {
    throw new Error(`No se pudo abrir el cierre: ${error?.message ?? "error"}`);
  }
  return inserted as CashClosingRow;
}

export async function getTodayCashClosingAction(): Promise<{
  ok: boolean;
  row?: CashClosingRow;
  error?: string;
}> {
  const auth = await requireUser();
  if ("ok" in auth) return auth;
  const supabase = await getSupabaseServer();
  const date = todayMexicoISODate();
  try {
    const row = await loadOrOpen(supabase, auth.userId, date);
    return { ok: true, row };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function closeCashAction(
  _state: unknown,
  formData: FormData,
): Promise<CashClosingActionResult> {
  const auth = await requireUser();
  if ("ok" in auth) return auth;

  // FormData values are always strings; coerce countedCash to number for the
  // shared schema (which expects a number). Empty string → 0 (counts as
  // "nothing in the drawer", which is valid).
  const countedRaw = formData.get("countedCash");
  const countedCash = countedRaw == null ? 0 : Number(countedRaw);
  const parsed = cashClosingCloseSchema.safeParse({
    countedCash: Number.isFinite(countedCash) ? countedCash : 0,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await getSupabaseServer();
  const date = todayMexicoISODate();
  const open = await loadOrOpen(supabase, auth.userId, date);

  if (open.status === "closed") {
    return {
      ok: false,
      error: `La caja del ${date} ya está cerrada.`,
    };
  }

  // Recompute expected at close time so late sales are included.
  const expected = await computeExpectedCash(supabase, date);

  const { data: updated, error } = await supabase
    .from("cash_closings")
    .update({
      counted_cash: parsed.data.countedCash,
      notes: parsed.data.notes?.trim() || null,
      expected_cash: expected,
      closed_at: new Date().toISOString(),
      closed_by: auth.userId,
      status: "closed",
    })
    .eq("id", open.id)
    .select("*")
    .single();

  if (error || !updated) {
    return {
      ok: false,
      error: `No se pudo cerrar la caja: ${error?.message ?? "error"}`,
    };
  }

  revalidatePath("/cash-closing");
  revalidatePath("/dashboard");
  return { ok: true, row: updated as CashClosingRow };
}

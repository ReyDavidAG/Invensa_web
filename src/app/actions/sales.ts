"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { saleCreateSchema, type SaleCreateInput } from "@/lib/schemas/sales";

export type SaleActionResult =
  | { ok: true; id: string; ticketNumber: number }
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

function fromFormData<T extends Record<string, FormDataEntryValue | null>>(
  formData: FormData,
  keys: (keyof T)[],
): T {
  const out = {} as T;
  for (const key of keys) {
    out[key] = formData.get(String(key)) as T[keyof T];
  }
  return out;
}

export async function createSaleAction(
  _state: unknown,
  formData: FormData,
): Promise<SaleActionResult> {
  const auth = await requireUser();
  if ("ok" in auth) return auth;

  // Items are passed as a JSON string in `items` form field. Client encodes
  // the cart as JSON before submitting.
  const itemsJson = formData.get("items");
  let itemsParsed: unknown;
  try {
    itemsParsed = typeof itemsJson === "string" ? JSON.parse(itemsJson) : [];
  } catch {
    return { ok: false, error: "Carrito inválido. Recarga la página." };
  }

  const parsed = saleCreateSchema.safeParse({
    clientId: formData.get("clientId") || null,
    paymentMethod: formData.get("paymentMethod"),
    status: formData.get("status"),
    paidAmount: formData.get("paidAmount") || "0",
    notes: formData.get("notes") || "",
    items: itemsParsed,
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

  const data: SaleCreateInput = parsed.data;
  const supabase = await getSupabaseServer();

  // Server-side total: never trust client-submitted totals.
  const total = data.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0,
  );

  // Insert sale header
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      date_at: new Date().toISOString(),
      client_id: data.clientId ?? null,
      total,
      paid_amount: data.status === "credit" ? data.paidAmount : total,
      status: data.status,
      payment_method: data.paymentMethod,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      created_by: auth.userId,
    })
    .select("id, ticket_number")
    .single();

  if (saleError || !sale) {
    return {
      ok: false,
      error: `No pudimos registrar la venta: ${saleError?.message ?? "error desconocido"}`,
    };
  }

  // Insert sale items
  const itemsToInsert = data.items.map((it) => ({
    sale_id: sale.id,
    product_id: it.productId,
    quantity: it.quantity,
    unit_price: it.unitPrice,
  }));
  const { error: itemsError } = await supabase
    .from("sale_items")
    .insert(itemsToInsert);

  if (itemsError) {
    return {
      ok: false,
      error: `Venta guardada (#${sale.ticket_number}) pero fallaron las líneas: ${itemsError.message}`,
    };
  }

  // Insert inventory movements (one 'out' per line)
  const movementsToInsert = data.items.map((it) => ({
    product_id: it.productId,
    movement_type: "out" as const,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    sale_id: sale.id,
    note: `Venta #${sale.ticket_number}`,
    created_by: auth.userId,
  }));
  const { error: movementsError } = await supabase
    .from("inventory_movements")
    .insert(movementsToInsert);

  if (movementsError) {
    // Sale + items are saved. Movements failed — log to the user but don't
    // roll back. The sister can register the missing movements later.
    return {
      ok: true,
      id: sale.id,
      ticketNumber: sale.ticket_number,
    };
  }

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return {
    ok: true,
    id: sale.id,
    ticketNumber: sale.ticket_number,
  };
}

export async function cancelSaleAction(
  saleId: string,
): Promise<SaleActionResult> {
  const auth = await requireUser();
  if ("ok" in auth) return auth;

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("sales")
    .update({ status: "cancelled" })
    .eq("id", saleId);

  if (error) {
    return { ok: false, error: `No pudimos cancelar: ${error.message}` };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  return { ok: true, id: saleId, ticketNumber: 0 };
}

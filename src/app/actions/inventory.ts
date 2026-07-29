"use server";

/* Hallmark · locked system applied · src/app/actions/inventory.ts
 * Server Action for manual inventory movements (entradas, salidas,
 * ajustes). Used by the "+ Movimiento" dialog on the product detail page.
 *
 * Role gate: any authenticated user (admin + employee). RLS enforces that
 * `created_by = auth.uid()` so users can only log movements under their own
 * name.
 */

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { inventoryMovementCreateSchema } from "@/lib/schemas/inventory";

export type InventoryMovementActionResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

async function requireUser(): Promise<
  { userId: string } | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: "Tu sesión expiró. Vuelve a iniciar sesión.",
    };
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

export async function createInventoryMovementAction(
  _state: unknown,
  formData: FormData,
): Promise<InventoryMovementActionResult> {
  const auth = await requireUser();
  if ("ok" in auth) return auth;

  const parsed = inventoryMovementCreateSchema.safeParse(
    fromFormData(formData, ["productId", "movementType", "quantity", "note"]),
  );
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
  const baseRow = {
    product_id: parsed.data.productId,
    note: parsed.data.note?.trim() || null,
    created_by: auth.userId,
  };

  // The two shapes satisfy the CHECK constraint in 0003_sales.sql:
  //   in / out       → quantity (positive)
  //   adjustment     → quantity_adj (signed)
  // We insert inside each branch so Supabase's generated InsertInput narrows
  // without needing a cast.
  const { data, error } = await (parsed.data.movementType === "adjustment"
    ? supabase
        .from("inventory_movements")
        .insert({
          ...baseRow,
          movement_type: "adjustment" as const,
          quantity_adj: parsed.data.quantity,
        })
        .select("id")
        .single()
    : supabase
        .from("inventory_movements")
        .insert({
          ...baseRow,
          movement_type: parsed.data.movementType,
          quantity: parsed.data.quantity,
        })
        .select("id")
        .single());

  if (error || !data) {
    return {
      ok: false,
      error: `No pudimos registrar el movimiento: ${error?.message ?? "error desconocido"}`,
    };
  }

  revalidatePath(`/products/${parsed.data.productId}`);
  revalidatePath("/products");
  revalidatePath("/reports");
  revalidatePath("/dashboard");

  return { ok: true, id: data.id as string };
}

export type BulkInventoryMovementResult = {
  ok: boolean;
  results: Array<
    | { productId: string; ok: true; id: string }
    | { productId: string; ok: false; error: string }
  >;
};

export async function bulkCreateInventoryMovementsAction(
  _state: unknown,
  formData: FormData,
): Promise<BulkInventoryMovementResult> {
  const auth = await requireUser();
  if ("ok" in auth) {
    return { ok: false, results: [] };
  }

  const productIdsRaw = formData.get("productIds");
  const productIds: string[] = Array.isArray(
    typeof productIdsRaw === "string" ? JSON.parse(productIdsRaw) : [],
  )
    ? (JSON.parse(productIdsRaw as string) as string[])
    : [];
  if (productIds.length === 0) {
    return { ok: false, results: [] };
  }

  const parsed = inventoryMovementCreateSchema.safeParse(
    fromFormData(formData, ["movementType", "quantity", "note"]),
  );
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      results: productIds.map((id) => ({
        productId: id,
        ok: false,
        error: first?.message ?? "Datos inválidos",
      })),
    };
  }

  const supabase = await getSupabaseServer();
  const baseRow = {
    note: parsed.data.note?.trim() || null,
    created_by: auth.userId,
  };
  const movementFields =
    parsed.data.movementType === "adjustment"
      ? { movement_type: "adjustment" as const, quantity_adj: parsed.data.quantity }
      : { movement_type: parsed.data.movementType, quantity: parsed.data.quantity };

  const results: BulkInventoryMovementResult["results"] = [];
  for (const productId of productIds) {
    const { data, error } = await supabase
      .from("inventory_movements")
      .insert({ ...baseRow, ...movementFields, product_id: productId })
      .select("id")
      .single();
    if (error || !data) {
      results.push({
        productId,
        ok: false,
        error: error?.message ?? "Error desconocido",
      });
    } else {
      results.push({ productId, ok: true, id: data.id as string });
    }
  }

  if (results.some((r) => r.ok)) {
    revalidatePath("/products");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
  }
  return { ok: results.every((r) => r.ok), results };
}
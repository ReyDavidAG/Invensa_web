"use server";

/* Hallmark · locked system applied · src/app/actions/products.ts
 * Server Actions for the products module. All writes go through here.
 * The action validates input with the same zod schema as the form,
 * checks the caller's role server-side, and lets RLS be the final gate.
 *
 * Returns a discriminated union — no redirect() so the client can show a
 * toast and decide where to navigate next (the client uses react-query
 * useMutation + router.push).
 */

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/lib/schemas/products";

export type ProductActionResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

async function requireAdmin(): Promise<
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      error: "Solo administradores pueden modificar el catálogo.",
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

export async function createProductAction(
  _state: unknown,
  formData: FormData,
): Promise<ProductActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const parsed = productCreateSchema.safeParse(
    fromFormData(formData, [
      "code",
      "name",
      "categoryId",
      "unitId",
      "priceSale",
      "priceBuy",
      "stockLowThreshold",
      "imageUrl",
    ]),
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
  const { data, error } = await supabase
    .from("products")
    .insert({
      code: parsed.data.code,
      name: parsed.data.name,
      category_id: parsed.data.categoryId,
      unit_id: parsed.data.unitId,
      price_sale: parsed.data.priceSale,
      price_buy: parsed.data.priceBuy,
      stock_low_threshold: parsed.data.stockLowThreshold,
      image_url: parsed.data.imageUrl?.trim() ? parsed.data.imageUrl : null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ya existe un producto con ese código.",
        fieldErrors: { code: ["Código duplicado"] },
      };
    }
    return { ok: false, error: `No pudimos guardar: ${error.message}` };
  }

  revalidatePath("/products");
  return { ok: true, id: data.id };
}

export async function updateProductAction(
  productId: string,
  _state: unknown,
  formData: FormData,
): Promise<ProductActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const parsed = productUpdateSchema.safeParse(
    fromFormData(formData, [
      "code",
      "name",
      "categoryId",
      "unitId",
      "priceSale",
      "priceBuy",
      "stockLowThreshold",
      "imageUrl",
    ]),
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
  const { error } = await supabase
    .from("products")
    .update({
      code: parsed.data.code,
      name: parsed.data.name,
      category_id: parsed.data.categoryId,
      unit_id: parsed.data.unitId,
      price_sale: parsed.data.priceSale,
      price_buy: parsed.data.priceBuy,
      stock_low_threshold: parsed.data.stockLowThreshold,
      image_url: parsed.data.imageUrl?.trim() ? parsed.data.imageUrl : null,
    })
    .eq("id", productId);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ya existe un producto con ese código.",
        fieldErrors: { code: ["Código duplicado"] },
      };
    }
    return { ok: false, error: `No pudimos guardar: ${error.message}` };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { ok: true, id: productId };
}

export async function archiveProductAction(
  productId: string,
): Promise<ProductActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const supabase = await getSupabaseServer();
  // Soft-delete: flip status to archived. Real products are referenced by
  // sales_items and inventory_movements; hard delete would break history.
  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId);

  if (error) {
    return { ok: false, error: `No pudimos archivar: ${error.message}` };
  }

  revalidatePath("/products");
  return { ok: true, id: productId };
}

"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/actions/_guards";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/lib/schemas/products";

export type ProductActionResult =
  | { ok: true; id: string; warning?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

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
  const auth = await requireAdmin({ actionLabel: "modificar el catálogo" });
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
      "initialStock",
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

  // Initial inventory: log an 'in' movement with note "Inventario inicial".
  // Mirrors createSaleAction's soft-success pattern: if this insert fails the
  // product still exists and the admin can re-register via the dialog.
  let warning: string | undefined;
  if (parsed.data.initialStock > 0) {
    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: data.id,
        movement_type: "in",
        quantity: parsed.data.initialStock,
        note: "Inventario inicial",
        created_by: auth.userId,
      });
    if (movementError) {
      warning = `Producto creado pero no se registró el inventario inicial: ${movementError.message}`;
    }
  }

  revalidatePath("/products");
  return { ok: true, id: data.id, warning };
}

export async function updateProductAction(
  productId: string,
  _state: unknown,
  formData: FormData,
): Promise<ProductActionResult> {
  const auth = await requireAdmin({ actionLabel: "modificar el catálogo" });
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
  const auth = await requireAdmin({ actionLabel: "modificar el catálogo" });
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

export type BulkSetProductImageResult = {
  ok: boolean;
  updated: number;
  error?: string;
};

export async function bulkSetProductImageAction(
  productIds: string[],
  publicUrl: string,
): Promise<BulkSetProductImageResult> {
  const auth = await requireAdmin({ actionLabel: "actualizar imágenes" });
  if ("ok" in auth) {
    return { ok: false, updated: 0, error: auth.error };
  }
  if (productIds.length === 0) {
    return { ok: false, updated: 0, error: "No hay productos seleccionados." };
  }
  if (!publicUrl) {
    return { ok: false, updated: 0, error: "URL de imagen vacía." };
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("products")
    .update({ image_url: publicUrl })
    .in("id", productIds)
    .select("id");

  if (error) {
    return { ok: false, updated: 0, error: error.message };
  }
  revalidatePath("/products");
  return { ok: true, updated: data?.length ?? 0 };
}

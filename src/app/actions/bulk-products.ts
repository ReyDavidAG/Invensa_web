"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/actions/_guards";
import { getSupabaseServer } from "@/lib/supabase/server";
import { bulkCsvRowSchema } from "@/lib/schemas/bulk-product";

export type BulkRowResult =
  | { ok: true; id: string; code: string }
  | { ok: false; code: string; error: string };

export type BulkCreateProductsResult = {
  ok: boolean;
  created: number;
  failed: number;
  rows: BulkRowResult[];
};

export async function bulkCreateProductsAction(
  _state: unknown,
  formData: FormData,
): Promise<BulkCreateProductsResult> {
  const auth = await requireAdmin({ actionLabel: "importar productos" });
  if ("ok" in auth) {
    return { ok: false, created: 0, failed: 0, rows: [] };
  }

  const rawRowsRaw = formData.get("rows");
  const rawRows =
    typeof rawRowsRaw === "string" ? (JSON.parse(rawRowsRaw) as unknown[]) : [];

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return { ok: false, created: 0, failed: 0, rows: [] };
  }

  const supabase = await getSupabaseServer();
  const results: BulkRowResult[] = [];
  let created = 0;
  let failed = 0;

  // Cache for auto-created categories/units to avoid repeated DB hits.
  const categoryCache = new Map<string, string>(); // lower-name -> id
  const unitCache = new Map<string, string>(); // lower-code -> id

  for (const [idx, raw] of rawRows.entries()) {
    const rowNum = idx + 2; // +1 for header row, +1 for 1-based
    const parsed = bulkCsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const msg = first
        ? `${first.path.join(".") || "fila"}: ${first.message}`
        : "Datos inválidos";
      results.push({
        ok: false,
        code:
          typeof raw === "object" && raw && "code" in raw
            ? String(raw.code)
            : `Fila ${rowNum}`,
        error: `Fila ${rowNum}: ${msg}`,
      });
      failed += 1;
      continue;
    }
    const row = parsed.data;

    // --- Look up or create category ---
    const catKey = row.categoryName.toLowerCase();
    let categoryId = categoryCache.get(catKey);
    if (!categoryId) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", row.categoryName)
        .maybeSingle();
      if (existing) {
        categoryId = existing.id as string;
      } else {
        const codeBase =
          row.categoryName
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 16) || `cat-${rowNum}`;
        const { data: createdCat, error: catErr } = await supabase
          .from("categories")
          .insert({ code: codeBase, name: row.categoryName })
          .select("id")
          .single();
        if (catErr || !createdCat) {
          results.push({
            ok: false,
            code: row.code,
            error: `Fila ${rowNum}: no se pudo crear la categoría "${row.categoryName}".`,
          });
          failed += 1;
          continue;
        }
        categoryId = createdCat.id as string;
      }
      categoryCache.set(catKey, categoryId);
    }

    // --- Look up or create unit ---
    const unitKey = row.unitCode.toLowerCase();
    let unitId = unitCache.get(unitKey);
    if (!unitId) {
      const { data: existing } = await supabase
        .from("units")
        .select("id")
        .ilike("code", row.unitCode)
        .maybeSingle();
      if (existing) {
        unitId = existing.id as string;
      } else {
        const { data: createdUnit, error: unitErr } = await supabase
          .from("units")
          .insert({
            code: row.unitCode.toUpperCase().slice(0, 16),
            name: row.unitCode.toUpperCase(),
          })
          .select("id")
          .single();
        if (unitErr || !createdUnit) {
          results.push({
            ok: false,
            code: row.code,
            error: `Fila ${rowNum}: no se pudo crear la unidad "${row.unitCode}".`,
          });
          failed += 1;
          continue;
        }
        unitId = createdUnit.id as string;
      }
      unitCache.set(unitKey, unitId);
    }

    // --- Insert product ---
    const { data: inserted, error: prodErr } = await supabase
      .from("products")
      .insert({
        code: row.code,
        name: row.name,
        category_id: categoryId,
        unit_id: unitId,
        price_sale: row.priceSale,
        price_buy: row.priceBuy,
        stock_low_threshold: row.stockLowThreshold,
      })
      .select("id")
      .single();
    if (prodErr || !inserted) {
      const isDuplicate =
        prodErr?.code === "23505" ||
        (prodErr?.message ?? "").toLowerCase().includes("duplicate");
      results.push({
        ok: false,
        code: row.code,
        error: isDuplicate
          ? `Fila ${rowNum}: código "${row.code}" ya existe.`
          : `Fila ${rowNum}: no se pudo crear (${prodErr?.message ?? "error"}).`,
      });
      failed += 1;
      continue;
    }
    const productId = inserted.id as string;

    // --- Initial inventory movement ---
    if (row.initialStock > 0) {
      const { error: movErr } = await supabase
        .from("inventory_movements")
        .insert({
          product_id: productId,
          movement_type: "in",
          quantity: row.initialStock,
          note: "Inventario inicial",
          created_by: auth.userId,
        });
      if (movErr) {
        // Soft failure: product exists, movement didn't.
        results.push({
          ok: true,
          id: productId,
          code: `${row.code} (sin inventario inicial)`,
        });
        created += 1;
        continue;
      }
    }

    results.push({ ok: true, id: productId, code: row.code });
    created += 1;
  }

  if (created > 0) {
    revalidatePath("/products");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
  }

  return {
    ok: failed === 0,
    created,
    failed,
    rows: results,
  };
}

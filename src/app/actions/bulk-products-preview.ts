"use server";

import { requireAdmin } from "@/app/actions/_guards";
import { getSupabaseServer } from "@/lib/supabase/server";

export type PreviewTaxonomyResult =
  | {
      ok: true;
      categories: { existing: string[]; new: string[] };
      units: { existing: string[]; new: string[] };
    }
  | { ok: false; error: string };

export async function previewBulkTaxonomyAction(
  rows: Array<{ categoryName?: string; unitCode?: string }>,
): Promise<PreviewTaxonomyResult> {
  const auth = await requireAdmin({
    actionLabel: "previsualizar importación",
  });
  if ("ok" in auth) return auth;

  const categoryNames = Array.from(
    new Set(
      rows
        .map((r) => r.categoryName?.trim())
        .filter((n): n is string => Boolean(n)),
    ),
  );
  const unitCodes = Array.from(
    new Set(
      rows
        .map((r) => r.unitCode?.trim())
        .filter((u): u is string => Boolean(u)),
    ),
  );

  const supabase = await getSupabaseServer();

  const [categoriesRes, unitsRes] = await Promise.all([
    categoryNames.length
      ? supabase.from("categories").select("name").in("name", categoryNames)
      : Promise.resolve({ data: [], error: null }),
    unitCodes.length
      ? supabase.from("units").select("code").in("code", unitCodes)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoriesRes.error) {
    console.error("[bulk-preview] categories", categoriesRes.error);
    return { ok: false, error: "No se pudieron revisar las categorías." };
  }
  if (unitsRes.error) {
    console.error("[bulk-preview] units", unitsRes.error);
    return { ok: false, error: "No se pudieron revisar las unidades." };
  }

  const existingCategorySet = new Set(
    (categoriesRes.data ?? []).map((r) => r.name.toLowerCase()),
  );
  const existingUnitSet = new Set(
    (unitsRes.data ?? []).map((r) => r.code.toLowerCase()),
  );

  const categories = {
    existing: categoryNames.filter((n) =>
      existingCategorySet.has(n.toLowerCase()),
    ),
    new: categoryNames.filter((n) => !existingCategorySet.has(n.toLowerCase())),
  };
  const units = {
    existing: unitCodes.filter((u) => existingUnitSet.has(u.toLowerCase())),
    new: unitCodes.filter((u) => !existingUnitSet.has(u.toLowerCase())),
  };

  return { ok: true, categories, units };
}

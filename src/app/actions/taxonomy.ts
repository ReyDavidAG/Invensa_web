"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";

export type TaxonomyOption = {
  id: string;
  name: string;
  code: string;
};

export type TaxonomyActionResult =
  { ok: true; option: TaxonomyOption } | { ok: false; error: string };

async function requireAdmin(): Promise<
  { userId: string } | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      error: "Solo administradores pueden crear catálogos.",
    };
  }
  return { userId: user.id };
}

/** Auto-derive a code from a human name. "Pieza" -> "PZA", "Limpiador multiusos" -> "LMU". */
function deriveCode(name: string): string {
  const trimmed = name.trim();
  const initials = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  if (initials.length >= 2) return initials.slice(0, 3);
  return (
    trimmed
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 3) || "X"
  );
}

export async function createCategoryAction(
  name: string,
): Promise<TaxonomyActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "El nombre es obligatorio." };
  if (trimmed.length > 64) {
    return { ok: false, error: "Máximo 64 caracteres." };
  }

  const supabase = await getSupabaseServer();
  // Try the user-typed name first; fall back to the derived code on collision.
  const candidates = [
    deriveCode(trimmed),
    deriveCode(trimmed) + "2",
    deriveCode(trimmed) + "3",
  ];
  let lastError: string | null = null;
  for (const code of candidates) {
    const { data, error } = await supabase
      .from("categories")
      .insert({ code, name: trimmed })
      .select("id, code, name")
      .single();
    if (!error && data) {
      revalidatePath("/products");
      return {
        ok: true,
        option: {
          id: data.id as string,
          code: data.code as string,
          name: data.name as string,
        },
      };
    }
    if (error && error.code === "23505") {
      // duplicate code — try the next candidate
      lastError = "duplicate";
      continue;
    }
    return {
      ok: false,
      error: error?.message ?? "No pudimos crear la categoría.",
    };
  }
  return {
    ok: false,
    error:
      "Código duplicado: " + (lastError ?? "no se pudo generar código único."),
  };
}

export async function createUnitAction(
  name: string,
): Promise<TaxonomyActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "El nombre es obligatorio." };
  if (trimmed.length > 64) {
    return { ok: false, error: "Máximo 64 caracteres." };
  }

  const supabase = await getSupabaseServer();
  const candidates = [
    deriveCode(trimmed),
    deriveCode(trimmed) + "2",
    deriveCode(trimmed) + "3",
  ];
  let lastError: string | null = null;
  for (const code of candidates) {
    const { data, error } = await supabase
      .from("units")
      .insert({ code, name: trimmed })
      .select("id, code, name")
      .single();
    if (!error && data) {
      revalidatePath("/products");
      return {
        ok: true,
        option: {
          id: data.id as string,
          code: data.code as string,
          name: data.name as string,
        },
      };
    }
    if (error && error.code === "23505") {
      lastError = "duplicate";
      continue;
    }
    return {
      ok: false,
      error: error?.message ?? "No pudimos crear la unidad.",
    };
  }
  return {
    ok: false,
    error:
      "Código duplicado: " + (lastError ?? "no se pudo generar código único."),
  };
}

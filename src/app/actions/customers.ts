"use server";

/* Hallmark · locked system applied (Taller) · src/app/actions/customers.ts
 * Server Actions for the customers module. All writes go through here.
 * Validates with zod, checks the caller's role, lets RLS be the final gate.
 */

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import {
  customerCreateSchema,
  customerUpdateSchema,
} from "@/lib/schemas/customers";

export type CustomerActionResult =
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
    return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      error: "Solo administradores pueden modificar clientes.",
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

export async function createCustomerAction(
  _state: unknown,
  formData: FormData,
): Promise<CustomerActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const parsed = customerCreateSchema.safeParse(
    fromFormData(formData, ["name", "phone", "email", "address", "notes"]),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone?.trim() ? parsed.data.phone : null,
      email: parsed.data.email?.trim() ? parsed.data.email : null,
      address: parsed.data.address?.trim() ? parsed.data.address : null,
      notes: parsed.data.notes?.trim() ? parsed.data.notes : null,
      active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: `No pudimos crear el cliente: ${error?.message ?? "error desconocido"}`,
    };
  }

  revalidatePath("/customers");
  return { ok: true, id: data.id };
}

export async function updateCustomerAction(
  customerId: string,
  _state: unknown,
  formData: FormData,
): Promise<CustomerActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const parsed = customerUpdateSchema.safeParse(
    fromFormData(formData, ["name", "phone", "email", "address", "notes"]),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone?.trim() ? parsed.data.phone : null,
      email: parsed.data.email?.trim() ? parsed.data.email : null,
      address: parsed.data.address?.trim() ? parsed.data.address : null,
      notes: parsed.data.notes?.trim() ? parsed.data.notes : null,
    })
    .eq("id", customerId);

  if (error) {
    return { ok: false, error: `No pudimos guardar: ${error.message}` };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return { ok: true, id: customerId };
}

export async function archiveCustomerAction(
  customerId: string,
): Promise<CustomerActionResult> {
  const auth = await requireAdmin();
  if ("ok" in auth) return auth;

  const supabase = await getSupabaseServer();
  // Soft delete: flip active=false. Sales are referenced by FK; we don't
  // want to break sale history by hard-deleting.
  const { error } = await supabase
    .from("clients")
    .update({ active: false })
    .eq("id", customerId);

  if (error) {
    return { ok: false, error: `No pudimos archivar: ${error.message}` };
  }

  revalidatePath("/customers");
  return { ok: true, id: customerId };
}

"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/schemas/auth";

export type ProfileActionResult =
  | { ok: true; fullName: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

async function requireUser(): Promise<
  { userId: string; email: string } | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }
  return { userId: user.id, email: user.email };
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

export async function updateProfileAction(
  _state: unknown,
  formData: FormData,
): Promise<ProfileActionResult> {
  const auth = await requireUser();
  if ("ok" in auth) return auth;

  const parsed = profileUpdateSchema.safeParse(
    fromFormData(formData, ["fullName"]),
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
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", auth.userId);

  if (error) {
    return { ok: false, error: `No pudimos guardar: ${error.message}` };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { ok: true, fullName: parsed.data.fullName };
}

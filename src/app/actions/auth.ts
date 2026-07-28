"use server";

// Auth server actions. Re-validate with the same zod schema on the server, then
// call Supabase. Return a discriminated union so client forms can show errors.

import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";
import { mapSupabaseError } from "@/lib/messages/es";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/schemas/auth";

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const fromFormData = <T extends Record<string, FormDataEntryValue | null>>(
  formData: FormData,
  keys: (keyof T)[],
): T => {
  const out = {} as T;
  for (const key of keys) out[key] = formData.get(String(key)) as T[keyof T];
  return out;
};

export async function loginAction(
  _state: unknown,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(
    fromFormData(formData, ["email", "password"]),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, error: mapSupabaseError(error.code, error.message) };
  }
  redirect("/dashboard");
}

// Register flow: completes an invite. Auth state has already been set by the
// /auth/callback exchange. We update the user's profile (full_name) and reset
// the password so the user picks one they actually remember.
export async function registerAction(
  _state: unknown,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(
    fromFormData(formData, ["fullName", "password", "confirmPassword"]),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error:
        "Tu sesión expiró. Vuelve a abrir el enlace que te enviamos por correo.",
    };
  }

  // Update password first so the user controls this credential.
  const { error: pwErr } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (pwErr) {
    return {
      ok: false,
      error: mapSupabaseError(pwErr.code, pwErr.message),
    };
  }

  // Persist full_name into public.profiles. The DB trigger from migration 0001
  // creates the row on auth.users insert; we update it now.
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (profileErr) {
    // non-fatal — the password was set
    return {
      ok: false,
      error: "No pudimos guardar tu nombre. Intenta de nuevo.",
    };
  }

  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _state: unknown,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(
    fromFormData(formData, ["email"]),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await getSupabaseServer();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });
  // Don't leak which emails exist — same message either way.
  if (error) {
    return {
      ok: false,
      error: mapSupabaseError(error.code, error.message),
    };
  }
  return { ok: true };
}

export async function resetPasswordAction(
  _state: unknown,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(
    fromFormData(formData, ["password", "confirmPassword"]),
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error:
        "El enlace ya no es válido. Solicita uno nuevo desde la pantalla de recuperación.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: mapSupabaseError(error.code, error.message) };
  }
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

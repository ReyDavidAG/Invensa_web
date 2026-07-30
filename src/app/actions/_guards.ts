import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";

export type RequireUserResult =
  { userId: string } | { ok: false; error: string };

export type RequireAdminOptions = {
  /** Custom verb used in the "Solo administradores pueden …" message. */
  actionLabel?: string;
};

export type RequireAdminResult =
  { userId: string } | { ok: false; error: string };

// Lightest guard: just needs a logged-in user. Both admin and employee pass.
export async function requireUser(): Promise<RequireUserResult> {
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

export async function requireAdmin(
  options: RequireAdminOptions = {},
): Promise<RequireAdminResult> {
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
    const verb = options.actionLabel ?? "realizar esta acción";
    return {
      ok: false,
      error: `Solo administradores pueden ${verb}.`,
    };
  }
  return { userId: user.id };
}

/* Hallmark · locked system applied · src/app/actions/_guards.ts
 * Shared admin-role guard for Server Actions. Returns the auth user id when
 * the caller is an admin, or a discriminated `{ ok: false, error }` when they
 * aren't (or the session expired). Callers surface the error verbatim.
 *
 * RLS is still the final gate — this helper is just a nicer UX so employees
 * get a 403-style message before the database rejects the write.
 */

import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";

export type RequireAdminOptions = {
  /** Custom verb used in the "Solo administradores pueden …" message. */
  actionLabel?: string;
};

export type RequireAdminResult =
  | { userId: string }
  | { ok: false; error: string };

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
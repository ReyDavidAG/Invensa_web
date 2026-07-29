import "server-only";

import { getSupabaseServer } from "@/lib/supabase/server";

export type RecipientRole = "admin" | "employee";

export async function getRecipients(roles: RecipientRole[]): Promise<string[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("email, role")
    .in("role", roles);
  if (error || !data) return [];
  return Array.from(
    new Set(data.map((r) => r.email).filter((e): e is string => Boolean(e))),
  );
}

export async function getRecipientIds(
  roles: RecipientRole[],
): Promise<string[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .in("role", roles);
  if (error || !data) return [];
  return Array.from(
    new Set(data.map((r) => r.id as string).filter((id) => Boolean(id))),
  );
}

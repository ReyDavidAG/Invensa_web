import { cache } from "react";

import { getSupabaseServer } from "./server";

// Cached per request so layout + TopBar (and any sibling server component)
// share one Supabase roundtrip instead of N. React.cache() dedupes within a
// single render pass; once the request ends the entry is dropped.
export const getCurrentUserWithProfile = cache(async () => {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile };
});

export const getUnreadNotificationsCount = cache(async (): Promise<number> => {
  const { user } = await getCurrentUserWithProfile();
  if (!user) return 0;
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
});

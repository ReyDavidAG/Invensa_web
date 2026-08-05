import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

// Not `ReturnType<typeof createClient>` — on the bare generic function that
// resolves the schema type param to `never` instead of the default `any`,
// which makes every `.from(table)` call below untypeable.
let cached: SupabaseClient | null = null;

export async function getSupabaseAdmin() {
  if (cached) return cached;
  const env = await getServerEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[supabase/admin] SUPABASE_SERVICE_ROLE_KEY must be set for admin calls",
    );
  }
  cached = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  return cached;
}

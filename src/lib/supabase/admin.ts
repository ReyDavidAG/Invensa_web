/* Hallmark · locked system applied · src/lib/supabase/admin.ts
 * SERVICE-ROLE client. Bypasses RLS — only for trusted server-side jobs:
 *   - invitations (signUp with admin metadata)
 *   - audit log writes
 *   - cron-style maintenance
 * NEVER import from a client component. NEVER expose to the browser bundle.
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

let cached: ReturnType<typeof createClient> | null = null;

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

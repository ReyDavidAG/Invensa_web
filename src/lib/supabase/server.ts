/* Hallmark · locked system applied · src/lib/supabase/server.ts
 * Server-side Supabase client that reads/writes the auth session via cookies().
 * Use in Server Components, Route Handlers, and Server Actions.
 */

import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getServerEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Per-request server client. The cookie adapter is async because next/headers
 * `cookies()` is async in Next 15+. Server Components get a read-only context —
 * the `set` branch is wrapped in try/catch so refresh-from-RSC does not throw.
 */
export async function getSupabaseServer() {
  const env = await getServerEnv();
  const store = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              store.set(name, value, options);
            }
          } catch {
            // ignore writes from a read-only context (Server Component render)
          }
        },
      },
    },
  );
}

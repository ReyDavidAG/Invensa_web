/* Hallmark · locked system applied · src/proxy.ts
 * Refreshes the Supabase auth session on every request so Server Components and
 * Server Actions see a current user. Also a single chokepoint to gate app routes.
 *
 * Note: Next 16 renamed `middleware` → `proxy`. The file lives at src/proxy.ts
 * and exports `proxy` instead of `middleware`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/confirm",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Don't crash the dev server if envs aren't set yet; let UI surface the
    // missing-var banner.
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(
          ({
            name,
            value,
            options,
          }: {
            name: string;
            value: string;
            options?: CookieOptions;
          }) => response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refreshes the session cookie if needed. MUST be awaited so cookies land.
  await supabase.auth.getUser();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublic(pathname)) {
    // Unauthenticated user hitting an app route → push to /login with next= redirect.
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectTo);
  }

  if (user && isPublic(pathname) && pathname === "/login") {
    // Authenticated user on /login → send to dashboard.
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/dashboard";
    redirectTo.search = "";
    return NextResponse.redirect(redirectTo);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

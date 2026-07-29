// /auth/callback — exchanges email-link codes for a session, then routes.
// Handles three Supabase flows:
//   ?code=...        PKCE code from email link / OAuth provider
//   ?token_hash=...  OTP-based flows (invite, recovery, signup confirm) with &type=...
//
// After exchange, the cookies middleware sees the user and the layout guards
// kick in (auth users on /login → /dashboard; anon on /app → /login).

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { mapSupabaseError } from "@/lib/messages/es";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type"); // 'invite' | 'recovery' | 'signup' | etc.
  const nextParam = url.searchParams.get("next");

  const safeNext = (() => {
    if (!nextParam) return null;
    // only allow internal paths
    if (!nextParam.startsWith("/") || nextParam.startsWith("//")) return null;
    return nextParam;
  })();

  const supabase = await getSupabaseServer();

  // PKCE flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const dest = new URL("/login", url.origin);
      dest.searchParams.set(
        "error",
        mapSupabaseError(error.code, error.message),
      );
      return NextResponse.redirect(dest);
    }
    return NextResponse.redirect(new URL(safeNext ?? "/dashboard", url.origin));
  }

  // OTP / magic-link flow
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as
        "signup" | "invite" | "recovery" | "magiclink" | "email_change",
      token_hash: tokenHash,
    });
    if (error) {
      const dest = new URL("/login", url.origin);
      dest.searchParams.set(
        "error",
        mapSupabaseError(error.code, error.message),
      );
      return NextResponse.redirect(dest);
    }
    const dest =
      type === "invite" || type === "signup"
        ? "/register"
        : type === "recovery"
          ? "/reset-password"
          : (safeNext ?? "/dashboard");
    return NextResponse.redirect(new URL(dest, url.origin));
  }

  // Nothing to do — bounce to login.
  return NextResponse.redirect(new URL("/login", url.origin));
}

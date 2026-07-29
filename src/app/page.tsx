import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

// Force dynamic rendering — we read the auth session on the server.
export const dynamic = "force-dynamic";

/** Root entry. Redirects to dashboard if signed in, otherwise to login. */
export default async function Home() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  redirect("/login");
}

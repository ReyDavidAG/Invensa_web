import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

/** Root entry. Redirects to dashboard if signed in, otherwise to login. */
export default async function Home() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  redirect("/login");
}

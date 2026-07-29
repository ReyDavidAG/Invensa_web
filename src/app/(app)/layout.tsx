/* Hallmark · locked system applied · src/app/(app)/layout.tsx
 * App shell layout — wraps every authenticated route in the Workbench pattern:
 * SidebarProvider · SideNav (left) · SidebarInset (top bar + page main).
 * Page main: max-w-screen-2xl mx-auto px-8 py-6 on >=768px; px-4 py-4 on narrow.
 */

import type { ReactNode } from "react";

import { SideNav } from "@/components/nav/side-nav";
import { TopBar } from "@/components/nav/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSupabaseServer } from "@/lib/supabase/server";
import { APP_VERSION } from "@/lib/version";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    userName = (profile?.full_name ?? "").trim();
    if (!userName && user.email) userName = user.email.split("@")[0];
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="print:hidden">
        <SideNav userName={userName} appVersion={APP_VERSION} />
      </div>
      <SidebarInset>
        <div className="print:hidden">
          <TopBar />
        </div>
        <main className="mx-auto w-full max-w-screen-2xl px-4 py-4 md:px-4 md:py-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

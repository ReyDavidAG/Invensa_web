import type { ReactNode } from "react";

import { SideNav } from "@/components/nav/side-nav";
import { TopBar } from "@/components/nav/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUserWithProfile, getUnreadNotificationsCount } from "@/lib/supabase/profile";
import { APP_VERSION } from "@/lib/version";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // One fetch shared with TopBar via React.cache().
  const [{ user, profile }, unread] = await Promise.all([
    getCurrentUserWithProfile(),
    getUnreadNotificationsCount(),
  ]);

  const fullName = (profile?.full_name ?? "").trim();
  const userName = fullName || (user?.email ? user.email.split("@")[0] : "");

  return (
    <SidebarProvider defaultOpen>
      <div className="print:hidden">
        <SideNav userName={userName} appVersion={APP_VERSION} />
      </div>
      <SidebarInset>
        <div className="print:hidden">
          <TopBar
            email={user?.email ?? ""}
            fullName={fullName || null}
            unread={unread}
          />
        </div>
        <main className="mx-auto w-full max-w-screen-2xl px-4 py-4 md:px-4 md:py-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

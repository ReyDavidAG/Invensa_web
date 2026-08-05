import { Suspense, type ReactNode } from "react";

import { SideNav } from "@/components/nav/side-nav";
import { TopBar } from "@/components/nav/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getCurrentUserWithProfile,
  getUnreadNotificationsCount,
} from "@/lib/supabase/profile";
import { APP_VERSION } from "@/lib/version";

// Split off so the sidebar/topbar chrome (this file's own JSX) never awaits —
// it becomes part of the static prerendered shell, and only these two small
// pieces stream in per navigation. Fetches still dedupe via React.cache().
async function SideNavData() {
  const { user, profile } = await getCurrentUserWithProfile();
  const fullName = (profile?.full_name ?? "").trim();
  const userName = fullName || (user?.email ? user.email.split("@")[0] : "");
  return <SideNav userName={userName} appVersion={APP_VERSION} />;
}

async function TopBarData() {
  const [{ user, profile }, unread] = await Promise.all([
    getCurrentUserWithProfile(),
    getUnreadNotificationsCount(),
  ]);
  const fullName = (profile?.full_name ?? "").trim();
  return (
    <TopBar
      email={user?.email ?? ""}
      fullName={fullName || null}
      unread={unread}
    />
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="print:hidden">
        <Suspense fallback={<SideNav userName="" appVersion={APP_VERSION} />}>
          <SideNavData />
        </Suspense>
      </div>
      <SidebarInset>
        <div className="print:hidden">
          {/* ponytail: fallback reuses TopBar with email="" (hides bell/account),
              so those icons pop in once data resolves instead of skeleton-matching
              their final slot. Upgrade if that pop-in reads as jank: give TopBar a
              loading variant sized like the real icons. */}
          <Suspense fallback={<TopBar email="" fullName={null} unread={0} />}>
            <TopBarData />
          </Suspense>
        </div>
        <main className="mx-auto w-full max-w-screen-2xl px-4 py-4 md:px-4 md:py-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

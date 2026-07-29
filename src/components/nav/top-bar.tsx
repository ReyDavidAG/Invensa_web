import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getUnreadCountAction } from "@/app/actions/notifications";

import { AccountMenu } from "./account-menu";
import { Breadcrumb, PageTitle } from "./page-title";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";

export async function TopBar() {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let fullName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    fullName = (profile?.full_name ?? "").trim() || null;
  }

  const email = user?.email ?? "";
  const unread = user ? await getUnreadCountAction() : 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-sidebar-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-4 sm:px-4">
      <SidebarTrigger
        className="-ml-1"
        aria-label="Alternar navegación lateral"
      />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <Breadcrumb />
        <PageTitle />
      </div>
      {user ? <NotificationBell initialUnread={unread} /> : null}
      <ThemeToggle />
      {user ? <AccountMenu email={email} fullName={fullName} /> : null}
    </header>
  );
}

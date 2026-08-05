import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { AccountMenu } from "./account-menu";
import { Breadcrumb, PageTitle } from "./page-title";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { HelpMenu } from "@/components/help-menu";

// Data comes from the parent (app)/layout — those calls are deduped via
// React.cache() so layout + TopBar cost a single Supabase roundtrip per render.
export function TopBar({
  email,
  fullName,
  unread,
}: {
  email: string;
  fullName: string | null;
  unread: number;
}) {
  const signedIn = !!email;

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
      {signedIn ? <NotificationBell initialUnread={unread} /> : null}
      {signedIn ? <HelpMenu /> : null}
      <ThemeToggle />
      {signedIn ? <AccountMenu email={email} fullName={fullName} /> : null}
    </header>
  );
}

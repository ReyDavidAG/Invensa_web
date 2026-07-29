/* Hallmark · locked system applied · src/app/(app)/layout.tsx
 * App shell layout — wraps every authenticated route in the Workbench pattern:
 * SidebarProvider · SideNav (left) · SidebarInset (top bar + page main).
 * Page main: max-w-screen-2xl mx-auto px-8 py-6 on >=768px; px-4 py-4 on narrow.
 */

import type { ReactNode } from "react";

import { SideNav } from "@/components/nav/side-nav";
import { TopBar } from "@/components/nav/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <SideNav />
      <SidebarInset>
        <TopBar />
        <main className="mx-auto w-full max-w-screen-2xl px-4 py-4 md:px-8 md:py-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

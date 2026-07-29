"use client";

/* Hallmark · locked system applied (Taller) · src/components/nav/side-nav.tsx
 * Sidebar with the app's primary nav. Active item gets a 2px cobalt border-left
 * + cobalt text via shadcn `SidebarMenuButton`'s isActive prop.
 *
 * Taller iteration: large button size (size="lg") + size-5 icons so the nav
 * has more tap target on mobile and feels weightier on desktop.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: LucideIcon };

const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
];

const ACCOUNT_NAV_BASE: Omit<NavItem, "label"> = {
  href: "/account",
  icon: UserCircle,
};

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const accountLabel = userName.trim() || "Cuenta";
  const accountNav: NavItem = { ...ACCOUNT_NAV_BASE, label: accountLabel };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-3 text-base font-semibold tracking-tight text-foreground"
        >
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground shadow-sm">
            I
          </span>
          <span className="group-data-[collapsible=icon]:hidden">Invensa</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {PRIMARY_NAV.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  size="lg"
                  render={<Link href={item.href} />}
                  isActive={isActive(pathname, item.href)}
                  tooltip={item.label}
                  className="data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary [&_svg]:size-5"
                >
                  <item.icon aria-hidden />
                  <span className="text-sm">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 pb-3">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={accountNav.href} />}
              isActive={isActive(pathname, accountNav.href)}
              tooltip={accountNav.label}
              className="data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary [&_svg]:size-5"
            >
              <accountNav.icon aria-hidden />
              <span className="text-sm">{accountNav.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

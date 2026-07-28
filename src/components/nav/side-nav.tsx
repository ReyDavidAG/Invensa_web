"use client";

/* Hallmark · locked system applied · src/components/nav/side-nav.tsx
 * Sidebar with the app's primary nav. Active item gets a 2px coral border-left
 * + coral text via shadcn `SidebarMenuButton`'s isActive prop.
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

const ACCOUNT_NAV: NavItem = { href: "/account", label: "Cuenta", icon: UserCircle };

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 text-base font-semibold tracking-tight"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            I
          </span>
          <span className="group-data-[collapsible=icon]:hidden">Invensa</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {PRIMARY_NAV.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive(pathname, item.href)}
                  tooltip={item.label}
                  className="data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:text-primary"
                >
                  <item.icon aria-hidden />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={ACCOUNT_NAV.href} />}
              isActive={isActive(pathname, ACCOUNT_NAV.href)}
              tooltip={ACCOUNT_NAV.label}
              className="data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:text-primary"
            >
              <ACCOUNT_NAV.icon aria-hidden />
              <span>{ACCOUNT_NAV.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

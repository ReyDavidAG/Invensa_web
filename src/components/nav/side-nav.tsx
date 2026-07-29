"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { InstallPwaButton } from "@/components/install-pwa-button";
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
  { href: "/cash-closing", label: "Cierre de caja", icon: Banknote },
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

export function SideNav({
  userName,
  appVersion,
}: {
  userName: string;
  appVersion: string;
}) {
  const pathname = usePathname();
  const accountLabel = userName.trim() || "Cuenta";
  const accountNav: NavItem = { ...ACCOUNT_NAV_BASE, label: accountLabel };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          href="/dashboard"
          aria-label="Invensa · inicio"
          className="flex items-center gap-2.5 rounded-md px-3 py-3 text-base font-semibold tracking-tight text-foreground transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground shadow-sm group-data-[collapsible=icon]:size-7">
            <BrandMark className="size-5 group-data-[collapsible=icon]:size-3.5" />
          </span>
          <span className="flex min-w-0 flex-col truncate group-data-[collapsible=icon]:hidden">
            <span className="truncate">Invensa</span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              v{appVersion}
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {PRIMARY_NAV.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  size="lg"
                  render={<Link href={item.href as Route} />}
                  isActive={isActive(pathname, item.href)}
                  tooltip={item.label}
                  className="data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:data-[active=true]:border-l-0 group-data-[collapsible=icon]:data-[active=true]:bg-primary group-data-[collapsible=icon]:data-[active=true]:text-primary-foreground [&_svg]:size-5 [&>span:last-child]:group-data-[collapsible=icon]:hidden"
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
          <InstallPwaButton />
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={accountNav.href as Route} />}
              isActive={isActive(pathname, accountNav.href)}
              tooltip={accountNav.label}
              className="data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:data-[active=true]:border-l-0 group-data-[collapsible=icon]:data-[active=true]:bg-primary group-data-[collapsible=icon]:data-[active=true]:text-primary-foreground [&_svg]:size-5 [&>span:last-child]:group-data-[collapsible=icon]:hidden"
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

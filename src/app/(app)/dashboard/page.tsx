import {
  ChevronRight,
  Receipt,
  ShoppingCart,
  UserPlus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeUp } from "@/components/motion/fade-up";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const esMXDateTime = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "short",
});

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

type QuickAction = {
  href: Route;
  label: string;
  hint: string;
  icon: React.ReactNode;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/sales/new",
    label: "Registrar venta",
    hint: "POS · paso a paso",
    icon: <ShoppingCart aria-hidden className="size-4" />,
  },
  {
    href: "/products",
    label: "Agregar producto",
    hint: "Catálogo · alta rápida",
    icon: <UserPlus aria-hidden className="size-4" />,
  },
  {
    href: "/customers",
    label: "Nuevo cliente",
    hint: "Para registrar ventas",
    icon: <Receipt aria-hidden className="size-4" />,
  },
  {
    href: "/reports",
    label: "Ver reportes",
    hint: "Cortes y top productos",
    icon: <Wallet aria-hidden className="size-4" />,
  },
];

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Window boundaries
  const todayStart = startOfDay(new Date());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Parallel fetches
  const [
    { data: profile, error: profileError },
    { data: salesToday, error: salesTodayError },
    { data: salesYesterday, error: salesYesterdayError },
    { data: recentSales, error: recentSalesError },
    { data: stocks, error: stocksError },
    { data: productsForStock, error: productsForStockError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("sales")
      .select("id, total, paid_amount, status, client_id, date_at")
      .gte("date_at", todayStart.toISOString())
      .lt("date_at", tomorrowStart.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("sales")
      .select("id, total")
      .gte("date_at", yesterdayStart.toISOString())
      .lt("date_at", todayStart.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("sales")
      .select(
        "id, ticket_number, date_at, total, status, client_id, clients(name)",
      )
      .neq("status", "cancelled")
      .order("date_at", { ascending: false })
      .limit(5),
    // vw_product_stock is a view; PostgREST cannot embed it via products.
    // Query the view directly and join thresholds in app code.
    supabase.from("vw_product_stock").select("product_id, stock_on_hand"),
    supabase
      .from("products")
      .select("id, stock_low_threshold, status")
      .eq("status", "active"),
  ]);

  if (profileError) console.error("[dashboard] profile", profileError);
  if (salesTodayError)
    console.error("[dashboard] sales today", salesTodayError);
  if (salesYesterdayError)
    console.error("[dashboard] sales yesterday", salesYesterdayError);
  if (recentSalesError)
    console.error("[dashboard] recent sales", recentSalesError);
  if (stocksError) console.error("[dashboard] stock view", stocksError);
  if (productsForStockError)
    console.error("[dashboard] products for stock", productsForStockError);

  // ── Greeting ──────────────────────────────────────────────────
  const firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0] || "";

  // ── KPIs ───────────────────────────────────────────────────────
  const todayTotal = (salesToday ?? []).reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );
  const todayCount = (salesToday ?? []).length;
  const ticketToday = todayCount > 0 ? todayTotal / todayCount : null;

  const yesterdayTotal = (salesYesterday ?? []).reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );
  const yesterdayCount = (salesYesterday ?? []).length;
  const ticketYesterday =
    yesterdayCount > 0 ? yesterdayTotal / yesterdayCount : null;
  const ticketDelta =
    ticketYesterday && ticketToday
      ? ((ticketToday - ticketYesterday) / ticketYesterday) * 100
      : null;

  // ── Low stock count ──────────────────────────────────────────
  const thresholdByProduct = new Map<string, number>(
    (productsForStock ?? []).map((p) => [
      p.id as string,
      Number(p.stock_low_threshold),
    ]),
  );
  let lowStockCount = 0;
  for (const row of stocks ?? []) {
    const productId = row.product_id as string;
    const threshold = thresholdByProduct.get(productId);
    if (threshold === undefined) continue;
    const stock = Number(row.stock_on_hand);
    if (stock <= threshold) lowStockCount += 1;
  }

  // ── Recent sales (resolve client names) ─────────────────────
  const recentSalesList = (recentSales ?? []).map((s) => {
    const client = Array.isArray(s.clients) ? s.clients[0] : s.clients;
    return {
      id: s.id as string,
      ticketNumber: Number(s.ticket_number),
      dateAt: s.date_at as string,
      total: Number(s.total),
      clientName: (client?.name as string | null) ?? null,
      status: s.status as "paid" | "credit" | "cancelled",
    };
  });

  return (
    <FadeUp className="flex flex-col gap-6">
      {/* Greeting */}
      <header
        className="animate-fade-up flex flex-col gap-1"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Hola{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen del día en tu tienda.
        </p>
      </header>

      {/* Stat tiles — stagger via inline animationDelay */}
      <section
        aria-label="Indicadores del día"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <StatTile
          delay={0}
          label="Ventas hoy"
          value={todayCount > 0 ? todayCount.toString() : "—"}
          subtitle={
            todayCount > 0
              ? `${esMXCurrency.format(todayTotal)}`
              : "« datos reales cuando registres ventas »"
          }
        />
        <StatTile
          delay={0.04}
          label="Ticket promedio"
          value={ticketToday !== null ? esMXCurrency.format(ticketToday) : "—"}
          subtitle={
            ticketYesterday !== null && ticketToday !== null
              ? `${ticketDelta! >= 0 ? "+" : ""}${ticketDelta!.toFixed(0)}% vs ayer (${esMXCurrency.format(ticketYesterday)})`
              : ticketToday !== null
                ? `ayer: ${yesterdayCount} ${yesterdayCount === 1 ? "venta" : "ventas"}`
                : "« datos reales cuando registres ventas »"
          }
        />
        <StatTile
          delay={0.08}
          label="Stock bajo"
          value={lowStockCount > 0 ? lowStockCount.toString() : "—"}
          subtitle={
            lowStockCount > 0
              ? `${lowStockCount} ${lowStockCount === 1 ? "producto" : "productos"}`
              : "todo el inventario sobre el umbral"
          }
        />
        <StatTile
          delay={0.12}
          label="Ventas (count)"
          value={todayCount > 0 ? todayCount.toString() : "—"}
          subtitle={
            yesterdayCount > 0
              ? `ayer: ${yesterdayCount}`
              : "« primer día de operación »"
          }
        />
      </section>

      {/* Recent sales + actions */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div
          className="animate-fade-up lg:col-span-2"
          style={{ animationDelay: "160ms" }}
        >
          <Card className="p-0 card-hover-lift">
            <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <h2 className="text-sm font-semibold tracking-tight">
                Ventas recientes
              </h2>
              <Link
                href="/sales"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Ver todas
                <ChevronRight aria-hidden className="size-3" />
              </Link>
            </header>
            {recentSalesList.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <Receipt
                  aria-hidden
                  className="size-8 text-muted-foreground/60"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Aún no tienes ventas registradas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cuando registres una venta aparecerá aquí.
                  </p>
                </div>
                <Button
                  render={<Link href="/sales/new" />}
                  nativeButton={false}
                  size="sm"
                  className="mt-2"
                >
                  Registrar primera venta
                </Button>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-border">
                {recentSalesList.map((sale) => (
                  <li
                    key={sale.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        #{sale.ticketNumber}
                      </span>
                      <span className="truncate text-sm">
                        {sale.clientName ?? "Cliente ocasional"}
                      </span>
                      {sale.status === "credit" ? (
                        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                          Fiado
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <time className="hidden text-xs text-muted-foreground sm:block">
                        {esMXDateTime.format(new Date(sale.dateAt))}
                      </time>
                      <span className="font-mono text-sm tabular-nums">
                        {esMXCurrency.format(sale.total)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <Card className="p-0 card-hover-lift">
            <header className="border-b border-border px-4 py-3 sm:px-6">
              <h2 className="text-sm font-semibold tracking-tight">
                Acciones rápidas
              </h2>
            </header>
            <ul role="list" className="flex flex-col">
              {QUICK_ACTIONS.map((action, i) => (
                <li key={action.href}>
                  {i > 0 ? (
                    <span aria-hidden className="block h-px bg-border" />
                  ) : null}
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent sm:px-6"
                  >
                    <span className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
                      {action.icon}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-foreground">
                        {action.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {action.hint}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden
                      className="ml-auto size-4 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </FadeUp>
  );
}

function StatTile({
  delay,
  label,
  value,
  subtitle,
}: {
  delay: number;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div
      className="animate-fade-up card-hover-lift"
      style={{ animationDelay: `${delay * 1000}ms` }}
    >
      <Card className="h-full p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
          {value}
        </p>
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          {subtitle}
        </p>
      </Card>
    </div>
  );
}

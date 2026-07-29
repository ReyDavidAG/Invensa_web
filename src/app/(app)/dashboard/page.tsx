/* Hallmark · locked system applied · src/app/(app)/dashboard/page.tsx
 * Dashboard home. Bento-on-shell: 4 stat tiles on top (2 cols mobile, 4 cols md+),
 * 2/3 + 1/3 split below for recent sales + short actions.
 *
 * Empty-data rule: tiles show `—` with `« datos reales cuando se registren ventas »`
 * until real numbers exist. Never invent metrics.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Receipt, ShoppingCart, UserPlus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inicio",
};

export const dynamic = "force-dynamic";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

type DashboardData = {
  salesToday: { count: number; total: number };
  ticketAvgToday: number | null;
  ticketAvgYesterday: number | null;
  lowStockCount: number;
  pendingCreditClients: number;
  recentSales: Array<{
    id: string;
    ticketNumber: number;
    dateAt: string;
    total: number;
    clientName: string | null;
    status: "paid" | "credit" | "cancelled";
  }>;
};

async function loadDashboard(): Promise<DashboardData> {
  const supabase = await getSupabaseServer();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [salesToday, salesYesterday, stocks, products, pendingCredit, recentSales] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total", { count: "exact", head: false })
      .gte("date_at", todayStart.toISOString())
      .lt("date_at", tomorrowStart.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("sales")
      .select("total")
      .gte("date_at", yesterdayStart.toISOString())
      .lt("date_at", todayStart.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("vw_product_stock")
      .select("product_id, stock_on_hand"),
    supabase
      .from("products")
      .select("id, stock_low_threshold")
      .eq("status", "active"),
    supabase
      .from("vw_client_balances")
      .select("client_id", { count: "exact", head: true })
      .gt("balance", 0),
    supabase
      .from("sales")
      .select("id, ticket_number, date_at, total, status, client_id, clients(name)")
      .order("date_at", { ascending: false })
      .limit(5),
  ]);

  const salesTodayRows = salesToday.data ?? [];
  const todayTotal = salesTodayRows.reduce((s, r) => s + Number(r.total), 0);
  const ticketAvgToday =
    salesTodayRows.length > 0 ? todayTotal / salesTodayRows.length : null;

  const yesterdayRows = salesYesterday.data ?? [];
  const ticketAvgYesterday =
    yesterdayRows.length > 0
      ? yesterdayRows.reduce((s, r) => s + Number(r.total), 0) / yesterdayRows.length
      : null;

  // Low stock: join vw_product_stock with products.stock_low_threshold client-side.
  const stockByProduct = new Map<string, number>(
    (stocks.data ?? []).map((s) => [s.product_id as string, Number(s.stock_on_hand)]),
  );
  const lowStockCount = (products.data ?? []).filter((p) => {
    const onHand = stockByProduct.get(p.id as string) ?? 0;
    return onHand <= Number(p.stock_low_threshold);
  }).length;

  const recent = (recentSales.data ?? []).map((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    return {
      id: row.id as string,
      ticketNumber: Number(row.ticket_number),
      dateAt: row.date_at as string,
      total: Number(row.total),
      clientName: (client?.name as string | undefined) ?? null,
      status: row.status as "paid" | "credit" | "cancelled",
    };
  });

  return {
    salesToday: { count: salesTodayRows.length, total: todayTotal },
    ticketAvgToday,
    ticketAvgYesterday,
    lowStockCount,
    pendingCreditClients: pendingCredit.count ?? 0,
    recentSales: recent,
  };
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fullName = (
    (user?.user_metadata as { full_name?: string } | null)?.full_name ?? ""
  ).trim();

  const data = await loadDashboard();

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Hola{fullName ? `, ${fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen del día en tu tienda.
        </p>
      </header>

      {/* Stat tiles */}
      <section
        aria-label="Indicadores del día"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <StatTile
          label="Ventas hoy"
          value={data.salesToday.count > 0 ? data.salesToday.count.toString() : "—"}
          subtitle={
            data.salesToday.count > 0
              ? `${data.salesToday.count} ${data.salesToday.count === 1 ? "venta" : "ventas"} · ${esMXCurrency.format(data.salesToday.total)}`
              : "« datos reales cuando se registren ventas »"
          }
        />
        <StatTile
          label="Ticket promedio"
          value={data.ticketAvgToday !== null ? esMXCurrency.format(data.ticketAvgToday) : "—"}
          subtitle={
            data.ticketAvgYesterday !== null
              ? `vs ayer ${esMXCurrency.format(data.ticketAvgYesterday)}`
              : data.ticketAvgToday !== null
                ? "sin comparación ayer"
                : "« datos reales cuando se registren ventas »"
          }
        />
        <StatTile
          label="Stock bajo"
          value={data.lowStockCount > 0 ? data.lowStockCount.toString() : "—"}
          subtitle={
            data.lowStockCount > 0
              ? `${data.lowStockCount} ${data.lowStockCount === 1 ? "producto" : "productos"}`
              : "« datos reales cuando se registren ventas »"
          }
        />
        <StatTile
          label="Fiados pendientes"
          value={data.pendingCreditClients > 0 ? data.pendingCreditClients.toString() : "—"}
          subtitle={
            data.pendingCreditClients > 0
              ? `${data.pendingCreditClients} ${data.pendingCreditClients === 1 ? "cliente" : "clientes"} con deuda`
              : "« datos reales cuando se registren ventas »"
          }
        />
      </section>

      {/* Recent sales + actions */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-0">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <h2 className="text-sm font-semibold tracking-tight">Ventas recientes</h2>
            <Link
              href="/sales"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </Link>
          </header>
          {data.recentSales.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <Receipt aria-hidden className="size-8 text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Aún no tienes ventas hoy</p>
                <p className="text-xs text-muted-foreground">
                  Cuando registres una venta aparecerá aquí.
                </p>
              </div>
              <Button
                render={<Link href="/sales" />}
                nativeButton={false}
                size="sm"
                className="mt-2"
              >
                <Plus aria-hidden />
                Registrar primera venta
              </Button>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-border">
              {data.recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
                      {new Date(sale.dateAt).toLocaleString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
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

        <Card className="p-0">
          <header className="border-b border-border px-4 py-3 sm:px-6">
            <h2 className="text-sm font-semibold tracking-tight">Acciones rápidas</h2>
          </header>
          <div className="flex flex-col">
            <QuickAction
              href="/sales"
              icon={<ShoppingCart aria-hidden className="size-4" />}
              label="Registrar venta"
              hint="POS · paso a paso"
            />
            <Separator />
            <QuickAction
              href="/products"
              icon={<Plus aria-hidden className="size-4" />}
              label="Agregar producto"
              hint="Catálogo · alta rápida"
            />
            <Separator />
            <QuickAction
              href="/customers"
              icon={<UserPlus aria-hidden className="size-4" />}
              label="Nuevo cliente"
              hint="Para fiados"
            />
            <Separator />
            <QuickAction
              href="/reports"
              icon={<Wallet aria-hidden className="size-4" />}
              label="Ver reportes"
              hint="Cortes y top productos"
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{subtitle}</p>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent sm:px-6"
    >
      <span className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}

import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Coins,
  CreditCard,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { BarChart, type BarDatum } from "./bar-chart";
import { KpiTile } from "./kpi-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp } from "@/components/motion/fade-up";

export const metadata: Metadata = {
  title: "Reportes",
};

export const dynamic = "force-dynamic";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const esMXCurrencyExact = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

type Period = "today" | "week" | "month";

const PERIOD_DAYS: Record<Period, number> = {
  today: 1,
  week: 7,
  month: 30,
};

const PERIOD_LABEL: Record<Period, string> = {
  today: "Hoy",
  week: "Últimos 7 días",
  month: "Últimos 30 días",
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function periodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  const from = startOfDay(now);
  if (period === "today") {
    return { from, to };
  }
  // For week/month, include N-1 days before today (so 7d = today + 6 prior).
  const days = PERIOD_DAYS[period];
  from.setDate(from.getDate() - (days - 1));
  return { from, to };
}

function chartRange(): { from: Date; to: Date } {
  // Always show the last 14 calendar days for the chart.
  const to = new Date();
  const from = startOfDay(to);
  from.setDate(from.getDate() - 13);
  return { from, to };
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PAYMENT_METHOD_LABEL = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mixed: "Mixto",
} as const;

type SearchParams = Promise<{ period?: string }>;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const period: Period =
    sp.period === "week" || sp.period === "month" ? sp.period : "today";

  const range = periodRange(period);
  const chart = chartRange();

  const supabase = await (
    await import("@/lib/supabase/server")
  ).getSupabaseServer();

  // Parallel fetch — all reads, scoped by date range and chart range.
  const [
    { data: periodSales, error: periodSalesError },
    { data: yesterdaySales, error: yesterdaySalesError },
    { data: chartSales, error: chartSalesError },
    { data: topSaleItems, error: topSaleItemsError },
    { data: lowStock, error: lowStockError },
    { data: stockRows, error: stockRowsError },
    { data: paymentAgg, error: paymentAggError },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "id, total, paid_amount, status, payment_method, client_id, date_at",
      )
      .gte("date_at", range.from.toISOString())
      .lte("date_at", range.to.toISOString())
      .neq("status", "cancelled"),
    // For ticket comparison (only used in "today" period)
    period === "today"
      ? (() => {
          const y = new Date();
          const yStart = startOfDay(y);
          yStart.setDate(yStart.getDate() - 1);
          const yEnd = startOfDay(y);
          return supabase
            .from("sales")
            .select("total")
            .gte("date_at", yStart.toISOString())
            .lt("date_at", yEnd.toISOString())
            .neq("status", "cancelled");
        })()
      : Promise.resolve({ data: [] as Array<{ total: number }>, error: null }),
    supabase
      .from("sales")
      .select("id, total, date_at")
      .gte("date_at", chart.from.toISOString())
      .lte("date_at", chart.to.toISOString())
      .neq("status", "cancelled"),
    // Top products: pull recent sale_items in the period, aggregate client-side.
    supabase
      .from("sale_items")
      .select(
        "quantity, unit_price, subtotal, sales!inner(date_at, status), products(id, code, name)",
      )
      .gte("sales.date_at", range.from.toISOString())
      .lte("sales.date_at", range.to.toISOString())
      .neq("sales.status", "cancelled"),
    supabase
      .from("products")
      .select("id, code, name, stock_low_threshold, image_url")
      .eq("status", "active"),
    // Stock is a view; PostgREST cannot infer an embedded relationship, so
    // query it directly and join in app code (mirrors /products/page.tsx).
    supabase.from("vw_product_stock").select("product_id, stock_on_hand"),
    supabase
      .from("sales")
      .select("payment_method, total")
      .gte("date_at", range.from.toISOString())
      .lte("date_at", range.to.toISOString())
      .neq("status", "cancelled"),
  ]);

  if (periodSalesError)
    console.error("[reports] period sales", periodSalesError);
  if (yesterdaySalesError)
    console.error("[reports] yesterday sales", yesterdaySalesError);
  if (chartSalesError) console.error("[reports] chart sales", chartSalesError);
  if (topSaleItemsError)
    console.error("[reports] top sale items", topSaleItemsError);
  if (lowStockError)
    console.error("[reports] low stock products", lowStockError);
  if (stockRowsError) console.error("[reports] stock rows", stockRowsError);
  if (paymentAggError) console.error("[reports] payment agg", paymentAggError);

  // ── KPIs ─────────────────────────────────────────────────────────
  const periodTotal = (periodSales ?? []).reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );
  const periodCount = (periodSales ?? []).length;
  const ticketAvg = periodCount > 0 ? periodTotal / periodCount : 0;
  const uniqueClients = new Set(
    (periodSales ?? [])
      .map((s) => s.client_id)
      .filter((c): c is string => Boolean(c)),
  ).size;

  // vs ayer — only meaningful for "today" period
  const yesterdayTotal = (yesterdaySales ?? []).reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );
  const yesterdayCount = (yesterdaySales ?? []).length;
  const deltaPct =
    yesterdayTotal > 0
      ? ((periodTotal - yesterdayTotal) / yesterdayTotal) * 100
      : null;

  // ── Daily chart series (14 days, fill missing days with 0) ──────
  const dayMap = new Map<string, number>();
  for (const s of chartSales ?? []) {
    const key = isoDay(new Date(s.date_at));
    dayMap.set(key, (dayMap.get(key) ?? 0) + Number(s.total));
  }
  const chartData: BarDatum[] = [];
  const cursor = new Date(chart.from);
  while (cursor <= chart.to) {
    const key = isoDay(cursor);
    chartData.push({ date: key, total: dayMap.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  // ── Top products (aggregate by product_id) ──────────────────────
  const productAgg = new Map<
    string,
    { id: string; code: string; name: string; units: number; revenue: number }
  >();
  for (const item of topSaleItems ?? []) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    if (!product) continue;
    const id = product.id as string;
    const cur = productAgg.get(id) ?? {
      id,
      code: product.code as string,
      name: product.name as string,
      units: 0,
      revenue: 0,
    };
    cur.units += Number(item.quantity);
    cur.revenue += Number(item.subtotal);
    productAgg.set(id, cur);
  }
  const topProducts = [...productAgg.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const topProductsMax = Math.max(...topProducts.map((p) => p.revenue), 1);

  // ── Low stock (compare view.stock_on_hand with products.stock_low_threshold) ──
  type LowStockRow = {
    id: string;
    code: string;
    name: string;
    imageUrl: string | null;
    stock: number;
    threshold: number;
  };
  const stockByProduct = new Map<string, number>(
    (stockRows ?? []).map((s) => [
      s.product_id as string,
      Number(s.stock_on_hand),
    ]),
  );
  const lowStockList: LowStockRow[] = (lowStock ?? [])
    .map((p) => ({
      id: p.id as string,
      code: p.code as string,
      name: p.name as string,
      imageUrl: (p.image_url as string | null) ?? null,
      stock: stockByProduct.get(p.id as string) ?? 0,
      threshold: Number(p.stock_low_threshold),
    }))
    .filter((p) => p.stock <= p.threshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  // ── Top clients (TOP 5 by total spent) ─────────────────────────
  const clientAgg = new Map<string, number>();
  for (const s of periodSales ?? []) {
    if (!s.client_id) continue;
    clientAgg.set(
      s.client_id,
      (clientAgg.get(s.client_id) ?? 0) + Number(s.total),
    );
  }
  const topClientIds = [...clientAgg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, phone")
    .in("id", topClientIds.length ? topClientIds : ["__none__"]);
  const clientNameById = new Map<string, string>(
    (clientRows ?? []).map((c) => [c.id as string, c.name as string]),
  );
  const topClients = topClientIds.map((id) => ({
    id,
    name: clientNameById.get(id) ?? "Cliente",
    total: clientAgg.get(id) ?? 0,
  }));
  const topClientsMax = Math.max(...topClients.map((c) => c.total), 1);

  // ── Payment methods aggregate ────────────────────────────────────
  const methodAgg = new Map<string, number>();
  for (const s of paymentAgg ?? []) {
    const m = s.payment_method as "cash" | "transfer" | "mixed";
    methodAgg.set(m, (methodAgg.get(m) ?? 0) + Number(s.total));
  }
  const methodEntries = [...methodAgg.entries()].sort((a, b) => b[1] - a[1]);
  const methodTotal = methodEntries.reduce((sum, [, v]) => sum + v, 0);

  const buildUrl = (next: Period) => {
    const p = next === "today" ? undefined : next;
    return p ? `/reports?period=${p}` : "/reports";
  };

  return (
    <FadeUp className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen de {PERIOD_LABEL[period].toLowerCase()}.
          </p>
        </div>
        {/* Period selector */}
        <nav aria-label="Período" className="flex flex-wrap items-center gap-2">
          {(["today", "week", "month"] as const).map((p) => (
            <Link
              key={p}
              href={buildUrl(p) as Route}
              aria-current={period === p ? "page" : undefined}
              className={
                "inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 " +
                (period === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {p === "today" ? "Hoy" : p === "week" ? "7 días" : "30 días"}
            </Link>
          ))}
        </nav>
      </header>

      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      {/* ── KPI tiles ──────────────────────────────────────────── */}
      <section
        aria-label="Indicadores del período"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <KpiTile
          delay={0}
          label="Ventas totales"
          value={esMXCurrency.format(periodTotal)}
          icon={<Coins aria-hidden className="size-4" />}
          subtitle={
            period === "today" && deltaPct !== null
              ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(0)}% vs ayer · ${yesterdayCount} ${yesterdayCount === 1 ? "venta" : "ventas"}`
              : `${periodCount} ${periodCount === 1 ? "venta" : "ventas"} registradas`
          }
        />
        <KpiTile
          delay={0.04}
          label="Ticket promedio"
          value={periodCount > 0 ? esMXCurrency.format(ticketAvg) : "—"}
          icon={<TrendingUp aria-hidden className="size-4" />}
          subtitle={
            periodCount > 0
              ? `Promedio por venta`
              : "« datos reales cuando registre ventas »"
          }
        />
        <KpiTile
          delay={0.08}
          label="Ventas (count)"
          value={periodCount.toString()}
          icon={<ShoppingCart aria-hidden className="size-4" />}
          subtitle={
            period === "today" && yesterdayCount > 0
              ? `ayer: ${yesterdayCount}`
              : period === "today"
                ? "« primer día de operación »"
                : `en ${PERIOD_DAYS[period]} días`
          }
        />
        <KpiTile
          delay={0.12}
          label="Clientes únicos"
          value={uniqueClients.toString()}
          icon={<Users aria-hidden className="size-4" />}
          subtitle={
            uniqueClients > 0
              ? "que compraron"
              : "« datos reales cuando registre ventas »"
          }
        />
      </section>

      {/* ── Bar chart ─────────────────────────────────────────── */}
      <ChartCard
        title="Ventas por día"
        subtitle="Últimos 14 días"
        total={chartData.reduce((sum, d) => sum + d.total, 0)}
      >
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Gráfica con scroll horizontal"
        >
          <BarChart
            data={chartData}
            height={180}
            className="min-w-[420px] px-1 pb-7 pt-2"
          />
        </div>
      </ChartCard>

      {/* ── Top productos + Stock bajo ─────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Productos más vendidos"
          icon={
            <Package aria-hidden className="size-4 text-muted-foreground" />
          }
        >
          {topProducts.length === 0 ? (
            <Empty message="Sin ventas en este período." />
          ) : (
            <ol className="flex flex-col">
              {topProducts.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0 sm:px-6"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.name}
                    </p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(p.revenue / topProductsMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {esMXCurrency.format(p.revenue)}
                    </p>
                    <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {p.units} {p.units === 1 ? "unidad" : "unidades"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </ReportCard>

        <ReportCard
          title="Stock bajo"
          icon={<AlertTriangle aria-hidden className="size-4 text-warning" />}
          badge={
            lowStockList.length > 0 ? (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                {lowStockList.length}
              </span>
            ) : null
          }
        >
          {lowStockList.length === 0 ? (
            <Empty message="Todo el inventario está sobre el umbral." />
          ) : (
            <ul className="flex flex-col">
              {lowStockList.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0 sm:px-6"
                >
                  <span
                    className={
                      "grid size-9 shrink-0 place-items-center rounded-md font-mono text-xs font-semibold tabular-nums " +
                      (p.stock <= 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/15 text-warning")
                    }
                  >
                    {p.stock}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {p.code} · umbral {p.threshold}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ReportCard>
      </section>

      {/* ── Top clientes + Métodos de pago ─────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Top clientes"
          icon={<Users aria-hidden className="size-4 text-muted-foreground" />}
        >
          {topClients.length === 0 ? (
            <Empty message="Sin clientes activos en este período." />
          ) : (
            <ol className="flex flex-col">
              {topClients.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0 sm:px-6"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.name}
                    </p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(c.total / topClientsMax) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {esMXCurrency.format(c.total)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </ReportCard>

        <ReportCard
          title="Métodos de pago"
          icon={
            <CreditCard aria-hidden className="size-4 text-muted-foreground" />
          }
        >
          {methodEntries.length === 0 ? (
            <Empty message="Sin pagos registrados." />
          ) : (
            <ul className="flex flex-col">
              {methodEntries.map(([m, total]) => {
                const pct = methodTotal > 0 ? (total / methodTotal) * 100 : 0;
                return (
                  <li
                    key={m}
                    className="flex items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0 sm:px-6"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                      <Wallet aria-hidden className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {PAYMENT_METHOD_LABEL[
                          m as keyof typeof PAYMENT_METHOD_LABEL
                        ] ?? m}
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                      {esMXCurrency.format(total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </ReportCard>
      </section>

      {/* ── Fiados pendientes (placeholder, fiado disabled) ──────── */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
            <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
            Fiados pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 p-6">
            <p className="text-sm font-medium text-foreground">Próximamente</p>
            <p className="text-xs text-muted-foreground">
              El reporte de fiados se activa cuando se habilite el flujo de
              ventas a crédito en el POS.
            </p>
          </div>
        </CardContent>
      </Card>
    </FadeUp>
  );
}

// ─── Inline components ───────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  total,
  children,
}: {
  title: string;
  subtitle?: string;
  total?: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight">
            {title}
          </CardTitle>
          <div className="text-right">
            {subtitle ? (
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
            {typeof total === "number" ? (
              <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {esMXCurrencyExact.format(total)}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function ReportCard({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
            {icon}
            {title}
          </CardTitle>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="px-6 py-10 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

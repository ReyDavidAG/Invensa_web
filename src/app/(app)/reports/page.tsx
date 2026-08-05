import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  AlertTriangle,
  Coins,
  CreditCard,
  Package,
  PiggyBank,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

import { SalesTrendChart } from "./sales-trend-chart";
import { RankedBarChart } from "./ranked-bar-chart";
import { PaymentMethodsChart } from "./payment-methods-chart";
import { KpiTile } from "./kpi-tile";
import { ReportActions } from "./report-actions";
import { ReportPrintView } from "./report-print-view";
import { PrintRemount } from "./print-remount";
import {
  getReportData,
  parsePeriod,
  PERIOD_DAYS,
  PERIOD_LABEL,
} from "./get-report-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp } from "@/components/motion/fade-up";

export const metadata: Metadata = {
  title: "Reportes",
};

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
type SearchParams = Promise<{ period?: string }>;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // getReportData()'s periodRange()/chartRange() call `new Date()` before any
  // recognized dynamic API — without this, Cache Components rejects it as an
  // unstable prerender value (see src/lib/supabase/server.ts for the same fix).
  await connection();
  const sp = await searchParams;
  const period = parsePeriod(sp.period);

  const reportData = await getReportData(period);
  const {
    periodTotal,
    periodCount,
    ticketAvg,
    uniqueClients,
    yesterdayCount,
    deltaPct,
    chartData,
    topProducts,
    lowStockList,
    topClients,
    methodEntries,
    profitTotal,
    profitMarginPct,
  } = reportData;

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
        <nav
          aria-label="Período"
          data-tour="report-period"
          className="flex flex-wrap items-center gap-2"
        >
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
        data-tour="report-kpis"
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

      {/* ── Sales trend ───────────────────────────────────────── */}
      <ChartCard
        title="Ventas por día"
        subtitle="Últimos 14 días"
        total={chartData.reduce((sum, d) => sum + d.total, 0)}
        tourId="report-chart"
      >
        <SalesTrendChart data={chartData} className="px-2 pb-2" />
      </ChartCard>

      {/* ── Top productos + Stock bajo ─────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Productos más vendidos"
          icon={
            <Package aria-hidden className="size-4 text-muted-foreground" />
          }
          tourId="report-top-products"
        >
          {topProducts.length === 0 ? (
            <Empty message="Sin ventas en este período." />
          ) : (
            <RankedBarChart
              data={topProducts.map((p) => ({
                id: p.id,
                label: p.name,
                value: p.revenue,
                sublabel: `${p.units} ${p.units === 1 ? "unidad" : "unidades"}`,
              }))}
              className="px-2 py-4"
            />
          )}
        </ReportCard>

        <ReportCard
          title="Stock bajo"
          icon={<AlertTriangle aria-hidden className="size-4 text-warning" />}
          tourId="report-stock"
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
            <RankedBarChart
              data={topClients.map((c) => ({
                id: c.id,
                label: c.name,
                value: c.total,
              }))}
              className="px-2 py-4"
            />
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
            <PaymentMethodsChart
              data={methodEntries.map(([method, total]) => ({
                method: method as "cash" | "transfer" | "mixed",
                total,
              }))}
              className="py-4"
            />
          )}
        </ReportCard>
      </section>
    </FadeUp>
  );
}

// ─── Inline components ───────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  total,
  children,
  tourId,
}: {
  title: string;
  subtitle?: string;
  total?: number;
  children: React.ReactNode;
  tourId?: string;
}) {
  return (
    <Card data-tour={tourId}>
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
  tourId,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  tourId?: string;
}) {
  return (
    <Card data-tour={tourId}>
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

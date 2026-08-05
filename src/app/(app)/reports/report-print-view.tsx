import type { CSSProperties } from "react";

import { SalesTrendChart } from "./sales-trend-chart";
import { RankedBarChart } from "./ranked-bar-chart";
import { PaymentMethodsChart } from "./payment-methods-chart";
import { PERIOD_LABEL, type ReportData } from "./get-report-data";
import { formatDateTimeLong } from "@/lib/datetime";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

// Locked to the Taller theme's LIGHT values, independent of the app's active
// theme — a printed report should always be white paper + dark ink, never a
// snapshot of whatever mode the screen happened to be in. Custom properties
// set inline win over any stylesheet rule (including `.dark`) and cascade
// down, so the reused chart components below resolve `var(--chart-1)` etc.
// to these fixed values regardless of ambient dark mode.
const LIGHT_TOKENS = {
  "--background": "oklch(0.97 0.012 80)",
  "--foreground": "oklch(0.22 0.008 70)",
  "--card": "oklch(0.995 0.005 80)",
  "--card-foreground": "oklch(0.22 0.008 70)",
  "--muted-foreground": "oklch(0.52 0.008 75)",
  "--border": "oklch(0.90 0.012 75)",
  "--primary": "oklch(0.55 0.16 250)",
  "--success": "oklch(0.62 0.155 145)",
  "--warning": "oklch(0.70 0.18 65)",
  "--destructive": "oklch(0.55 0.215 28)",
  "--chart-1": "oklch(0.55 0.16 250)",
  "--chart-2": "oklch(0.70 0.18 65)",
  "--chart-3": "oklch(0.62 0.155 145)",
  "--chart-4": "oklch(0.62 0.215 28)",
  "--chart-5": "oklch(0.55 0.13 180)",
} as CSSProperties;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid border-t border-[oklch(0.90_0.012_75)] pt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[oklch(0.22_0.008_70)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-[oklch(0.52_0.008_75)]">
        {label}
      </span>
      <span className="font-mono text-base font-semibold text-[oklch(0.22_0.008_70)]">
        {value}
      </span>
      {note ? (
        <span className="text-[10px] text-[oklch(0.52_0.008_75)]">{note}</span>
      ) : null}
    </div>
  );
}

function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-[oklch(0.52_0.008_75)]">
        Sin datos en este período.
      </p>
    );
  }
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-[oklch(0.90_0.012_75)] text-left">
          {columns.map((c) => (
            <th
              key={c}
              className="py-1 pr-3 font-medium uppercase tracking-wide text-[oklch(0.52_0.008_75)]"
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-[oklch(0.90_0.012_75)]/50">
            {row.map((cell, j) => (
              <td key={j} className="py-1 pr-3 text-[oklch(0.22_0.008_70)]">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ReportPrintView({ data }: { data: ReportData }) {
  const {
    period,
    periodTotal,
    periodCount,
    ticketAvg,
    uniqueClients,
    chartData,
    topProducts,
    lowStockList,
    topClients,
    methodEntries,
    profitTotal,
    profitMarginPct,
  } = data;

  return (
    <div
      data-print-report
      aria-hidden="true"
      style={LIGHT_TOKENS}
      // `invisible absolute` (not `hidden`/display:none) — Recharts measures
      // its container via ResizeObserver on mount, and a display:none parent
      // measures 0x0 and spams a console warning. Staying in normal layout
      // (just invisible + out of flow) keeps it measurable on screen; print
      // media flips it back to a normal, visible, static-flow block.
      className="invisible absolute inset-0 print:visible print:static print:flex print:flex-col print:gap-4 print:bg-[oklch(0.97_0.012_80)] print:p-6 print:text-[oklch(0.22_0.008_70)]"
    >
      {/* ── Letterhead ─────────────────────────────────────────── */}
      <header className="flex items-baseline justify-between border-b-2 border-[oklch(0.55_0.16_250)] pb-3">
        <div>
          <p className="text-xl font-bold tracking-tight">Invensa</p>
          <p className="text-sm text-[oklch(0.52_0.008_75)]">
            Reporte de ventas · {PERIOD_LABEL[period]}
          </p>
        </div>
        <p className="text-xs text-[oklch(0.52_0.008_75)]">
          Generado el {formatDateTimeLong(new Date())}
        </p>
      </header>

      {/* ── KPI summary ──────────────────────────────────────────── */}
      <section className="grid grid-cols-5 gap-4 break-inside-avoid">
        <Stat label="Ventas totales" value={esMXCurrency.format(periodTotal)} />
        <Stat
          label="Ticket promedio"
          value={periodCount > 0 ? esMXCurrency.format(ticketAvg) : "—"}
        />
        <Stat label="Ventas" value={periodCount.toString()} />
        <Stat label="Clientes únicos" value={uniqueClients.toString()} />
        <Stat
          label="Ganancias"
          value={esMXCurrency.format(profitTotal)}
          note={
            profitMarginPct !== null
              ? `Margen ${profitMarginPct.toFixed(0)}% · costo actual del producto`
              : "costo actual del producto"
          }
        />
      </section>

      <Section title="Ventas por día">
        <SalesTrendChart data={chartData} className="h-[200px]" />
      </Section>

      <Section title="Productos más vendidos">
        {topProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <RankedBarChart
              data={topProducts.map((p) => ({
                id: p.id,
                label: p.name,
                value: p.revenue,
              }))}
            />
            <Table
              columns={["SKU", "Producto", "Unid.", "Ingresos", "Ganancia"]}
              rows={topProducts.map((p) => [
                p.code,
                p.name,
                p.units,
                esMXCurrency.format(p.revenue),
                esMXCurrency.format(p.profit),
              ])}
            />
          </div>
        ) : (
          <p className="text-xs text-[oklch(0.52_0.008_75)]">
            Sin ventas en este período.
          </p>
        )}
      </Section>

      <Section title="Top clientes">
        {topClients.length > 0 ? (
          <RankedBarChart
            data={topClients.map((c) => ({
              id: c.id,
              label: c.name,
              value: c.total,
            }))}
          />
        ) : (
          <p className="text-xs text-[oklch(0.52_0.008_75)]">
            Sin clientes activos en este período.
          </p>
        )}
      </Section>

      <Section title="Métodos de pago">
        {methodEntries.length > 0 ? (
          <PaymentMethodsChart
            data={methodEntries.map(([method, total]) => ({
              method: method as "cash" | "transfer" | "mixed",
              total,
            }))}
            className="mx-0"
          />
        ) : (
          <p className="text-xs text-[oklch(0.52_0.008_75)]">
            Sin pagos registrados.
          </p>
        )}
      </Section>

      <Section title="Stock bajo">
        <Table
          columns={["SKU", "Producto", "Stock", "Umbral"]}
          rows={lowStockList.map((p) => [p.code, p.name, p.stock, p.threshold])}
        />
      </Section>
    </div>
  );
}

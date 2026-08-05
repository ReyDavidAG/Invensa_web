import type { CSSProperties } from "react";

import { PERIOD_LABEL, type ReportData } from "./get-report-data";
import { formatDateTimeLong, formatDayMonth } from "@/lib/datetime";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

// Locked to plain white paper + neutral ink, independent of the app's active
// theme — a printed report should always be a flat white page, never a
// snapshot of whatever mode the screen happened to be in, and never the
// Taller theme's warm cream paper tone either (that read as an unwanted sand
// band/border around the tables). Custom properties set inline win over any
// stylesheet rule (including `.dark`) and cascade down, so the reused chart
// components below resolve `var(--chart-1)` etc. to these fixed values
// regardless of ambient dark mode.
const LIGHT_TOKENS = {
  "--background": "oklch(1 0 0)",
  "--foreground": "oklch(0.2 0 0)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.2 0 0)",
  "--muted-foreground": "oklch(0.5 0 0)",
  "--border": "oklch(0.88 0 0)",
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
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid border-t border-[oklch(0.88_0_0)] pt-4">
      <h2 className="mb-2 flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wide text-[oklch(0.2_0_0)]">
        {title}
        {subtitle ? (
          <span className="text-[10px] font-normal normal-case tracking-normal text-[oklch(0.5_0_0)]">
            {subtitle}
          </span>
        ) : null}
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
      <span className="text-[10px] uppercase tracking-wide text-[oklch(0.5_0_0)]">
        {label}
      </span>
      <span className="font-mono text-base font-semibold text-[oklch(0.2_0_0)]">
        {value}
      </span>
      {note ? (
        <span className="text-[10px] text-[oklch(0.5_0_0)]">{note}</span>
      ) : null}
    </div>
  );
}

// Bank-statement register: banded header, zebra rows, right-aligned tabular
// figures, an optional bold totals row, and an optional tinted "running
// balance" column (`highlightCol`) — the visual anchor real account
// statements use to draw the eye down a single running total.
type Column = { label: string; align?: "left" | "right"; mono?: boolean };

function Table({
  columns,
  rows,
  footer,
  highlightCol,
}: {
  columns: Column[];
  rows: Array<Array<string | number>>;
  footer?: Array<string | number>;
  highlightCol?: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-[oklch(0.5_0_0)]">
        Sin datos en este período.
      </p>
    );
  }
  const cellClass = (col: Column | undefined, i: number) =>
    "px-3 py-1 " +
    (col?.align === "right" ? "text-right tabular-nums" : "text-left") +
    (col?.mono ? " font-mono" : "") +
    (i === highlightCol ? " bg-[oklch(0.55_0.16_250)]/6" : "");

  return (
    <table className="w-full border-collapse overflow-hidden rounded-sm border border-[oklch(0.88_0_0)] text-xs">
      <thead>
        <tr className="border-b-2 border-[oklch(0.55_0.16_250)] bg-[oklch(0.55_0.16_250)]/8">
          {columns.map((c, i) => (
            <th
              key={c.label}
              className={
                "py-1.5 font-semibold uppercase tracking-wide text-[oklch(0.2_0_0)] " +
                cellClass(c, i)
              }
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className="border-b border-[oklch(0.88_0_0)]/60 even:bg-[oklch(0.96_0_0)]/60"
          >
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={
                  "text-[oklch(0.2_0_0)] " + cellClass(columns[ci], ci)
                }
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer ? (
        <tfoot>
          <tr className="border-t-2 border-[oklch(0.2_0_0)]">
            {footer.map((cell, ci) => (
              <td
                key={ci}
                className={
                  "font-semibold text-[oklch(0.2_0_0)] " +
                  cellClass(columns[ci], ci)
                }
              >
                {cell}
              </td>
            ))}
          </tr>
        </tfoot>
      ) : null}
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
    profitTotal,
    profitMarginPct,
  } = data;

  // Ventas por día — daily register with a running balance ("Acumulado"),
  // the way a bank statement carries a saldo down the right edge.
  const cumulativeTotals = chartData.map((_, i) =>
    chartData.slice(0, i + 1).reduce((sum, d) => sum + d.total, 0),
  );
  const dailyRows = chartData.map((d, i) => [
    formatDayMonth(`${d.date}T12:00:00Z`),
    d.count.toString(),
    esMXCurrency.format(d.total),
    esMXCurrency.format(cumulativeTotals[i]),
  ]);
  const dailyTotalCount = chartData.reduce((sum, d) => sum + d.count, 0);
  const dailyTotalRevenue = cumulativeTotals.at(-1) ?? 0;
  const dailyFooter = [
    "Total",
    dailyTotalCount.toString(),
    esMXCurrency.format(dailyTotalRevenue),
    esMXCurrency.format(dailyTotalRevenue),
  ];

  // Productos más vendidos — full register (unidades, ingresos, costo,
  // ganancia y % de participación), not just the top-5 bar comparison.
  const productsRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
  const productRows = topProducts.map((p) => [
    p.code,
    p.name,
    p.units.toString(),
    esMXCurrency.format(p.revenue),
    esMXCurrency.format(p.cost),
    esMXCurrency.format(p.profit),
    productsRevenue > 0
      ? `${((p.revenue / productsRevenue) * 100).toFixed(1)}%`
      : "—",
  ]);
  const productFooter = [
    "Total",
    "",
    topProducts.reduce((sum, p) => sum + p.units, 0).toString(),
    esMXCurrency.format(productsRevenue),
    esMXCurrency.format(topProducts.reduce((sum, p) => sum + p.cost, 0)),
    esMXCurrency.format(topProducts.reduce((sum, p) => sum + p.profit, 0)),
    "100%",
  ];

  // Top clientes — name + total spent, plain register (no chart).
  const clientRows = topClients.map((c) => [
    c.name,
    esMXCurrency.format(c.total),
  ]);
  const clientFooter = [
    "Total",
    esMXCurrency.format(topClients.reduce((sum, c) => sum + c.total, 0)),
  ];

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
      className="invisible absolute inset-0 print:visible print:static print:flex print:flex-col print:gap-4 print:bg-white print:p-6 print:text-[oklch(0.2_0_0)]"
    >
      {/* ── Letterhead ─────────────────────────────────────────── */}
      <header className="flex items-baseline justify-between border-b-2 border-[oklch(0.55_0.16_250)] pb-3">
        <div>
          <p className="text-xl font-bold tracking-tight">Invensa</p>
          <p className="text-sm text-[oklch(0.5_0_0)]">
            Reporte de ventas · {PERIOD_LABEL[period]}
          </p>
        </div>
        <p className="text-xs text-[oklch(0.5_0_0)]">
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

      <Section title="Ventas por día" subtitle={PERIOD_LABEL[period]}>
        <Table
          columns={[
            { label: "Fecha" },
            { label: "Tickets", align: "right" },
            { label: "Total del día", align: "right" },
            { label: "Acumulado", align: "right" },
          ]}
          rows={dailyRows}
          footer={dailyFooter}
          highlightCol={3}
        />
      </Section>

      <Section title="Productos más vendidos">
        <Table
          columns={[
            { label: "SKU", mono: true },
            { label: "Producto" },
            { label: "Unid.", align: "right" },
            { label: "Ingresos", align: "right" },
            { label: "Costo", align: "right" },
            { label: "Ganancia", align: "right" },
            { label: "% Ingresos", align: "right" },
          ]}
          rows={productRows}
          footer={productFooter}
        />
      </Section>

      <Section title="Top clientes">
        <Table
          columns={[{ label: "Cliente" }, { label: "Total", align: "right" }]}
          rows={clientRows}
          footer={clientFooter}
        />
      </Section>

      <Section title="Stock bajo">
        <Table
          columns={[
            { label: "SKU", mono: true },
            { label: "Producto" },
            { label: "Stock", align: "right" },
            { label: "Umbral", align: "right" },
          ]}
          rows={lowStockList.map((p) => [p.code, p.name, p.stock, p.threshold])}
        />
      </Section>
    </div>
  );
}

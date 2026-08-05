export type RankedDatum = {
  id: string;
  label: string;
  value: number;
  sublabel?: string;
};

// Cycle rank position through the theme's 5-color chart palette — a
// dynamic top-5 list has no fixed identity per row, so color-by-rank
// (not color-by-series) is what makes each bar distinguishable at a glance.
const RANK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

// Plain HTML/CSS bars, not Recharts — a previous SVG-based version (a
// vertical BarChart with a category YAxis) silently dropped the row label
// text on-screen for some containers while the bar and value still
// rendered fine, and was hard to pin down further without live devtools.
// A flex list + width-percentage bars can't have that failure mode: the
// label is ordinary text using the same classes as the rest of the app.
export function RankedBarChart({
  data,
  className,
}: {
  data: RankedDatum[];
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {data.map((row, i) => (
        <div key={row.id} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="truncate text-xs font-medium text-foreground"
              title={row.label}
            >
              {row.label}
            </span>
            <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-foreground">
              {esMXCurrency.format(row.value)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(row.value / max) * 100}%`,
                backgroundColor: RANK_COLORS[i % RANK_COLORS.length],
              }}
            />
          </div>
          {row.sublabel ? (
            <span className="text-[10px] text-muted-foreground">
              {row.sublabel}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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

const chartConfig = {
  value: { label: "Total" },
} satisfies ChartConfig;

// Defined here, not passed in as a prop — a function can't cross the
// server/client boundary (this component is "use client", its data comes
// from a Server Component), so formatting has to happen on this side.
const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function RankedBarChart({
  data,
  className,
}: {
  data: RankedDatum[];
  className?: string;
}) {
  // Recharts renders categories top-to-bottom in array order; reverse so
  // rank #1 lands at the top of the chart, matching the numbered lists
  // elsewhere on this page.
  const rows = [...data].reverse();
  const height = Math.max(rows.length * 44, 44);

  return (
    <ChartContainer
      config={chartConfig}
      className={`aspect-auto w-full ${className ?? ""}`}
      style={{ height }}
    >
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 0, right: 56, top: 4, bottom: 4 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={120}
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) =>
            v.length > 18 ? `${v.slice(0, 17)}…` : v
          }
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <span>
                  {item.payload.label}: {esMXCurrency.format(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="value" radius={4} barSize={22}>
          {rows.map((row, i) => (
            <Cell
              key={row.id}
              fill={RANK_COLORS[(data.length - 1 - i) % RANK_COLORS.length]}
            />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground text-xs font-medium tabular-nums"
            formatter={(v) => esMXCurrency.format(Number(v))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

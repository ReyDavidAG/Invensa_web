"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDayMonth } from "@/lib/datetime";

// `count` isn't plotted here (the on-screen chart only needs `total`) — it
// rides along for the print view's detailed daily table (report-print-view.tsx).
export type SalesTrendDatum = { date: string; total: number; count: number };

const chartConfig = {
  total: { label: "Ventas", color: "var(--chart-1)" },
} satisfies ChartConfig;

const esMXCurrencyShort = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
  notation: "compact",
});

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function SalesTrendChart({
  data,
  className,
}: {
  data: SalesTrendDatum[];
  className?: string;
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className={`aspect-auto h-[220px] w-full ${className ?? ""}`}
    >
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-total)"
              stopOpacity={0.35}
            />
            <stop
              offset="95%"
              stopColor="var(--color-total)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDayMonth(`${v}T12:00:00Z`)}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(v) => esMXCurrencyShort.format(Number(v))}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(v) => formatDayMonth(`${v}T12:00:00Z`)}
              formatter={(value) => esMXCurrency.format(Number(value))}
            />
          }
        />
        <Area
          dataKey="total"
          type="monotone"
          fill="url(#salesTrendFill)"
          stroke="var(--color-total)"
          strokeWidth={2}
          dot={false}
          isAnimationActive
        />
      </AreaChart>
    </ChartContainer>
  );
}

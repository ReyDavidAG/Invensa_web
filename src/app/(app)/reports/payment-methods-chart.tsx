"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type PaymentMethodDatum = {
  method: "cash" | "transfer" | "mixed";
  total: number;
};

// Fixed per-category colors (not rank-based) — cash/transfer/mixed are
// stable identities across every visit, so the same method should always
// read as the same color.
const chartConfig = {
  cash: { label: "Efectivo", color: "var(--chart-1)" },
  transfer: { label: "Transferencia", color: "var(--chart-5)" },
  mixed: { label: "Mixto", color: "var(--chart-2)" },
} satisfies ChartConfig;

// Defined here, not passed in as a prop — a function can't cross the
// server/client boundary (this component is "use client", its data comes
// from a Server Component), so formatting has to happen on this side.
const esMXCurrencyExact = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function PaymentMethodsChart({
  data,
  className,
}: {
  data: PaymentMethodDatum[];
  className?: string;
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className={`mx-auto aspect-square max-h-[220px] ${className ?? ""}`}
    >
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="method"
              formatter={(value, _name, item) => (
                <span>
                  {chartConfig[item.payload.method as keyof typeof chartConfig]
                    ?.label ?? item.payload.method}
                  : {esMXCurrencyExact.format(Number(value))}
                </span>
              )}
            />
          }
        />
        <Pie
          data={data}
          dataKey="total"
          nameKey="method"
          innerRadius={48}
          outerRadius={80}
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell
              key={entry.method}
              fill={
                chartConfig[entry.method]?.color ?? "var(--muted-foreground)"
              }
            />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="method" />} />
      </PieChart>
    </ChartContainer>
  );
}

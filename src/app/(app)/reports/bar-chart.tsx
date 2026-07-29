"use client";

/* Hallmark · locked system applied (Taller) · src/app/(app)/reports/bar-chart.tsx
 * Daily sales bar chart. Pure SVG, no chart library. Bars animate from
 * height 0 to their target via motion with a small per-bar stagger.
 */

import { motion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type BarDatum = {
  date: string;
  total: number;
};

type Props = {
  data: BarDatum[];
  height?: number;
  className?: string;
};

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const dayLabel = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});

export function BarChart({ data, height = 180, className }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.total), 1);
  const barWidth = 100 / Math.max(data.length, 1);
  const innerWidth = barWidth * 0.7;
  const innerX = (barWidth - innerWidth) / 2;
  const labelStride = data.length > 10 ? Math.ceil(data.length / 7) : 1;
  const viewBox = "0 0 100 " + String(height);

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        role="img"
        aria-label="Ventas por día"
      >
        <line
          x1={0}
          x2={100}
          y1={height - 0.5}
          y2={height - 0.5}
          stroke="var(--border)"
          strokeWidth={0.2}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const x = i * barWidth + innerX;
          const h = (d.total / max) * (height - 20);
          const y = height - 0.5 - h;
          const isZero = d.total === 0;
          const isHover = hoverIdx === i;
          const fill = isZero
            ? "var(--muted)"
            : isHover
              ? "var(--primary)"
              : "var(--primary)";
          const opacity = isZero ? 0.55 : isHover ? 1 : 0.7;
          return (
            <g key={d.date}>
              <motion.rect
                x={x}
                y={y}
                width={innerWidth}
                height={Math.max(h, isZero ? 0.6 : 0)}
                rx={0.6}
                fill={fill}
                fillOpacity={opacity}
                initial={{ height: 0, y: height - 0.5 }}
                animate={{ height: Math.max(h, isZero ? 0.6 : 0), y }}
                transition={{
                  duration: 0.42,
                  delay: i * 0.022,
                  ease: [0.16, 1, 0.3, 1],
                }}
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={i * barWidth}
                y={0}
                width={barWidth}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            </g>
          );
        })}
        {data.map((d, i) => {
          if (i % labelStride !== 0) return null;
          const date = new Date(d.date + "T12:00:00");
          return (
            <text
              key={"label-" + d.date}
              x={i * barWidth + barWidth / 2}
              y={height + 0.5}
              fontSize={3.2}
              textAnchor="middle"
              fill="var(--muted-foreground)"
              fontFamily="var(--font-mono)"
              style={{ pointerEvents: "none" }}
            >
              {dayLabel.format(date)}
            </text>
          );
        })}
      </svg>
      {hoverIdx !== null && data[hoverIdx] ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md"
          style={{
            left: (hoverIdx + 0.5) * barWidth + "%",
            top: 0,
          }}
        >
          <p className="font-medium text-foreground">
            {dayLabel.format(new Date(data[hoverIdx].date + "T12:00:00"))}
          </p>
          <p className="font-mono tabular-nums text-muted-foreground">
            {esMXCurrency.format(data[hoverIdx].total)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

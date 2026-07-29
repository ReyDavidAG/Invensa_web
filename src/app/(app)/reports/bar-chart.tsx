"use client";

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
  const labelStride = data.length > 10 ? Math.ceil(data.length / 7) : 1;
  // 1 viewBox unit = one day slot. Total width = data.length.
  const viewBoxWidth = Math.max(data.length, 1);

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        role="img"
        aria-label="Ventas por día"
      >
        {/* Baseline */}
        <line
          x1={0}
          x2={viewBoxWidth}
          y1={height - 0.5}
          y2={height - 0.5}
          stroke="var(--border)"
          strokeWidth={0.1}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const slotX = i;
          const barX = i + 0.15;
          const barW = 0.7;
          const h = (d.total / max) * (height - 20);
          const y = height - 0.5 - h;
          const isZero = d.total === 0;
          const isHover = hoverIdx === i;
          const opacity = isZero ? 0.55 : isHover ? 1 : 0.7;
          return (
            <g key={d.date}>
              <motion.rect
                x={barX}
                y={y}
                width={barW}
                height={Math.max(h, isZero ? 0.6 : 0)}
                rx={0.15}
                fill="var(--primary)"
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
              {/* Invisible hover target per day slot */}
              <rect
                x={slotX}
                y={0}
                width={1}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML labels — never stretched. Reserve space below the SVG. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex"
        style={{ height: "1.25rem" }}
      >
        {data.map((d, i) => (
          <div
            key={`label-${d.date}`}
            className="flex items-center justify-center font-mono text-[10px] tabular-nums text-muted-foreground"
            style={{ flex: 1 }}
          >
            {i % labelStride === 0
              ? dayLabel.format(new Date(d.date + "T12:00:00"))
              : null}
          </div>
        ))}
      </div>

      {hoverIdx !== null && data[hoverIdx] ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md"
          style={{
            left: `${((hoverIdx + 0.5) / data.length) * 100}%`,
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

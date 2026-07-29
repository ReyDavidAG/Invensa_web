"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiTileProps = {
  delay: number;
  label: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
};

export function KpiTile({ delay, label, value, subtitle, icon }: KpiTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="contents"
    >
      <Card className={cn("card-hover-lift h-full p-4")}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
          {value}
        </p>
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          {subtitle}
        </p>
      </Card>
    </motion.div>
  );
}

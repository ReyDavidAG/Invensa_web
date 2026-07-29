/* Hallmark · locked system applied · src/app/(app)/products/products-filter-chip.tsx
 * One filter chip — a link with active/inactive styling. Coral underline +
 * foreground when active, muted text + hover wash when not.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilterChipProps = {
  href: string;
  active: boolean;
  children: ReactNode;
};

export function ProductsFilterChip({
  href,
  active,
  children,
}: FilterChipProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

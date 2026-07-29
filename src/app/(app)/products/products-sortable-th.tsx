import Link from "next/link";
import type { Route } from "next";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SortableThProps = {
  column: string;
  sort: string;
  dir: "asc" | "desc";
  buildUrl: (overrides: Record<string, string | undefined>) => string;
  align?: "left" | "right";
  children: ReactNode;
};

export function ProductsSortableTh({
  column,
  sort,
  dir,
  buildUrl,
  align = "left",
  children,
}: SortableThProps) {
  const isActive = sort === column;
  const nextDir = isActive && dir === "asc" ? "desc" : "asc";
  const href = buildUrl({
    sort: column,
    dir: nextDir,
    page: undefined,
  });

  const Icon = !isActive ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 font-medium",
        align === "right" ? "text-right" : "text-left",
        isActive && "text-foreground",
      )}
    >
      <Link
        href={href as Route}
        scroll={false}
        aria-label={`Ordenar por ${typeof children === "string" ? children : column} (${
          isActive
            ? dir === "asc"
              ? "ascendente"
              : "descendente"
            : "ascendente"
        })`}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded",
          align === "right" && "flex-row-reverse",
        )}
      >
        {children}
        <Icon aria-hidden className="size-3" />
      </Link>
    </th>
  );
}

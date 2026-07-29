/* Hallmark · locked system applied · src/app/(app)/products/products-pagination.tsx
 * Pagination footer with prev / next + page indicator. URL-driven — server
 * re-fetches on every page change. Windowed to ±2 pages around the current.
 */

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  buildUrl: (overrides: Record<string, string | undefined>) => string;
};

export function ProductsPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  buildUrl,
}: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground">
        {totalCount} {totalCount === 1 ? "producto" : "productos"}
      </p>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      <p className="text-muted-foreground">
        Mostrando <span className="font-medium tabular-nums text-foreground">{start}–{end}</span> de{" "}
        <span className="font-medium tabular-nums text-foreground">{totalCount}</span> · Página{" "}
        <span className="font-medium tabular-nums text-foreground">{page}</span> de{" "}
        <span className="font-medium tabular-nums text-foreground">{totalPages}</span>
      </p>

      <ul role="list" className="flex items-center gap-1">
        <li>
          <PageLink
            href={buildUrl({ page: page > 1 ? String(page - 1) : undefined })}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </PageLink>
        </li>
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <PageLink
                href={buildUrl({ page: p === 1 ? undefined : String(p) })}
                active={p === page}
                aria-label={`Página ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </PageLink>
            </li>
          ),
        )}
        <li>
          <PageLink
            href={buildUrl({ page: page < totalPages ? String(page + 1) : undefined })}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            <ChevronRight aria-hidden className="size-4" />
          </PageLink>
        </li>
      </ul>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-2 text-muted-foreground/40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
  const span = 2;
  const set = new Set<number>([1, total, current]);
  for (let i = Math.max(1, current - span); i <= Math.min(total, current + span); i++) {
    set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

/* Hallmark · locked system applied (Taller) · src/app/(app)/sales/page.tsx
 * Sales list — minimal, focused on getting to the POS fast. Filter by
 * date range and status. Recent sales at top, paginated below.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ventas",
};

export const dynamic = "force-dynamic";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const esMXDateTime = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

const STATUS_LABELS = {
  paid: { label: "Pagado", className: "bg-success/10 text-success" },
  credit: { label: "Fiado", className: "bg-warning/15 text-warning" },
  cancelled: {
    label: "Cancelado",
    className: "bg-secondary text-secondary-foreground",
  },
} as const;

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const statusFilter = sp.status ?? "all";

  const supabase = await getSupabaseServer();

  let query = supabase
    .from("sales")
    .select(
      "id, ticket_number, date_at, total, paid_amount, status, payment_method, client_id, clients(name)",
      { count: "exact" },
    )
    .order("date_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const offset = (page - 1) * PAGE_SIZE;
  const { data: sales, count } = await query.range(
    offset,
    offset + PAGE_SIZE - 1,
  );

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (page !== 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/sales?${qs}` : "/sales";
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Ventas
        </h1>
        <Button render={<Link href="/sales/new" />} nativeButton={false}>
          <Plus aria-hidden className="size-4" />
          Nueva venta
        </Button>
      </header>

      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      {/* Status filter */}
      <nav
        aria-label="Filtros de estado"
        className="flex flex-wrap items-center gap-2"
      >
        {[
          { value: "all", label: "Todas" },
          { value: "paid", label: "Pagadas" },
          { value: "cancelled", label: "Canceladas" },
        ].map((f) => (
          <Link
            key={f.value}
            href={buildUrl({
              status: f.value === "all" ? undefined : f.value,
              page: undefined,
            })}
            aria-current={statusFilter === f.value ? "page" : undefined}
            className={
              "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 " +
              (statusFilter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {totalCount === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <Receipt
            aria-hidden
            className="mx-auto size-8 text-muted-foreground/60"
          />
          <p className="mt-3 text-sm font-medium text-foreground">
            Aún no tienes ventas registradas
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cuando registres una venta aparecerá aquí.
          </p>
          <Button
            render={<Link href="/sales/new" />}
            nativeButton={false}
            className="mt-4"
          >
            <Plus aria-hidden className="size-4" />
            Registrar primera venta
          </Button>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Ticket
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-medium"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-medium"
                  >
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(sales ?? []).map((s) => {
                  const client = Array.isArray(s.clients)
                    ? s.clients[0]
                    : s.clients;
                  const statusMeta =
                    STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ??
                    STATUS_LABELS.paid;
                  return (
                    <tr key={s.id} className="bg-background hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                        #{s.ticket_number}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        <time>{esMXDateTime.format(new Date(s.date_at))}</time>
                      </td>
                      <td className="px-4 py-2.5">
                        {client?.name ?? (
                          <span className="text-muted-foreground">
                            Cliente ocasional
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={
                            "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide " +
                            statusMeta.className
                          }
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm tabular-nums">
                        {esMXCurrency.format(Number(s.total))}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/sales/${s.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          aria-label={`Ver venta #${s.ticket_number}`}
                        >
                          <ChevronRight aria-hidden className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium tabular-nums text-foreground">
                {Math.min(offset + 1, totalCount)}–
                {Math.min(offset + PAGE_SIZE, totalCount)}
              </span>{" "}
              de{" "}
              <span className="font-medium tabular-nums text-foreground">
                {totalCount}
              </span>
              {totalPages > 1 ? (
                <>
                  {" · Página "}
                  <span className="font-medium tabular-nums text-foreground">
                    {page}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {totalPages}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

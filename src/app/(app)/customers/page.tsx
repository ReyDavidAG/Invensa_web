/* Hallmark · locked system applied (Taller) · src/app/(app)/customers/page.tsx
 * Customers list. URL-driven filters (search + active filter + pagination).
 * Click any row → detail page.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Mail, Phone, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeUp } from "@/components/motion/fade-up";
import { getSupabaseServer } from "@/lib/supabase/server";

import { CustomersSearch } from "./customers-search";

export const metadata: Metadata = {
  title: "Clientes",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

type SearchParams = Promise<{
  q?: string;
  active?: string;
  page?: string;
}>;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const active = sp.active ?? "all";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const supabase = await getSupabaseServer();

  // Per-row "compras totales" uses an aggregate via the sales table.
  // We fetch the recent 50 sales and join client totals in JS for an MVP
  // (a view can replace this later).
  let query = supabase
    .from("clients")
    .select("id, name, phone, email, address, notes, active, created_at", {
      count: "exact",
    })
    .order("name", { ascending: true });

  if (active !== "all") {
    query = query.eq("active", active === "active");
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const offset = (page - 1) * PAGE_SIZE;
  const { data: clients, count } = await query.range(
    offset,
    offset + PAGE_SIZE - 1,
  );

  // Aggregate sales totals per client in one query
  const clientIds = (clients ?? []).map((c) => c.id as string);
  const { data: salesAgg } = clientIds.length
    ? await supabase
        .from("sales")
        .select("client_id, total, date_at")
        .in("client_id", clientIds)
        .neq("status", "cancelled")
    : { data: [] };
  const salesByClient = new Map<
    string,
    { total: number; count: number; lastAt: string | null }
  >();
  for (const s of salesAgg ?? []) {
    if (!s.client_id) continue;
    const cur = salesByClient.get(s.client_id) ?? {
      total: 0,
      count: 0,
      lastAt: null,
    };
    cur.total += Number(s.total);
    cur.count += 1;
    if (!cur.lastAt || s.date_at > cur.lastAt) cur.lastAt = s.date_at;
    salesByClient.set(s.client_id, cur);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (active !== "all") params.set("active", active);
    if (page !== 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/customers?${qs}` : "/customers";
  };

  return (
    <FadeUp className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Clientes
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          <CustomersSearch defaultValue={q} />
          <Button render={<Link href="/customers/new" />} nativeButton={false}>
            <Plus aria-hidden className="size-4" />
            <span>Nuevo</span>
          </Button>
        </div>
      </header>

      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      {/* Status filter */}
      <nav
        aria-label="Filtros de estado"
        className="flex flex-wrap items-center gap-2"
      >
        {[
          { value: "all", label: "Todos" },
          { value: "active", label: "Activos" },
          { value: "inactive", label: "Inactivos" },
        ].map((f) => (
          <Link
            key={f.value}
            href={buildUrl({
              active: f.value === "all" ? undefined : f.value,
              page: undefined,
            })}
            aria-current={active === f.value ? "page" : undefined}
            className={
              "inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 " +
              (active === f.value
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
          <Users
            aria-hidden
            className="mx-auto size-8 text-muted-foreground/60"
          />
          <p className="mt-3 text-sm font-medium text-foreground">
            {q
              ? "Sin resultados para esta búsqueda"
              : "Aún no tienes clientes registrados"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {q
              ? "Prueba con otros términos o limpia la búsqueda."
              : "Cuando registres clientes aparecerán aquí."}
          </p>
          {!q ? (
            <Button
              render={<Link href="/customers/new" />}
              nativeButton={false}
              className="mt-4"
            >
              <Plus aria-hidden className="size-4" />
              Agregar primer cliente
            </Button>
          ) : null}
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Nombre
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Contacto
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-medium"
                  >
                    Compras
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
                {(clients ?? []).map((c) => {
                  const stats = salesByClient.get(c.id as string);
                  return (
                    <tr
                      key={c.id}
                      className="bg-background transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          {c.phone ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone aria-hidden className="size-3" />
                              <span className="font-mono tabular-nums">
                                {c.phone}
                              </span>
                            </span>
                          ) : null}
                          {c.email ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail aria-hidden className="size-3" />
                              {c.email}
                            </span>
                          ) : null}
                          {!c.phone && !c.email ? (
                            <span className="text-xs text-muted-foreground/60">
                              —
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={
                            "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide " +
                            (c.active
                              ? "bg-success/10 text-success"
                              : "bg-secondary text-secondary-foreground")
                          }
                        >
                          {c.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {stats ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                              {esMXCurrency.format(stats.total)}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {stats.count}{" "}
                              {stats.count === 1 ? "venta" : "ventas"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/customers/${c.id}`}
                          className="inline-flex h-10 w-10 min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          aria-label={`Ver ${c.name}`}
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
        </>
      )}
    </FadeUp>
  );
}

/* Hallmark · locked system applied (Taller) · src/app/(app)/customers/[id]/page.tsx
 * Customer detail. Header (avatar + name + contact) + stats (total compras,
 * última compra) + recent purchases table + actions (edit / archive).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Mail,
  MapPin,
  NotebookText,
  Pencil,
  Phone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase/server";

import { ArchiveCustomerButton } from "./archive-button";

export const dynamic = "force-dynamic";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const esMXDate = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const esMXDateTime = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("clients")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.name ?? "Cliente" };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const [{ data: client }, { data: sales }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, email, address, notes, active, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("sales")
      .select("id, ticket_number, date_at, total, paid_amount, status")
      .eq("client_id", id)
      .neq("status", "cancelled")
      .order("date_at", { ascending: false })
      .limit(10),
  ]);

  if (!client) notFound();

  const totalPurchases = (sales ?? []).reduce(
    (sum, s) => sum + Number(s.total),
    0,
  );
  const lastSale = (sales ?? [])[0];
  const initials = client.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-md bg-primary/10 text-lg font-semibold text-primary">
            {initials || <User aria-hidden className="size-6" />}
          </div>
          <div>
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft aria-hidden className="size-3.5" />
              Clientes
            </Link>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
              {client.name}
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide " +
                  (client.active
                    ? "bg-success/10 text-success"
                    : "bg-secondary text-secondary-foreground")
                }
              >
                {client.active ? "Activo" : "Inactivo"}
              </span>
            </h1>
          </div>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Button
              render={<Link href={`/customers/${client.id}/edit`} />}
              nativeButton={false}
              variant="outline"
            >
              <Pencil aria-hidden className="size-4" />
              Editar
            </Button>
            {client.active ? (
              <ArchiveCustomerButton
                customerId={client.id}
                customerName={client.name}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Left: contact + stats + recent purchases ────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-4 card-hover-lift">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total comprado
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {totalPurchases > 0 ? esMXCurrency.format(totalPurchases) : "—"}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {(sales ?? []).length === 0
                  ? "« datos reales cuando registre ventas »"
                  : `${(sales ?? []).length} ${(sales ?? []).length === 1 ? "venta" : "ventas"} registradas`}
              </p>
            </Card>
            <Card className="p-4 card-hover-lift">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Última compra
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {lastSale ? esMXCurrency.format(Number(lastSale.total)) : "—"}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {lastSale
                  ? esMXDate.format(new Date(lastSale.date_at))
                  : "« datos reales cuando registre ventas »"}
              </p>
            </Card>
          </div>

          {/* Recent purchases */}
          <Card className="p-0">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">
                Compras recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {(sales ?? []).length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Aún no hay compras registradas para este cliente.
                </p>
              ) : (
                <ul role="list" className="divide-y divide-border">
                  {(sales ?? []).map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          #{s.ticket_number}
                        </span>
                        <time className="hidden text-xs text-muted-foreground sm:block">
                          {esMXDateTime.format(new Date(s.date_at))}
                        </time>
                      </div>
                      <Link
                        href={`/sales/${s.id}`}
                        className="font-mono text-sm font-semibold tabular-nums text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
                      >
                        {esMXCurrency.format(Number(s.total))}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Right: contact + notes ──────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {client.phone ? (
                <div className="flex items-center gap-3">
                  <Phone
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="font-mono tabular-nums">{client.phone}</span>
                </div>
              ) : null}
              {client.email ? (
                <div className="flex items-center gap-3">
                  <Mail
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">{client.email}</span>
                </div>
              ) : null}
              {client.address ? (
                <div className="flex items-start gap-3">
                  <MapPin
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <span>{client.address}</span>
                </div>
              ) : null}
              {!client.phone && !client.email && !client.address ? (
                <p className="text-xs text-muted-foreground">
                  Sin datos de contacto registrados.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {client.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
                  <NotebookText
                    aria-hidden
                    className="size-4 text-muted-foreground"
                  />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{client.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

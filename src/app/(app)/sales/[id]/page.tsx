/* Hallmark · locked system applied (Taller) · src/app/(app)/sales/[id]/page.tsx
 * Sale detail / receipt view. Server component. Shows header (ticket + date
 * + client + status), line items with qty/price/subtotal, payment info
 * (paid vs total, change if cash, fiado balance if credit), and inventory
 * movements linked to the sale.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Printer,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const esMXDateTime = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
});

const STATUS_META = {
  paid: {
    label: "Pagado",
    className: "bg-success/10 text-success",
  },
  credit: {
    label: "Fiado",
    className: "bg-warning/15 text-warning",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-secondary text-secondary-foreground",
  },
} as const;

const PAYMENT_METHOD_LABEL = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mixed: "Mixto",
} as const;

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("sales")
    .select("ticket_number")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.ticket_number ? `Venta #${data.ticket_number}` : "Venta",
  };
}

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: sale } = await supabase
    .from("sales")
    .select(
      "id, ticket_number, date_at, total, paid_amount, status, payment_method, notes, client_id, clients(name, phone)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!sale) notFound();

  const [{ data: items }, { data: movements }] = await Promise.all([
    supabase
      .from("sale_items")
      .select(
        "id, quantity, unit_price, subtotal, products(id, code, name, units(code, name))",
      )
      .eq("sale_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("inventory_movements")
      .select(
        "id, movement_type, quantity, quantity_adj, note, created_at, products(code, name)",
      )
      .eq("sale_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const statusMeta =
    STATUS_META[sale.status as keyof typeof STATUS_META] ?? STATUS_META.paid;
  const paymentLabel =
    PAYMENT_METHOD_LABEL[
      sale.payment_method as keyof typeof PAYMENT_METHOD_LABEL
    ];
  const total = Number(sale.total);
  const paid = Number(sale.paid_amount);
  const outstanding = Math.max(0, total - paid);
  const client = Array.isArray(sale.clients) ? sale.clients[0] : sale.clients;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/sales"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft aria-hidden className="size-3.5" />
            Ventas
          </Link>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            <span className="font-mono">#{sale.ticket_number}</span>
            <span
              className={
                "rounded-full px-2.5 py-1 text-xs font-medium " +
                statusMeta.className
              }
            >
              {statusMeta.label}
            </span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {esMXDateTime.format(new Date(sale.date_at))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sale.status === "paid" ? (
            <Button
              variant="outline"
              onClick={() => window.print()}
              render={<button type="button" />}
              nativeButton={false}
            >
              <Printer aria-hidden className="size-4" />
              Imprimir
            </Button>
          ) : null}
        </div>
      </div>

      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Line items ─────────────────────────────────────────── */}
        <Card className="lg:col-span-2 p-0">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {(items ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Sin líneas registradas.
              </p>
            ) : (
              <ul role="list" className="divide-y divide-border">
                {(items ?? []).map((item) => {
                  const product = Array.isArray(item.products)
                    ? item.products[0]
                    : item.products;
                  const unit = product
                    ? Array.isArray(product.units)
                      ? product.units[0]
                      : product.units
                    : null;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {Number(item.quantity)}×
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {product?.name ?? "Producto"}
                          </p>
                          <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                            {product?.code ?? ""}
                            {unit ? ` · ${unit.code}` : ""} ·{" "}
                            {esMXCurrency.format(Number(item.unit_price))} c/u
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {esMXCurrency.format(Number(item.subtotal))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {/* Total */}
            <div className="border-t border-border px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Total
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  {esMXCurrency.format(total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Sidebar: client + payment ───────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
                <User aria-hidden className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {client?.name ?? "Cliente ocasional"}
                </p>
                {client?.phone ? (
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {client.phone}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">
                Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <DetailRow label="Método">{paymentLabel}</DetailRow>
              {sale.status === "paid" ? (
                <>
                  <DetailRow label="Recibido">
                    <span className="font-mono tabular-nums">
                      {esMXCurrency.format(paid)}
                    </span>
                  </DetailRow>
                  {paid > total ? (
                    <DetailRow label="Cambio">
                      <span className="font-mono tabular-nums text-success">
                        {esMXCurrency.format(paid - total)}
                      </span>
                    </DetailRow>
                  ) : null}
                </>
              ) : (
                <>
                  <DetailRow label="Abonado">
                    <span className="font-mono tabular-nums">
                      {esMXCurrency.format(paid)}
                    </span>
                  </DetailRow>
                  <div className="flex items-center justify-between gap-4 rounded-md bg-warning/10 px-3 py-2">
                    <span className="text-xs font-medium text-warning">
                      Saldo pendiente
                    </span>
                    <span className="font-mono text-base font-semibold tabular-nums text-warning">
                      {esMXCurrency.format(outstanding)}
                    </span>
                  </div>
                </>
              )}
              {sale.notes ? (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Notas
                    </span>
                    <p className="text-sm">{sale.notes}</p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Inventory movements (for context) */}
          {(movements ?? []).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Movimientos de inventario
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-xs">
                {(movements ?? []).map((m) => {
                  const product = Array.isArray(m.products)
                    ? m.products[0]
                    : m.products;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 text-muted-foreground"
                    >
                      <span className="truncate">
                        <CircleSlash
                          aria-hidden
                          className="mr-1 inline size-3 align-middle"
                        />
                        {product?.name ?? "—"}
                      </span>
                      <span className="font-mono tabular-nums">
                        −{Number(m.quantity).toString()}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Next sale link */}
      <div className="flex justify-end">
        <Button
          render={<Link href="/sales/new" />}
          nativeButton={false}
          variant="outline"
        >
          Registrar otra venta
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}

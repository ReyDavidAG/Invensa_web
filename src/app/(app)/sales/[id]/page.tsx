import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, CircleSlash, Hash, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FadeUp } from "@/components/motion/fade-up";
import { getSupabaseServer } from "@/lib/supabase/server";

import { NewSaleLink } from "./new-sale-link";
import { PrintButton } from "./print-button";
import { PrintReceipt } from "./print-receipt";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const esMXDate = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
});

const esMXTime = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_META = {
  paid: { label: "Pagado", tone: "success" },
  credit: { label: "Fiado", tone: "warning" },
  cancelled: { label: "Cancelado", tone: "muted" },
} as const;

const PAYMENT_METHOD_LABEL = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mixed: "Mixto",
} as const;

type StatusTone = "success" | "warning" | "muted";

const STATUS_BADGE_CLASS: Record<StatusTone, string> = {
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
  warning: "bg-warning/15 text-warning ring-1 ring-inset ring-warning/20",
  muted: "bg-secondary text-secondary-foreground ring-1 ring-inset ring-border",
};

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
        "id, quantity, unit_price, subtotal, products(id, code, name, image_url, units(code, name))",
      )
      .eq("sale_id", id),
    supabase
      .from("inventory_movements")
      .select(
        "id, movement_type, quantity, quantity_adj, note, created_at, products(code, name)",
      )
      .eq("sale_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const statusKey = sale.status as keyof typeof STATUS_META;
  const statusMeta = STATUS_META[statusKey] ?? STATUS_META.paid;
  const paymentLabel =
    PAYMENT_METHOD_LABEL[
      sale.payment_method as keyof typeof PAYMENT_METHOD_LABEL
    ];
  const total = Number(sale.total);
  const paid = Number(sale.paid_amount);
  const change = paid > total ? paid - total : 0;
  const outstanding = Math.max(0, total - paid);
  const client = Array.isArray(sale.clients) ? sale.clients[0] : sale.clients;
  const itemCount = (items ?? []).length;
  const lineItems = (items ?? []).map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;
    const unit = product
      ? Array.isArray(product.units)
        ? product.units[0]
        : product.units
      : null;
    return { item, product, unit };
  });
  const saleDate = new Date(sale.date_at);

  return (
    <>
      {/* ─── Print-only receipt ─────────────────────────────────── */}
      {/* Rendered outside the FadeUp so the print path is not affected
          by the entrance animation. */}
      <PrintReceipt
        ticketNumber={Number(sale.ticket_number)}
        dateAt={sale.date_at}
        status={statusKey}
        paymentMethod={sale.payment_method as "cash" | "transfer" | "mixed"}
        clientName={client?.name ?? null}
        clientPhone={client?.phone ?? null}
        notes={sale.notes ?? null}
        total={total}
        paid={paid}
        items={lineItems.map(({ item, product, unit }) => ({
          id: item.id as string,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          productName: product?.name ?? "Producto",
          productCode: (product?.code as string | null) ?? "—",
          unitCode: (unit?.code as string | null) ?? null,
        }))}
      />

      <FadeUp className="flex flex-col gap-8">
        {/* ─── Hero header (hidden on print) ──────────────────────── */}
        <header
          className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-start sm:justify-between"
          data-tour="sale-detail-header"
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/sales"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
            >
              <ArrowLeft aria-hidden className="size-3.5" />
              Ventas
            </Link>
            <div className="flex flex-wrap items-baseline gap-3">
              <span
                aria-hidden
                className="inline-flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground"
              >
                <Hash className="size-4" />
              </span>
              <h1 className="font-mono text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
                #{sale.ticket_number}
              </h1>
              <Badge
                variant="outline"
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[statusMeta.tone]}`}
              >
                {statusMeta.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {esMXDate.format(saleDate)} · {esMXTime.format(saleDate)}
              {client ? ` · ${client.name}` : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {sale.status === "paid" ? (
              <span data-tour="sale-detail-print">
                <PrintButton />
              </span>
            ) : null}
          </div>
        </header>

        <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

        {/* ─── Main grid (hidden on print) ─────────────────────────── */}
        <div className="grid gap-6 print:hidden lg:grid-cols-3">
          {/* Productos card — col-span-2 on lg+ */}
          <Card
            className="lg:col-span-2 overflow-hidden p-0"
            data-tour="sale-detail-items"
          >
            <CardHeader className="border-b border-border bg-muted/20 px-4 py-3 sm:px-6">
              <div className="flex items-baseline justify-between gap-3">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Productos
                </CardTitle>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {lineItems.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Sin líneas registradas.
                </p>
              ) : (
                <ul role="list" className="divide-y divide-border">
                  {lineItems.map(({ item, product, unit }) => {
                    const imageUrl = product?.image_url as string | null;
                    const lineSubtotal = Number(item.subtotal);
                    const lineUnitPrice = Number(item.unit_price);
                    const lineQty = Number(item.quantity);
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6"
                      >
                        <div className="size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:size-16">
                          {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt={product?.name ?? "Producto"}
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover"
                            />
                          ) : (
                            <div
                              aria-hidden
                              className="grid size-full place-items-center text-muted-foreground/50"
                            >
                              <Hash className="size-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {product?.name ?? "Producto"}
                          </p>
                          <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                            {product?.code ?? "—"}
                            {unit ? ` · ${unit.code}` : null}
                            <span className="hidden sm:inline">
                              {" "}
                              · {esMXCurrency.format(lineUnitPrice)} c/u
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
                          <span className="grid h-8 min-w-10 place-items-center rounded-md bg-muted px-2 font-mono text-sm font-semibold tabular-nums text-foreground">
                            ×{lineQty}
                          </span>
                          <div className="hidden sm:block sm:min-w-20 sm:text-right">
                            <p className="font-mono text-sm tabular-nums text-muted-foreground">
                              {esMXCurrency.format(lineUnitPrice)}
                            </p>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              c/u
                            </p>
                          </div>
                          <div className="min-w-20 text-right">
                            <p className="font-mono text-base font-semibold tabular-nums text-foreground sm:text-lg">
                              {esMXCurrency.format(lineSubtotal)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Total footer */}
              <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Total
                  </span>
                  <span className="font-mono text-3xl font-bold tracking-[-0.02em] tabular-nums text-foreground sm:text-4xl">
                    {esMXCurrency.format(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar — Cliente, Pago, Inventario */}
          <div className="flex flex-col gap-4">
            {/* Cliente */}
            <Card className="p-0" data-tour="sale-detail-client">
              <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3 px-4 pb-4 sm:px-6 sm:pb-5">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
                >
                  <User className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {client?.name ?? "Cliente ocasional"}
                  </p>
                  {client?.phone ? (
                    <p className="font-mono text-xs tabular-nums text-muted-foreground">
                      {client.phone}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sin teléfono registrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pago */}
            <Card className="p-0" data-tour="sale-detail-totals">
              <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 px-4 pb-4 sm:px-6 sm:pb-5">
                <DetailRow label="Método">{paymentLabel}</DetailRow>
                {sale.status === "paid" ? (
                  <>
                    <DetailRow label="Recibido">
                      <span className="font-mono tabular-nums">
                        {esMXCurrency.format(paid)}
                      </span>
                    </DetailRow>
                    {change > 0 ? (
                      <DetailRow label="Cambio">
                        <span className="font-mono text-base font-semibold tabular-nums text-success">
                          {esMXCurrency.format(change)}
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
                    <div className="flex items-baseline justify-between gap-3 rounded-md bg-warning/10 px-3 py-2.5 ring-1 ring-inset ring-warning/20">
                      <span className="text-xs font-medium uppercase tracking-[0.06em] text-warning">
                        Saldo pendiente
                      </span>
                      <span className="font-mono text-lg font-bold tabular-nums text-warning">
                        {esMXCurrency.format(outstanding)}
                      </span>
                    </div>
                  </>
                )}
                {sale.notes ? (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        Notas
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">
                        {sale.notes}
                      </p>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Inventario afectado */}
            {(movements ?? []).length > 0 ? (
              <Card className="p-0">
                <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Inventario afectado
                    </CardTitle>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {movements?.length ?? 0}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                  <ul role="list" className="flex flex-col">
                    {movements?.map((m, idx) => {
                      const product = Array.isArray(m.products)
                        ? m.products[0]
                        : m.products;
                      const qty = Number(m.quantity);
                      return (
                        <li
                          key={m.id}
                          className={
                            "flex items-center gap-3 py-2 text-sm " +
                            (idx > 0 ? "border-t border-border" : "")
                          }
                        >
                          <span
                            aria-hidden
                            className="grid size-8 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive"
                          >
                            <ArrowDown className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-foreground">
                            {product?.name ?? "—"}
                          </span>
                          <span className="font-mono text-sm font-semibold tabular-nums text-destructive">
                            −{qty}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {(movements ?? []).some((m) => m.note) ? (
                    <p className="mt-3 flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <CircleSlash
                        aria-hidden
                        className="mt-0.5 size-3 shrink-0"
                      />
                      <span className="leading-snug">
                        {movements?.find((m) => m.note)?.note}
                      </span>
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        {/* ─── Next sale link (hidden on print) ─────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-6 print:hidden">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            Todas las ventas
          </Link>
          <NewSaleLink />
        </div>
      </FadeUp>
    </>
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
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground">
        {children}
      </span>
    </div>
  );
}

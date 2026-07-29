/* Hallmark · locked system applied · src/app/(app)/products/[id]/page.tsx
 * Product detail page. Server component: fetch product + category + unit +
 * current stock + last 20 inventory movements. Admin sees Edit / Archive;
 * everyone else sees read-only.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ImageIcon, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase/server";

import { ArchiveButton } from "./archive-button";

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

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.name ?? "Producto" };
}

export default async function ProductDetailPage({ params }: PageProps) {
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

  const [{ data: product }, { data: stockRow }, { data: movements }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, code, name, price_sale, price_buy, status, image_url, categories(name), units(code, name)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("vw_product_stock")
        .select("stock_on_hand")
        .eq("product_id", id)
        .maybeSingle(),
      supabase
        .from("inventory_movements")
        .select(
          "id, movement_type, quantity, quantity_adj, unit_price, note, created_at",
        )
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!product) notFound();

  const category = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;
  const unit = Array.isArray(product.units) ? product.units[0] : product.units;
  const stock = Number(stockRow?.stock_on_hand ?? 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft aria-hidden className="size-3.5" />
            Productos
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
            {product.code}
          </p>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Button
              render={<Link href={`/products/${product.id}/edit`} />}
              nativeButton={false}
              variant="outline"
            >
              <Pencil aria-hidden className="size-4" />
              Editar
            </Button>
            {product.status === "active" ? (
              <ArchiveButton
                productId={product.id}
                productName={product.name}
              />
            ) : (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                Archivado
              </span>
            )}
          </div>
        ) : null}
      </div>

      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column — image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Imagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="aspect-square w-full rounded-lg border border-border bg-muted object-cover"
              />
            ) : (
              <div
                aria-label="Sin imagen"
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground"
              >
                <ImageIcon
                  aria-hidden
                  className="size-8 text-muted-foreground/60"
                />
                <span>Sin imagen</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column — details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Detalles
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border text-sm">
            <DetailRow label="Categoría">{category?.name ?? "—"}</DetailRow>
            <DetailRow label="Unidad">
              {unit ? `${unit.name} (${unit.code})` : "—"}
            </DetailRow>
            <DetailRow label="Precio de compra">
              <span className="font-mono tabular-nums">
                {esMXCurrency.format(Number(product.price_buy))}
              </span>
            </DetailRow>
            <DetailRow label="Precio de venta">
              <span className="font-mono tabular-nums">
                {esMXCurrency.format(Number(product.price_sale))}
              </span>
            </DetailRow>
            <DetailRow label="Stock actual">
              <span
                className={
                  stock <= 0
                    ? "font-mono text-base font-semibold tabular-nums text-destructive"
                    : stock <= 5
                      ? "font-mono text-base font-semibold tabular-nums text-warning"
                      : "font-mono text-base font-semibold tabular-nums text-foreground"
                }
              >
                {stock} {unit ? unit.code : ""}
              </span>
            </DetailRow>
          </CardContent>
        </Card>
      </div>

      {/* Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-tight">
            Movimientos recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(movements ?? []).length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Sin movimientos registrados.
            </p>
          ) : (
            <ul role="list" className="divide-y divide-border">
              {(movements ?? []).map((m) => {
                const delta =
                  m.movement_type === "in"
                    ? `+${m.quantity}`
                    : m.movement_type === "out"
                      ? `-${m.quantity}`
                      : `${Number(m.quantity_adj) >= 0 ? "+" : ""}${m.quantity_adj}`;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={
                          m.movement_type === "in"
                            ? "rounded-sm bg-success/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-success"
                            : m.movement_type === "out"
                              ? "rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground"
                              : "rounded-sm bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning"
                        }
                      >
                        {m.movement_type === "in"
                          ? "Entrada"
                          : m.movement_type === "out"
                            ? "Salida"
                            : "Ajuste"}
                      </span>
                      <span className="truncate text-sm">{m.note ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm tabular-nums">
                        {delta}
                      </span>
                      <time className="hidden text-xs text-muted-foreground sm:block">
                        {esMXDateTime.format(new Date(m.created_at))}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
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
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}

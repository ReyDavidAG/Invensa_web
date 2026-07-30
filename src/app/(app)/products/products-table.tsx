"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BulkInventoryMovementDialog } from "@/components/form/bulk-inventory-movement-dialog";
import { BulkPhotoAssignDialog } from "@/components/form/bulk-photo-assign-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export type ProductRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  categoryCode: string;
  stock: number;
  stockLowThreshold: number;
  priceSale: number;
  imageUrl: string | null;
};

type Props = {
  products: ProductRow[];
};

export function ProductsTable({ products }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const allSelected =
    products.length > 0 && selectedIds.size === products.length;

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(products.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectedProducts = products.filter((p) => selectedIds.has(p.id));
  const selectedNames = selectedProducts.map((p) => p.name).slice(0, 5);
  const selectedIdsArray = Array.from(selectedIds);

  if (products.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center">
        <CardContent className="flex flex-col items-center gap-3 p-0">
          <p className="text-sm font-medium text-foreground">
            Aún no tienes productos registrados
          </p>
          <p className="text-xs text-muted-foreground">
            Cuando registres un producto aparecerá aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border" data-tour="product-table">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="w-10 px-4 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Seleccionar todos"
                />
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                SKU
              </th>
              <th scope="col" className="w-12 px-1 py-2.5 font-medium">
                <span className="sr-only">Imagen</span>
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Nombre
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Categoría
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Stock
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                Precio
              </th>
              <th scope="col" className="px-4 py-2.5 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const stock = p.stock;
              const lowStock = stock <= Number(p.stockLowThreshold);
              const outOfStock = stock <= 0;
              return (
                <tr key={p.id} className="bg-background hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={(v) => toggleOne(p.id, v === true)}
                      aria-label={`Seleccionar ${p.name}`}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {p.code}
                  </td>
                  <td className="px-1 py-2">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-9 rounded-md border border-border bg-muted object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid size-9 place-items-center rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground"
                      >
                        <ImageIcon className="size-4" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
                      >
                        {p.name}
                      </Link>
                      {p.imageUrl ? null : (
                        <Badge
                          variant="outline"
                          className="shrink-0 rounded-full bg-warning/15 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-warning ring-1 ring-inset ring-warning/20"
                        >
                          Sin foto
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {p.category}
                  </td>
                  <td
                    className={
                      outOfStock
                        ? "px-4 py-2.5 text-right font-mono text-sm tabular-nums text-destructive"
                        : lowStock
                          ? "px-4 py-2.5 text-right font-mono text-sm tabular-nums text-warning"
                          : "px-4 py-2.5 text-right font-mono text-sm tabular-nums text-foreground"
                    }
                  >
                    {stock}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm tabular-nums">
                    {esMXCurrency.format(p.priceSale)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className="inline-flex h-10 w-10 min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      aria-label={`Ver ${p.name}`}
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

      {selectedIdsArray.length > 0 ? (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tabular-nums text-foreground">
              {selectedIdsArray.length} seleccionados
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
            >
              <X aria-hidden className="size-3.5" />
              Limpiar
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInventoryOpen(true)}
            >
              Registrar movimiento
            </Button>
            <Button type="button" size="sm" onClick={() => setPhotoOpen(true)}>
              Asignar foto
            </Button>
          </div>
        </div>
      ) : null}

      <BulkInventoryMovementDialog
        productIds={selectedIdsArray}
        productNames={selectedNames}
        open={inventoryOpen}
        onOpenChange={setInventoryOpen}
      />
      <BulkPhotoAssignDialog
        productIds={selectedIdsArray}
        productNames={selectedNames}
        open={photoOpen}
        onOpenChange={(open) => {
          setPhotoOpen(open);
          if (!open) router.refresh();
        }}
      />
    </>
  );
}

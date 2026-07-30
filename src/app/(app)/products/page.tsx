import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BulkImportTrigger } from "./bulk-import-trigger";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeUp } from "@/components/motion/fade-up";
import { getSupabaseServer } from "@/lib/supabase/server";

import { ProductsFilterChip } from "./products-filter-chip";
import { ProductsPagination } from "./products-pagination";
import { ProductsSearch } from "./products-search";
import { ProductsTable } from "./products-table";

export const metadata: Metadata = {
  title: "Productos",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const esMXCurrency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

type SearchParams = Promise<{
  q?: string;
  cat?: string;
  page?: string;
  sort?: string;
  dir?: string;
}>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const q = (sp.q ?? "").trim();
  const cat = sp.cat ?? "all";
  const sort = sp.sort ?? "name";
  const dir: "asc" | "desc" = sp.dir === "desc" ? "desc" : "asc";

  const supabase = await getSupabaseServer();

  // Current user's role (gates the "+ Nuevo" button).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  // Categories for filter chips.
  const { data: categories } = await supabase
    .from("categories")
    .select("id, code, name")
    .order("sort_order", { ascending: true });

  // Products query — joined to categories for the chip + display name.
  let query = supabase
    .from("products")
    .select(
      "id, code, name, price_sale, status, stock_low_threshold, image_url, categories!inner(code, name)",
      { count: "exact" },
    )
    .eq("status", "active");

  if (cat !== "all") {
    query = query.eq("categories.code", cat);
  }
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const sortColumn = sort === "price" ? "price_sale" : "code";
  query = query.order(sortColumn, { ascending: dir === "asc" });

  const offset = (page - 1) * PAGE_SIZE;
  const { data: products, count } = await query.range(
    offset,
    offset + PAGE_SIZE - 1,
  );

  // Stock per product — separate query then client-side join.
  const productIds = (products ?? []).map((p) => p.id as string);
  const { data: stocks } = productIds.length
    ? await supabase
        .from("vw_product_stock")
        .select("product_id, stock_on_hand")
        .in("product_id", productIds)
    : { data: [] };

  const stockByProduct = new Map<string, number>(
    (stocks ?? []).map((s) => [
      s.product_id as string,
      Number(s.stock_on_hand),
    ]),
  );

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Build a URL that preserves filters + overrides the given ones.
  const buildUrl = (overrides: Record<string, string | undefined>): string => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat !== "all") params.set("cat", cat);
    if (sort !== "name") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    if (page !== 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const hasActiveFilters = q.length > 0 || cat !== "all";

  // Map server rows to the shape the client ProductsTable expects.
  const productRows = (products ?? []).map((p) => {
    const category = Array.isArray(p.categories)
      ? p.categories[0]
      : p.categories;
    return {
      id: p.id as string,
      code: p.code as string,
      name: p.name as string,
      category: (category?.name as string | null) ?? "—",
      categoryCode: (category?.code as string | null) ?? "",
      stock: stockByProduct.get(p.id as string) ?? 0,
      stockLowThreshold: Number(p.stock_low_threshold),
      priceSale: Number(p.price_sale),
      imageUrl: (p.image_url as string | null) ?? null,
    };
  });

  return (
    <FadeUp className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Productos
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          <ProductsSearch defaultValue={q} />
          {isAdmin ? (
            <>
              <BulkImportTrigger />
              <Button
                render={<Link href="/products/new" />}
                nativeButton={false}
                data-tour="product-create"
              >
                <Plus aria-hidden />
                <span>Nuevo</span>
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {/* 4px coral rule per design.md §6.4 */}
      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      {/* Filter chips */}
      <nav
        aria-label="Filtros de categoría"
        data-tour="product-filters"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-medium text-muted-foreground">
          Categoría:
        </span>
        <ProductsFilterChip
          href={buildUrl({ cat: undefined, page: undefined })}
          active={cat === "all"}
        >
          Todas
        </ProductsFilterChip>
        {(categories ?? []).map((c) => (
          <ProductsFilterChip
            key={c.id}
            href={buildUrl({ cat: c.code, page: undefined })}
            active={cat === c.code}
          >
            {c.name}
          </ProductsFilterChip>
        ))}
      </nav>

      {/* Table */}
      {totalCount === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            {hasActiveFilters
              ? "Sin resultados para esta búsqueda"
              : "Aún no tienes productos registrados"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasActiveFilters
              ? "Prueba con otros filtros o limpia la búsqueda."
              : "Cuando agregues productos aparecerán aquí."}
          </p>
          {!hasActiveFilters && isAdmin ? (
            <Button
              render={<Link href="/products/new" />}
              nativeButton={false}
              className="mt-4"
            >
              <Plus aria-hidden />
              Agregar primer producto
            </Button>
          ) : null}
        </Card>
      ) : (
        <ProductsTable products={productRows} />
      )}

      {/* Pagination */}
      <ProductsPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        buildUrl={buildUrl}
      />
    </FadeUp>
  );
}

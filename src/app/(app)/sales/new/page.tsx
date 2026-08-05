import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

import { PosClient, type PosProduct } from "./pos-client";

export const metadata: Metadata = {
  title: "Nueva venta",
};

type RecentProduct = {
  product_id: string;
  count: number;
  last_sold_at: string;
};

// Computed per request to avoid module-level staleness in a long-running
// server process (we used to inline `Date.now()` in render, which the
// React Compiler purity rule rejects).
function getRecentCutoff(): string {
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
}

export default async function NewSalePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Active products with current stock. Server-side join via the view —
  // Supabase doesn't join views to tables natively, so we fetch stock
  // separately and merge in the client.
  const [
    { data: products },
    { data: stocks },
    { data: recentsAgg },
    { data: clients },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, code, name, price_sale, status, image_url")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(500),
    supabase.from("vw_product_stock").select("product_id, stock_on_hand"),
    supabase
      .from("sale_items")
      .select("product_id, sale_id, sales(date_at)")
      .gte("sales.date_at", getRecentCutoff())
      .limit(500),
    supabase
      .from("clients")
      .select("id, name, phone")
      .eq("active", true)
      .order("name", { ascending: true })
      .limit(200),
  ]);

  // Build stock map
  const stockByProduct = new Map<string, number>(
    (stocks ?? []).map((s) => [
      s.product_id as string,
      Number(s.stock_on_hand),
    ]),
  );

  // Build products list with stock joined
  const productsWithStock: PosProduct[] = (products ?? []).map((p) => ({
    id: p.id as string,
    code: p.code as string,
    name: p.name as string,
    priceSale: Number(p.price_sale),
    stock: stockByProduct.get(p.id as string) ?? 0,
    imageUrl: (p.image_url as string | null) ?? null,
  }));

  // Aggregate recent products by id, sort by count desc, take top 5
  const recentMap = new Map<string, RecentProduct>();
  for (const item of recentsAgg ?? []) {
    const sale = Array.isArray(item.sales) ? item.sales[0] : item.sales;
    if (!sale) continue;
    const existing = recentMap.get(item.product_id as string);
    if (existing) {
      existing.count += 1;
      if (sale.date_at > existing.last_sold_at) {
        existing.last_sold_at = sale.date_at;
      }
    } else {
      recentMap.set(item.product_id as string, {
        product_id: item.product_id as string,
        count: 1,
        last_sold_at: sale.date_at,
      });
    }
  }
  const recentIds = [...recentMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((r) => r.product_id);
  const recentProducts = recentIds
    .map((id) => productsWithStock.find((p) => p.id === id))
    .filter((p): p is PosProduct => Boolean(p));

  return (
    <PosClient
      products={productsWithStock}
      recentProducts={recentProducts}
      clients={(clients ?? []).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        phone: (c.phone as string | null) ?? null,
      }))}
    />
  );
}

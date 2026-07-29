/* Hallmark · locked system applied · src/app/(app)/products/[id]/edit/page.tsx
 * Edit product page. Server component: fetch the product + lookups, check
 * admin, render the edit form pre-populated with current values.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

import { EditProductForm } from "./products-edit-form";

export const dynamic = "force-dynamic";

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
  return { title: data?.name ? `Editar · ${data.name}` : "Editar producto" };
}

export default async function EditProductPage({ params }: PageProps) {
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
  if (profile?.role !== "admin") notFound();

  const [{ data: product }, { data: categories }, { data: units }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, code, name, price_sale, price_buy, stock_low_threshold, image_url, category_id, unit_id")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("id, code, name")
        .order("sort_order", { ascending: true }),
      supabase
        .from("units")
        .select("id, code, name")
        .order("name", { ascending: true }),
    ]);

  if (!product) notFound();

  return (
    <EditProductForm
      productId={product.id}
      defaults={{
        code: product.code,
        name: product.name,
        categoryId: product.category_id,
        unitId: product.unit_id,
        priceSale: Number(product.price_sale),
        priceBuy: Number(product.price_buy),
        stockLowThreshold: Number(product.stock_low_threshold),
        imageUrl: product.image_url ?? "",
      }}
      categories={(categories ?? []).map((c) => ({
        id: c.id as string,
        code: c.code as string,
        name: c.name as string,
      }))}
      units={(units ?? []).map((u) => ({
        id: u.id as string,
        code: u.code as string,
        name: u.name as string,
      }))}
    />
  );
}

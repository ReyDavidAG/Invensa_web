import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

import { NewProductForm } from "./products-form";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default async function NewProductPage() {
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

  if (profile?.role !== "admin") {
    notFound();
  }

  const [{ data: categories }, { data: units }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, code, name")
      .order("sort_order", { ascending: true }),
    supabase
      .from("units")
      .select("id, code, name")
      .order("name", { ascending: true }),
  ]);

  return (
    <NewProductForm
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

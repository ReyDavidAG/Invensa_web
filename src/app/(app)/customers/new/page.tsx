/* Hallmark · locked system applied (Taller) · src/app/(app)/customers/new/page.tsx
 * New customer entry. Server component: admin check + renders form.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

import { NewCustomerForm } from "./customers-form";

export const metadata: Metadata = {
  title: "Nuevo cliente",
};

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
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

  return <NewCustomerForm />;
}

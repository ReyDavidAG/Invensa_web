import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";

import { EditCustomerForm } from "./customers-edit-form";

export const dynamic = "force-dynamic";

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
  return { title: data?.name ? `Editar · ${data.name}` : "Editar cliente" };
}

export default async function EditCustomerPage({ params }: PageProps) {
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

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, phone, email, address, notes")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  return (
    <EditCustomerForm
      customerId={client.id}
      defaults={{
        name: client.name,
        phone: client.phone ?? "",
        email: client.email ?? "",
        address: client.address ?? "",
        notes: client.notes ?? "",
      }}
    />
  );
}

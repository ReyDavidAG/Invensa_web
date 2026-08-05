import type { Metadata } from "next";

import { getSupabaseServer } from "@/lib/supabase/server";

import { CashClosingClient } from "./cash-closing-client";

export const metadata: Metadata = {
  title: "Cierre de caja",
};

function todayMexico(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export default async function CashClosingPage() {
  const supabase = await getSupabaseServer();
  const date = todayMexico();

  const { data: existing } = await supabase
    .from("cash_closings")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  // If no row yet, compute expected from the view so the client shows a useful preview.
  let expectedCash = 0;
  if (existing) {
    expectedCash = Number(existing.expected_cash);
  } else {
    const { data } = await supabase
      .from("vw_cash_sales_by_day")
      .select("net_cash")
      .eq("sale_date", date)
      .maybeSingle();
    expectedCash = Number(data?.net_cash ?? 0);
  }

  return (
    <CashClosingClient
      date={date}
      initialRow={existing ?? null}
      initialExpected={expectedCash}
    />
  );
}

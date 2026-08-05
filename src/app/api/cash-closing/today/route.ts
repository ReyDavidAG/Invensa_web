import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { todayMexicoISODate } from "@/lib/datetime";

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = todayMexicoISODate();
  const { data: expected } = await supabase
    .from("vw_cash_sales_by_day")
    .select("net_cash")
    .eq("sale_date", date)
    .maybeSingle();

  return NextResponse.json({
    date,
    expected: Number(expected?.net_cash ?? 0),
  });
}

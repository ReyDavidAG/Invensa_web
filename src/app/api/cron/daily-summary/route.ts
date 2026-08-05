import { NextResponse, type NextRequest } from "next/server";

import { sendEmail } from "@/lib/email/send";
import {
  dailySummaryHtml,
  dailySummaryText,
} from "@/lib/email/templates/daily-summary";
import { getRecipients } from "@/lib/email/recipients";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  endOfMexicoDayUTC,
  mexicoDayStartUTC,
  mexicoISODate,
  startOfMexicoDayUTC,
  todayMexicoISODate,
} from "@/lib/datetime";

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Service role, not the session-scoped client — this is a cron trigger
  // with no auth.uid(), so an RLS-gated read would silently come back empty.
  const supabase = await getSupabaseAdmin();
  const date = todayMexicoISODate();
  const yesterday = mexicoISODate(mexicoDayStartUTC(1));

  // Day boundaries in UTC (sales.date_at is timestamptz in UTC).
  const startOfDay = (s: string) => startOfMexicoDayUTC(s).toISOString();
  const endOfDay = (s: string) => endOfMexicoDayUTC(s).toISOString();

  const [
    { data: todaySales },
    { data: yestSales },
    { data: items },
    { data: closing },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total")
      .gte("date_at", startOfDay(date))
      .lt("date_at", endOfDay(date))
      .neq("status", "cancelled"),
    supabase
      .from("sales")
      .select("id, total")
      .gte("date_at", startOfDay(yesterday))
      .lt("date_at", endOfDay(yesterday))
      .neq("status", "cancelled"),
    supabase
      .from("sale_items")
      .select(
        "quantity, unit_price, product_id, sale_id, sales!inner(date_at, status)",
      )
      .gte("sales.date_at", startOfDay(date))
      .lt("sales.date_at", endOfDay(date))
      .neq("sales.status", "cancelled"),
    supabase
      .from("cash_closings")
      .select("status, diff")
      .eq("date", date)
      .maybeSingle(),
  ]);

  const salesCount = (todaySales ?? []).length;
  const salesTotal = (todaySales ?? []).reduce(
    (s, r) => s + Number(r.total),
    0,
  );
  const yesterdayTotal = (yestSales ?? []).reduce(
    (s, r) => s + Number(r.total),
    0,
  );
  const yesterdayDeltaPct =
    yesterdayTotal > 0
      ? ((salesTotal - yesterdayTotal) / yesterdayTotal) * 100
      : null;

  // Top products: aggregate sale_items by product_id.
  const agg = new Map<string, { quantity: number; total: number }>();
  for (const it of items ?? []) {
    const id = it.product_id as string;
    const cur = agg.get(id) ?? { quantity: 0, total: 0 };
    cur.quantity += Number(it.quantity);
    cur.total += Number(it.quantity) * Number(it.unit_price);
    agg.set(id, cur);
  }

  let topProducts: Array<{
    name: string;
    imageUrl: string | null;
    quantity: number;
    total: number;
  }> = [];
  if (agg.size > 0) {
    const topIds = [...agg.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([id]) => id);
    const { data: prods } = await supabase
      .from("products")
      .select("id, name, image_url")
      .in("id", topIds);
    const nameById = new Map(
      (prods ?? []).map((p) => [
        p.id as string,
        p as { name: string; image_url: string | null },
      ]),
    );
    topProducts = topIds.map((id) => ({
      name: nameById.get(id)?.name ?? "(producto)",
      imageUrl: nameById.get(id)?.image_url ?? null,
      quantity: agg.get(id)?.quantity ?? 0,
      total: agg.get(id)?.total ?? 0,
    }));
  }

  const recipients = await getRecipients(["admin", "employee"]);
  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0, salesCount });
  }

  const appUrl =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  await sendEmail({
    to: recipients,
    subject: `Resumen ${date} — ${salesCount} ${salesCount === 1 ? "venta" : "ventas"}`,
    html: dailySummaryHtml({
      date,
      salesCount,
      salesTotal,
      topProducts,
      yesterdayDeltaPct,
      cashClosingStatus: (closing?.status as "open" | "closed") ?? "open",
      cashClosingDiff: closing?.diff != null ? Number(closing.diff) : null,
      appUrl,
    }),
    text: dailySummaryText({
      date,
      salesCount,
      salesTotal,
      topProducts,
      yesterdayDeltaPct,
      cashClosingStatus: (closing?.status as "open" | "closed") ?? "open",
      cashClosingDiff: closing?.diff != null ? Number(closing.diff) : null,
      appUrl,
    }),
  });

  return NextResponse.json({
    sent: 1,
    recipients: recipients.length,
    salesCount,
    salesTotal,
  });
}

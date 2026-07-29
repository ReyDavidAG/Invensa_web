import { NextResponse, type NextRequest } from "next/server";

import { sendEmail } from "@/lib/email/send";
import {
  lowStockAlertHtml,
  lowStockAlertText,
} from "@/lib/email/templates/low-stock-alert";
import { getRecipients } from "@/lib/email/recipients";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron sends Authorization: Bearer ${CRON_SECRET}
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServer();

  // Fetch active products with threshold > 0 plus current stock, then filter
  // in code. The view alone can't filter by per-product threshold.
  const [{ data: products }, { data: stocks }] = await Promise.all([
    supabase
      .from("products")
      .select("id, code, name, stock_low_threshold, image_url")
      .eq("status", "active")
      .gt("stock_low_threshold", 0),
    supabase.from("vw_product_stock").select("product_id, stock_on_hand"),
  ]);

  const stockById = new Map(
    (stocks ?? []).map((s) => [
      s.product_id as string,
      Number(s.stock_on_hand),
    ]),
  );

  const rows = (products ?? [])
    .map((p) => ({
      code: p.code as string,
      name: p.name as string,
      imageUrl: (p.image_url as string | null) ?? null,
      stock: stockById.get(p.id as string) ?? 0,
      threshold: Number(p.stock_low_threshold),
    }))
    .filter((r) => r.stock <= r.threshold)
    .sort((a, b) => a.stock - b.stock);

  if (rows.length === 0) {
    // 200 even with no rows so Vercel doesn't retry.
    return NextResponse.json({ sent: 0, rows: 0 });
  }

  const recipients = await getRecipients(["admin"]);
  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0, rows: rows.length, note: "no admin" });
  }

  await sendEmail({
    to: recipients,
    subject: `${rows.length} producto${rows.length === 1 ? "" : "s"} por agotarse`,
    html: lowStockAlertHtml(
      rows,
      new Date(),
      process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
    ),
    text: lowStockAlertText(
      rows,
      process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
    ),
  });

  return NextResponse.json({
    sent: 1,
    rows: rows.length,
    recipients: recipients.length,
  });
}

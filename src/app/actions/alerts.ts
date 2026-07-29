"use server";

import { requireAdmin } from "@/app/actions/_guards";
import { sendEmail } from "@/lib/email/send";
import { getRecipients } from "@/lib/email/recipients";
import {
  lowStockAlertHtml,
  lowStockAlertText,
} from "@/lib/email/templates/low-stock-alert";
import { getSupabaseServer } from "@/lib/supabase/server";

export type LowStockAlertResult =
  { ok: true; rows: number; recipients: number } | { ok: false; error: string };

export async function sendLowStockAlertAction(): Promise<LowStockAlertResult> {
  const auth = await requireAdmin({ actionLabel: "enviar alerta de stock" });
  if ("ok" in auth) return auth;

  const supabase = await getSupabaseServer();

  // Fetch all active products with their threshold; join with current stock
  // and filter in code so we can compare stock against threshold (the view
  // alone doesn't know the per-product threshold).
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
    return { ok: true, rows: 0, recipients: 0 };
  }

  const recipients = await getRecipients(["admin"]);
  if (recipients.length === 0) {
    return { ok: true, rows: rows.length, recipients: 0 };
  }

  try {
    const appUrl =
      process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
    await sendEmail({
      to: recipients,
      subject: `${rows.length} producto${rows.length === 1 ? "" : "s"} por agotarse`,
      html: lowStockAlertHtml(rows, new Date(), appUrl),
      text: lowStockAlertText(rows, appUrl),
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error enviando email",
    };
  }

  return { ok: true, rows: rows.length, recipients: recipients.length };
}

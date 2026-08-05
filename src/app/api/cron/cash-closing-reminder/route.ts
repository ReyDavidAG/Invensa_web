import { NextResponse, type NextRequest } from "next/server";

import { createNotificationsDedupedAction } from "@/app/actions/notifications";
import { getRecipientIds } from "@/lib/email/recipients";
import { getSupabaseServer } from "@/lib/supabase/server";

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected}`;
}

function todayMexico(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServer();
  const date = todayMexico();

  const { data: closing } = await supabase
    .from("cash_closings")
    .select("status")
    .eq("date", date)
    .maybeSingle();

  // If there's no row at all yet, OR status='open' → notify.
  const needsReminder = !closing || closing.status === "open";
  if (!needsReminder) {
    return NextResponse.json({ sent: 0, status: "closed" });
  }

  const userIds = await getRecipientIds(["admin", "employee"]);
  if (userIds.length === 0) {
    return NextResponse.json({ sent: 0, note: "no users" });
  }

  const res = await createNotificationsDedupedAction({
    userIds,
    type: "cash_closing",
    title: "Caja pendiente de cerrar",
    body: `Cierre del ${date} aún sin cerrar. Cuadra la caja para terminar el día.`,
    link: "/cash-closing",
    metadata: { date },
  });

  return NextResponse.json({
    sent: res.ok ? res.created : 0,
    error: res.ok ? undefined : res.error,
  });
}

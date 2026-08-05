"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mexicoDayStartUTC } from "@/lib/datetime";
import {
  type Notification,
  type NotificationCreateInput,
  notificationCreateInputSchema,
} from "@/lib/schemas/notifications";

export type ListNotificationsResult = {
  ok: true;
  unread: number;
  items: Notification[];
};

export type MarkResult = { ok: true } | { ok: false; error: string };

// ponytail: thin wrapper kept for backward compat with existing callers; the
// real work now lives in lib/supabase/profile.ts so layout + TopBar share one
// roundtrip via React.cache().
export async function getUnreadCountAction(): Promise<number> {
  const { getUnreadNotificationsCount } =
    await import("@/lib/supabase/profile");
  return getUnreadNotificationsCount();
}

export async function listNotificationsAction(
  limit = 20,
): Promise<ListNotificationsResult> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: true, unread: 0, items: [] };
  const items = (data ?? []) as Notification[];
  const unread = items.filter((n) => n.read_at === null).length;
  return { ok: true, unread, items };
}

export async function markAsReadAction(id: string): Promise<MarkResult> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllAsReadAction(): Promise<MarkResult> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Server-only: create notifications for one or more users. Uses the service
 * role because the cron / system trigger has no auth.uid(). Bypasses RLS
 * for INSERT — only callable from server actions, never exposed to clients.
 */
export async function createNotificationsAction(
  rawInput: NotificationCreateInput,
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const parsed = notificationCreateInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  }
  const input = parsed.data;
  const admin = await getSupabaseAdmin();

  const rows = input.userIds.map((userId) => ({
    user_id: userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    metadata: input.metadata ?? null,
  }));

  // ponytail: cast through unknown — generated types don't include the new
  // notifications table yet; insert accepts the row shape.
  const { data, error } = await admin
    .from("notifications")
    .insert(rows as never)
    .select("id");
  if (error) return { ok: false, error: error.message };
  return { ok: true, created: data?.length ?? 0 };
}

/**
 * Insert only if no notification of the same (type) exists for the user today.
 * Dedup lives in code (not SQL) to keep business rules in one place.
 */
export async function createNotificationsDedupedAction(
  rawInput: NotificationCreateInput,
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const parsed = notificationCreateInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  }
  const input = parsed.data;

  const admin = await getSupabaseAdmin();
  const todayIso = mexicoDayStartUTC(0).toISOString();

  // For each user, check if a notification of this type already exists today.
  const filtered: typeof input.userIds = [];
  for (const userId of input.userIds) {
    const { data } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", input.type)
      .gte("created_at", todayIso)
      .limit(1);
    if (!data || data.length === 0) filtered.push(userId);
  }
  if (filtered.length === 0) return { ok: true, created: 0 };

  return createNotificationsAction({ ...input, userIds: filtered });
}

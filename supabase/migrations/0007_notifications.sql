-- =============================================================================
-- 0007_notifications.sql — per-user in-app notifications
-- =============================================================================
-- Each row is one notification for one user. System inserts use the service
-- role (no auth.uid() at insert time — cron has no user). Users read + mark
-- read via RLS keyed on auth.uid().
-- =============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('low_stock', 'cash_closing', 'system')),
  title text not null,
  body text,
  link text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Most recent first; covers the dropdown query.
create index notifications_user_recent_idx
  on public.notifications (user_id, created_at desc);

-- Partial index for unread count (cheap badge query).
create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

-- Users see only their own.
create policy notifications_select_own
  on public.notifications for select
  to authenticated using (user_id = auth.uid());

-- Users can mark their own as read (UPDATE only on read_at column is enforced
-- at the action layer; RLS keeps the row scoped to the owner).
create policy notifications_update_own
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- INSERT/DELETE are intentionally NOT granted to authenticated.
-- System-triggered notifications (cron, server actions) use the service
-- role client which bypasses RLS.

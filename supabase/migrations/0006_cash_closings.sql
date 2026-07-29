-- =============================================================================
-- 0006_cash_closings.sql — daily cash closing
-- =============================================================================
-- Adds sales.change_given (the change the cashier handed back to the customer)
-- and the cash_closings table (one row per day: expected vs counted cash).
-- Plus a helper view that sums net cash (paid_amount - change_given) for cash
-- sales on a given day — used by /cash-closing to compute expected_cash.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. sales.change_given — what the cashier handed back as change
-- ---------------------------------------------------------------------------
alter table public.sales
  add column if not exists change_given numeric(12,2) not null default 0
  check (change_given >= 0);

-- ---------------------------------------------------------------------------
-- 2. cash_closings — one row per day
-- ---------------------------------------------------------------------------
create table if not exists public.cash_closings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  expected_cash numeric(12,2) not null default 0,
  counted_cash numeric(12,2) check (counted_cash is null or counted_cash >= 0),
  -- Stored generated column: counted - expected. NULL while not counted yet.
  diff numeric(12,2) generated always as (
    case when counted_cash is null then null
         else counted_cash - expected_cash
    end
  ) stored,
  notes text,
  closed_by uuid references public.profiles(id),
  status text not null default 'open' check (status in ('open', 'closed'))
);

create index cash_closings_date_idx on public.cash_closings(date desc);

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
alter table public.cash_closings enable row level security;

-- Everyone authenticated can read.
create policy cash_closings_select_authenticated
  on public.cash_closings for select
  to authenticated using (true);

-- Both roles can open/close (employee or admin can run the closing).
create policy cash_closings_insert_authenticated
  on public.cash_closings for insert
  to authenticated with check (true);

create policy cash_closings_update_authenticated
  on public.cash_closings for update
  to authenticated using (true) with check (true);

-- Only admin can delete (correction flow).
create policy cash_closings_delete_admin
  on public.cash_closings for delete
  to authenticated using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 4. Helper view: net cash from cash sales, grouped by local day
-- ---------------------------------------------------------------------------
create or replace view public.vw_cash_sales_by_day as
select
  (s.date_at at time zone 'America/Mexico_City')::date as sale_date,
  sum(greatest(s.paid_amount - s.change_given, 0)) as net_cash,
  count(*) as sales_count
from public.sales s
where s.status = 'paid'
  and s.payment_method = 'cash'
group by 1;

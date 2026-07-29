-- =============================================================================
-- 0004_customers.sql — clients + debt view
-- =============================================================================
-- Clients are the people who buy at the store. Many sales are anonymous
-- (no client). When a sale is fiado (status='credit'), client_id is required.
-- Debt per client is derived from sales where paid_amount < total and
-- status = 'credit'.
-- =============================================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create index ix_clients_name on public.clients (name);
create index ix_clients_phone on public.clients (phone) where phone is not null;
create index ix_clients_active on public.clients (active);

comment on table public.clients is 'Store clients. A sale can be anonymous (client_id null) OR linked to a client. Fiado sales (status=credit) require a client.';

-- ---------------------------------------------------------------------------
-- 1. FK from sales.client_id -> clients.id (deferred from 0003 to break
--    the forward reference across migration files).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_sales_client'
  ) then
    alter table public.sales
      add constraint fk_sales_client
      foreign key (client_id) references public.clients(id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Client balances view (derived debt)
-- ---------------------------------------------------------------------------
create view public.vw_client_balances as
select
  c.id as client_id,
  c.name,
  coalesce(sum(s.total - s.paid_amount), 0) as balance
from public.clients c
left join public.sales s
  on s.client_id = c.id
  and s.status = 'credit'
  and s.paid_amount < s.total
group by c.id, c.name;

comment on view public.vw_client_balances is 'Outstanding debt per client. Derived from sales where status=credit and paid_amount < total. balance > 0 means the client owes money.';

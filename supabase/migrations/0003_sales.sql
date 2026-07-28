-- =============================================================================
-- 0003_sales.sql — sales, sale_items, inventory_movements
-- =============================================================================
-- Sales are the central transaction. Each sale has line items (sale_items) and
-- triggers inventory_movements (kardex). Stock on hand is the sum of all
-- movements per product.
--
-- Fiado (credit sale): status='credit', paid_amount can be 0 (full debt) or
-- partial (abonos). When paid_amount = total the sale flips to 'paid' (manual
-- or via a credit payment action in a later migration).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums (idempotent — CREATE TYPE doesn't support IF NOT EXISTS)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'sale_status' and n.nspname = 'public') then
    create type public.sale_status as enum ('paid', 'credit', 'cancelled');
  end if;
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'payment_method' and n.nspname = 'public') then
    create type public.payment_method as enum ('cash', 'transfer', 'mixed');
  end if;
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'movement_type' and n.nspname = 'public') then
    create type public.movement_type as enum ('in', 'out', 'adjustment');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. sales (header)
-- ---------------------------------------------------------------------------
-- Note: client_id FK is added in 0004_customers.sql AFTER public.clients exists.
-- (Supabase CLI applies each migration in its own transaction, so forward FK
-- references across migration files are invalid at apply time.)
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  date_at timestamptz not null default now(),
  client_id uuid,
  total numeric(12,2) not null default 0 check (total >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  status public.sale_status not null default 'paid',
  payment_method public.payment_method not null default 'cash',
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (paid_amount <= total),
  check (status <> 'credit' or client_id is not null)
);

create trigger sales_set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

create index ix_sales_date_at on public.sales (date_at desc);
create index ix_sales_client_id on public.sales (client_id) where client_id is not null;
create index ix_sales_status on public.sales (status);
create index ix_sales_created_by on public.sales (created_by);

comment on table public.sales is 'Sale header. ticket_number is the human-readable folio. status=credit is fiado.';
comment on column public.sales.paid_amount is 'For credit sales, the amount already paid by the client. total - paid_amount = outstanding debt.';
comment on column public.sales.created_by is 'User who registered the sale (admin or employee).';

-- ---------------------------------------------------------------------------
-- 3. sale_items (lines)
-- ---------------------------------------------------------------------------
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12,4) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) generated always as (quantity * unit_price) stored
);

create index ix_sale_items_sale_id on public.sale_items (sale_id);
create index ix_sale_items_product_id on public.sale_items (product_id);

comment on table public.sale_items is 'Lines of a sale. subtotal is derived (quantity * unit_price).';

-- ---------------------------------------------------------------------------
-- 4. inventory_movements (kardex)
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type public.movement_type not null,
  quantity numeric(12,4),
  quantity_adj numeric(12,4),
  unit_price numeric(12,2),
  sale_id uuid references public.sales(id),
  note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (
    (movement_type in ('in', 'out')
       and quantity is not null
       and quantity > 0
       and quantity_adj is null)
    or
    (movement_type = 'adjustment'
       and quantity_adj is not null
       and quantity is null)
  )
);

create index ix_inventory_movements_product_id on public.inventory_movements (product_id);
create index ix_inventory_movements_sale_id on public.inventory_movements (sale_id) where sale_id is not null;
create index ix_inventory_movements_type on public.inventory_movements (movement_type);

comment on table public.inventory_movements is 'Kardex. in = entradas, out = salidas (ventas o mermas), adjustment = correccion manual con signo.';

-- ---------------------------------------------------------------------------
-- 5. vw_product_stock (recreated now that inventory_movements exists)
-- ---------------------------------------------------------------------------
-- Drop the placeholder from 0002 and create the real one.
drop view if exists public.vw_product_stock;

create view public.vw_product_stock as
select
  p.id as product_id,
  p.code,
  p.name,
  coalesce(sum(
    case
      when im.movement_type = 'in' then im.quantity
      when im.movement_type = 'out' then -im.quantity
      when im.movement_type = 'adjustment' then im.quantity_adj
      else 0
    end
  ), 0) as stock_on_hand
from public.products p
left join public.inventory_movements im on im.product_id = p.id
group by p.id, p.code, p.name;

comment on view public.vw_product_stock is 'Derived stock per product. Recomputed each read.';

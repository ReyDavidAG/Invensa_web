-- =============================================================================
-- 0002_products.sql — categories, units, products
-- =============================================================================
-- Categories and units are independent lookup tables. A product has exactly
-- one category and one unit. Stock is NOT stored as a column — it's derived
-- from inventory_movements in 0003.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

comment on table public.categories is 'Product categories (e.g. Limpieza, Refacciones). Lookup table.';

-- ---------------------------------------------------------------------------
-- 2. units
-- ---------------------------------------------------------------------------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger units_set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

comment on table public.units is 'Units of measure (e.g. PZA, L, KG). Independent of categories — a unit can serve multiple categories.';

-- ---------------------------------------------------------------------------
-- 3. products
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'product_status' and n.nspname = 'public') then
    create type public.product_status as enum ('active', 'archived');
  end if;
end $$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category_id uuid not null references public.categories(id),
  unit_id uuid not null references public.units(id),
  price_sale numeric(12,2) not null default 0 check (price_sale >= 0),
  price_buy numeric(12,2) not null default 0 check (price_buy >= 0),
  stock_low_threshold numeric(12,4) not null default 5 check (stock_low_threshold >= 0),
  status public.product_status not null default 'active',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index ix_products_name on public.products (name);
create index ix_products_category_id on public.products (category_id);
create index ix_products_unit_id on public.products (unit_id);
create index ix_products_status on public.products (status);

comment on table public.products is 'Product catalog. price_sale is the sale price in MXN. stock is derived from inventory_movements (see 0003).';
comment on column public.products.image_url is 'Public URL in Cloudflare R2. Upload happens via presigned URL from the server.';

-- Note: vw_product_stock is created in 0003_sales.sql once inventory_movements exists.

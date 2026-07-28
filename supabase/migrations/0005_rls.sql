-- =============================================================================
-- 0005_rls.sql — consolidated RLS policies for business tables
-- =============================================================================
-- profiles RLS lives in 0001. Lookup tables (categories, units) are
-- read-only for everyone and write-only for admin. Business tables have
-- role-based policies: admin can CUD everything; employee can SELECT
-- everything and INSERT sales/clients (no edits, no deletes on products).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. categories — read by anyone, write by admin
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;

create policy categories_select_authenticated
  on public.categories for select
  to authenticated, anon
  using (true);

create policy categories_insert_admin
  on public.categories for insert
  to authenticated
  with check (public.current_user_role() = 'admin');

create policy categories_update_admin
  on public.categories for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy categories_delete_admin
  on public.categories for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 2. units — read by anyone, write by admin
-- ---------------------------------------------------------------------------
alter table public.units enable row level security;

create policy units_select_authenticated
  on public.units for select
  to authenticated, anon
  using (true);

create policy units_insert_admin
  on public.units for insert
  to authenticated
  with check (public.current_user_role() = 'admin');

create policy units_update_admin
  on public.units for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy units_delete_admin
  on public.units for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 3. products — read by all, CUD by admin
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;

create policy products_select_authenticated
  on public.products for select
  to authenticated, anon
  using (true);

create policy products_insert_admin
  on public.products for insert
  to authenticated
  with check (public.current_user_role() = 'admin');

create policy products_update_admin
  on public.products for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy products_delete_admin
  on public.products for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 4. clients — read by all, INSERT/UPDATE by both roles, DELETE by admin
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;

create policy clients_select_authenticated
  on public.clients for select
  to authenticated, anon
  using (true);

create policy clients_insert_authenticated
  on public.clients for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'employee'));

create policy clients_update_authenticated
  on public.clients for update
  to authenticated
  using (public.current_user_role() in ('admin', 'employee'))
  with check (public.current_user_role() in ('admin', 'employee'));

create policy clients_delete_admin
  on public.clients for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 5. sales — read by all, INSERT by both roles, UPDATE/DELETE by admin
-- ---------------------------------------------------------------------------
alter table public.sales enable row level security;

create policy sales_select_authenticated
  on public.sales for select
  to authenticated, anon
  using (true);

create policy sales_insert_authenticated
  on public.sales for insert
  to authenticated
  with check (
    public.current_user_role() in ('admin', 'employee')
    and created_by = auth.uid()
  );

create policy sales_update_admin
  on public.sales for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy sales_delete_admin
  on public.sales for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 6. sale_items — inherits parent sale visibility
-- ---------------------------------------------------------------------------
alter table public.sale_items enable row level security;

create policy sale_items_select_authenticated
  on public.sale_items for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
    )
  );

create policy sale_items_insert_authenticated
  on public.sale_items for insert
  to authenticated
  with check (
    public.current_user_role() in ('admin', 'employee')
    and exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
        and s.created_by = auth.uid()
    )
  );

create policy sale_items_update_admin
  on public.sale_items for update
  to authenticated
  using (public.current_user_role() = 'admin');

create policy sale_items_delete_admin
  on public.sale_items for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 7. inventory_movements — read by all, INSERT by both roles, UPDATE/DELETE admin
-- ---------------------------------------------------------------------------
alter table public.inventory_movements enable row level security;

create policy inventory_movements_select_authenticated
  on public.inventory_movements for select
  to authenticated, anon
  using (true);

create policy inventory_movements_insert_authenticated
  on public.inventory_movements for insert
  to authenticated
  with check (
    public.current_user_role() in ('admin', 'employee')
    and created_by = auth.uid()
  );

create policy inventory_movements_update_admin
  on public.inventory_movements for update
  to authenticated
  using (public.current_user_role() = 'admin');

create policy inventory_movements_delete_admin
  on public.inventory_movements for delete
  to authenticated
  using (public.current_user_role() = 'admin');

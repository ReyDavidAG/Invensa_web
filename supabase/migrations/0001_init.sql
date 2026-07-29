-- =============================================================================
-- 0001_init.sql — profiles, role enum, auto-create trigger, helpers, RLS
-- =============================================================================
-- Creates the `profiles` table that mirrors Supabase auth.users with an
-- application-level role (admin / employee). The trigger auto-creates a profile
-- on every auth.users INSERT. The first user is admin; everyone else is employee.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum: app-level user role (idempotent — CREATE TYPE doesn't support IF NOT EXISTS)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum ('admin', 'employee');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. profiles table (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ix_profiles_role on public.profiles (role);

comment on table public.profiles is 'App profile 1:1 with auth.users. role drives RLS across the app.';
comment on column public.profiles.role is 'admin = sister (store owner); employee = mom. First user auto-assigned admin.';

-- ---------------------------------------------------------------------------
-- 3. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Helper: current user role (SECURITY DEFINER to bypass RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = ''
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_user_role() to authenticated, anon;

comment on function public.current_user_role() is 'Returns the role of the currently authenticated user. SECURITY DEFINER bypasses RLS to avoid recursion when used inside policies.';

-- ---------------------------------------------------------------------------
-- 5. Auto-create profile on auth.users INSERT
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_count integer;
  assigned_role public.user_role;
begin
  -- First registered user becomes admin; everyone else is employee.
  select count(*) into profile_count from public.profiles;
  if profile_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := 'employee';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    assigned_role
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is 'Auto-creates public.profiles row on every auth.users insert. First user = admin, rest = employee.';

-- ---------------------------------------------------------------------------
-- 6. RLS for profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- SELECT: own profile OR admin reads all
create policy profiles_select_own_or_admin
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- UPDATE: own profile (e.g. full_name) OR admin
create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_role() = 'admin'
  )
  with check (
    id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- INSERT: blocked (only via handle_new_user trigger)
-- DELETE: blocked from client. Admin can use service-role.

-- ---------------------------------------------------------------------------
-- 7. Prevent non-admin self role escalation (defense in depth)
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role is distinct from new.role
     and public.current_user_role() is distinct from 'admin' then
    raise exception 'Only admins can change user roles';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

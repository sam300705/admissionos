create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institutes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  email text,
  phone text,
  country text not null default 'India',
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institute_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institute_id uuid not null references public.institutes(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'counsellor', 'finance')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (institute_id, user_id)
);

create index institute_memberships_user_institute_idx
  on public.institute_memberships (user_id, institute_id)
  where status = 'active';

create index institute_memberships_institute_role_idx
  on public.institute_memberships (institute_id, role)
  where status = 'active';

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.touch_updated_at() from public;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

create trigger institutes_touch_updated_at
before update on public.institutes
for each row execute function private.touch_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.institute_memberships (
    user_id,
    institute_id,
    role,
    status,
    joined_at
  )
  values (
    new.created_by,
    new.id,
    'owner',
    'active',
    now()
  );
  return new;
end;
$$;

revoke execute on function private.create_owner_membership() from public;

create trigger institute_owner_membership_after_insert
  after insert on public.institutes
  for each row execute function private.create_owner_membership();

create or replace function private.active_institute_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select membership.institute_id
  from public.institute_memberships as membership
  where membership.user_id = (select auth.uid())
    and membership.status = 'active';
$$;

revoke execute on function private.active_institute_ids() from public;
grant execute on function private.active_institute_ids() to authenticated;

create or replace function private.has_institute_role(target_institute_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.institute_memberships as membership
    where membership.institute_id = target_institute_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

revoke execute on function private.has_institute_role(uuid, text[]) from public;
grant execute on function private.has_institute_role(uuid, text[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.institutes enable row level security;
alter table public.institute_memberships enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.institutes from anon, authenticated;
revoke all on table public.institute_memberships from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.institutes to authenticated;
grant select on table public.institute_memberships to authenticated;

create policy "users read own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and id = (select auth.uid())
);

create policy "users update own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and id = (select auth.uid())
)
with check (
  (select auth.uid()) is not null
  and id = (select auth.uid())
);

create policy "active members read institutes"
on public.institutes
for select
to authenticated
using (
  id in (select private.active_institute_ids())
);

create policy "authenticated users create own institutes"
on public.institutes
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
);

create policy "owners and admins update institutes"
on public.institutes
for update
to authenticated
using (
  (select private.has_institute_role(id, array['owner', 'admin']::text[]))
)
with check (
  (select private.has_institute_role(id, array['owner', 'admin']::text[]))
);

create policy "users read own memberships"
on public.institute_memberships
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

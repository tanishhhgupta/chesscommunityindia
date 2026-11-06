-- ==============================================================================
-- Supabase Auth & User Profiles Migration
-- Chess Community India (CCI)
-- ==============================================================================

-- 1. Create profiles table linked to Supabase auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default 'CCI Player',
  city text default 'Jabalpur',
  age integer default 20,
  role text not null default 'player' check (role in ('player', 'arbiter', 'admin')),
  avatar_id text default 'knight',
  avatar_url text,
  cci_player_id text unique,
  fide_id text,
  chess_com_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Performance indexes
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_cci_player_id on public.profiles(cci_player_id);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 4. RLS Policies
-- Policy A: Anyone can view public profiles (directory, pairings, ratings)
create policy "Public profiles are visible to all users"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- Policy B: Authenticated users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Policy C: Users can only update their own profile (USING and WITH CHECK both required)
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Note: Role column updates can be restricted with a BEFORE UPDATE trigger or checked in application logic
-- so users cannot elevate their own role to 'admin' or 'arbiter'.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If current user is not service_role, retain old role unless caller is already an admin
  if (current_setting('role', true) != 'service_role') and (new.role != old.role) then
    if not exists (
      select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_role_self_escalation();

-- 5. Automatic User Profile Creation Trigger on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_cci_id text;
  user_full_name text;
  user_city text;
  user_avatar text;
  assigned_role text;
begin
  -- Safe default extractions from signup metadata
  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  user_city := coalesce(new.raw_user_meta_data->>'city', 'Jabalpur');
  user_avatar := coalesce(new.raw_user_meta_data->>'avatar_id', 'knight');
  
  -- Role should always default to 'player'. Only special domains or app_metadata can assign arbiter/admin
  assigned_role := coalesce(new.raw_app_meta_data->>'role', 'player');
  if assigned_role not in ('player', 'arbiter', 'admin') then
    assigned_role := 'player';
  end if;

  generated_cci_id := 'CCI-2026-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');

  insert into public.profiles (
    id,
    email,
    full_name,
    city,
    role,
    avatar_id,
    cci_player_id
  ) values (
    new.id,
    new.email,
    user_full_name,
    user_city,
    assigned_role,
    user_avatar,
    generated_cci_id
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

-- Trigger execution on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Grant Permissions for Data API Access
grant usage on schema public to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;


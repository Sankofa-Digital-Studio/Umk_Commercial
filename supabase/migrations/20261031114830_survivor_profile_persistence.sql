-- Survivor onboarding and ICE persistence.
-- All rows are scoped to the authenticated (including anonymous-auth) user.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  sa_id_number text not null default '',
  safe_word text not null default '',
  medical_conditions text not null default '',
  alert_email text not null default '',
  twitter_handle text not null default '',
  instagram_handle text not null default '',
  facebook_profile text not null default '',
  preferred_disguise text not null default 'MUNICIPAL_PREPAID',
  is_uat_mode boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists sa_id_number text not null default '';
alter table public.profiles add column if not exists safe_word text not null default '';
alter table public.profiles add column if not exists medical_conditions text not null default '';
alter table public.profiles add column if not exists alert_email text not null default '';
alter table public.profiles add column if not exists twitter_handle text not null default '';
alter table public.profiles add column if not exists instagram_handle text not null default '';
alter table public.profiles add column if not exists facebook_profile text not null default '';
alter table public.profiles add column if not exists preferred_disguise text not null default 'MUNICIPAL_PREPAID';
alter table public.profiles add column if not exists is_uat_mode boolean not null default false;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_disguise_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_preferred_disguise_check
      check (preferred_disguise in (
        'MUNICIPAL_PREPAID',
        'MUSIC_PLAYER',
        'DAILY_DEVOTIONAL',
        'ANDROID_LAUNCHER'
      ));
  end if;
end $$;

create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  surname text not null default '',
  mobile_number_1 text not null,
  mobile_number_2 text not null default '',
  email_address_1 text not null default '',
  email_address_2 text not null default '',
  relationship text not null default 'Guardian',
  instagram_handle text not null default '',
  tiktok_handle text not null default '',
  facebook_profile text not null default '',
  is_primary boolean not null default false,
  position smallint not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.guardians add column if not exists position smallint not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guardians_position_check'
      and conrelid = 'public.guardians'::regclass
  ) then
    alter table public.guardians
      add constraint guardians_position_check check (position between 1 and 5);
  end if;
end $$;

create index if not exists guardians_user_id_idx on public.guardians (user_id);
create unique index if not exists guardians_user_position_idx
  on public.guardians (user_id, position);

alter table public.profiles enable row level security;
alter table public.guardians enable row level security;

drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users delete own profile" on public.profiles;

create policy "Users view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users delete own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users manage own guardians" on public.guardians;

create policy "Users manage own guardians"
  on public.guardians for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.guardians to authenticated;

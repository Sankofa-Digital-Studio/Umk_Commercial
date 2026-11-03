-- Database dependencies for the dispatch-sos and sync-vault Edge Functions.
-- Sensitive incident narratives are encrypted on the client before insertion.

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp bigint not null,
  date_time_formatted text not null,
  incident_type text not null,
  severity_level smallint not null check (severity_level between 1 and 5),
  encrypted_payload text not null,
  police_ob_number text not null default '',
  evidence_media_keys text[] not null default '{}',
  sha256_checksum text not null,
  form2_affidavit_draft text not null default '',
  danger_score smallint check (danger_score between 0 and 100),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists incidents_user_id_created_at_idx
  on public.incidents (user_id, created_at desc);

create table if not exists public.sos_beacons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PROCESSING', 'DISPATCHED', 'RESOLVED', 'FALSE_ALARM')),
  is_duress boolean not null default false,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  accuracy double precision check (accuracy is null or accuracy >= 0),
  area_name text not null default 'Pending GPS lock',
  battery_percentage smallint check (battery_percentage between 0 and 100),
  is_charging boolean not null default false,
  device_model text not null default '',
  distress_message text not null default '',
  dispatched_channels text[] not null default '{}',
  dispatched_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists sos_beacons_user_id_created_at_idx
  on public.sos_beacons (user_id, created_at desc);

alter table public.incidents enable row level security;
alter table public.sos_beacons enable row level security;

create policy "Users manage own incidents"
  on public.incidents for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage own SOS beacons"
  on public.sos_beacons for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.incidents to authenticated;
grant select, insert, update, delete on public.sos_beacons to authenticated;

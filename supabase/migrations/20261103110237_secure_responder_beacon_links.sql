-- Unguessable, time-limited responder access for a deliberately small SOS payload.
-- The underlying table remains owner-only through RLS.

alter table public.sos_beacons
  add column if not exists responder_token uuid not null default gen_random_uuid(),
  add column if not exists expires_at timestamptz not null
    default (timezone('utc'::text, now()) + interval '72 hours');

create unique index if not exists sos_beacons_responder_token_idx
  on public.sos_beacons (responder_token);

create or replace function public.get_active_sos_beacon_by_token(p_token uuid)
returns table (
  id uuid,
  status text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  area_name text,
  battery_percentage smallint,
  is_charging boolean,
  device_model text,
  created_at timestamptz,
  dispatched_at timestamptz,
  responder_token uuid,
  expires_at timestamptz
)
language sql
security definer
set search_path = pg_catalog
stable
as $$
  select
    beacon.id,
    beacon.status,
    beacon.latitude,
    beacon.longitude,
    beacon.accuracy,
    beacon.area_name,
    beacon.battery_percentage,
    beacon.is_charging,
    beacon.device_model,
    beacon.created_at,
    beacon.dispatched_at,
    beacon.responder_token,
    beacon.expires_at
  from public.sos_beacons as beacon
  where beacon.responder_token = p_token
    and beacon.status in ('PROCESSING', 'DISPATCHED')
    and beacon.expires_at > timezone('utc'::text, now())
  limit 1;
$$;

revoke all on function public.get_active_sos_beacon_by_token(uuid) from public;
grant execute on function public.get_active_sos_beacon_by_token(uuid) to anon, authenticated;

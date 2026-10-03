-- Preserve existing memo content/IDs and derive the Korean date from creation.
alter table public.memos add column record_date date
  generated always as ((created_at at time zone 'Asia/Seoul')::date) stored;
alter table public.memos add column updated_at timestamptz;
update public.memos set updated_at = created_at;
alter table public.memos alter column updated_at set not null;
alter table public.memos alter column updated_at set default now();
-- Fails rather than combining/deleting records if unexpected duplicates exist.
alter table public.memos add constraint memos_one_author_per_day unique (record_date, author);

create function public.save_today_memo(memo_author text, memo_content text, request_id uuid, expected_date date)
returns public.memos language plpgsql security invoker set search_path = '' as $$
declare v_row public.memos; v_now timestamptz := clock_timestamp();
begin
  if expected_date is distinct from (v_now at time zone 'Asia/Seoul')::date then
    raise exception 'Korean date changed' using errcode = '22023';
  end if;
  insert into public.memos (id, author, content, created_at, updated_at)
  values (request_id, memo_author, btrim(memo_content), v_now, v_now)
  on conflict (record_date, author) do update
    set content = excluded.content, updated_at = excluded.updated_at
  returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.save_today_memo(text, text, uuid, date) from public, anon, authenticated;
grant execute on function public.save_today_memo(text, text, uuid, date) to service_role;

-- Return complete paired days, including one extra day for pagination.
create function public.get_memo_days(before_date date default null)
returns setof public.memos language sql stable security invoker set search_path = '' as $$
  select memo.* from public.memos memo
  where memo.record_date in (
    select distinct record_date from public.memos
    where before_date is null or record_date < before_date
    order by record_date desc limit 7
  ) order by memo.record_date desc, memo.author asc;
$$;
revoke all on function public.get_memo_days(date) from public;
grant execute on function public.get_memo_days(date) to anon, authenticated, service_role;

create table public.home_status (
  singleton boolean primary key default true check (singleton),
  status text not null check (status in ('baseball','sleep','eating','resume','certificate')),
  updated_at timestamptz not null default now()
);
alter table public.home_status enable row level security;
revoke all on public.home_status from public, anon, authenticated;
grant select on public.home_status to anon, authenticated;
grant all on public.home_status to service_role;
create policy public_read_home_status on public.home_status for select to anon, authenticated using (true);
-- Existing approved current state only; no new travel data is seeded.
insert into public.home_status (singleton, status) values (true, 'baseball');
create function public.save_home_status(status_value text) returns public.home_status
language plpgsql security invoker set search_path = '' as $$
declare v_row public.home_status;
begin
  insert into public.home_status (singleton, status) values (true, status_value)
  on conflict (singleton) do update set status = excluded.status, updated_at = clock_timestamp()
  returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.save_home_status(text) from public, anon, authenticated;
grant execute on function public.save_home_status(text) to service_role;

create table private.travel_schedule (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  place text not null,
  zone text not null,
  clock_label text not null,
  status text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  flight_number text,
  flight_arrival timestamptz,
  check (starts_at < ends_at),
  check ((flight_number is null) = (flight_arrival is null)),
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
);
alter table private.travel_schedule enable row level security;
revoke all on private.travel_schedule from public, anon, authenticated;
grant select on private.travel_schedule to service_role;
create function public.get_current_travel() returns jsonb
language sql volatile security invoker set search_path = '' as $$
  select jsonb_build_object(
    'place', place, 'zone', zone, 'clockLabel', clock_label, 'status', status,
    'weather', jsonb_build_object('latitude', latitude, 'longitude', longitude),
    'flight', case when flight_number is not null and flight_arrival > clock_timestamp()
      then jsonb_build_object('number', flight_number, 'arrival', flight_arrival)
      else null end
  ) from private.travel_schedule
  where starts_at <= clock_timestamp() and ends_at > clock_timestamp()
  limit 1;
$$;
revoke all on function public.get_current_travel() from public, anon, authenticated;
grant execute on function public.get_current_travel() to service_role;

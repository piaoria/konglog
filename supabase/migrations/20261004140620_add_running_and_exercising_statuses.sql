-- Extend only the existing allowed statuses; no records, RPCs, or grants change.
alter table public.home_status drop constraint home_status_status_check;
alter table public.home_status add constraint home_status_status_check
  check (status in ('baseball','sleep','eating','resume','certificate','running','exercising'));

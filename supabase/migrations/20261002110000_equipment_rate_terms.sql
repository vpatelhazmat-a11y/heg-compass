begin;

-- Keep existing lease records intact while giving each price an explicit kind,
-- unit, currency, and period of validity.
alter table public.equipment_leases
  add column rate_kind text not null default 'Lease',
  add column rate_unit text not null default 'Per month',
  add column currency_code text not null default 'USD',
  add column effective_date date,
  add column expiration_date date,
  add column change_reason text;

update public.equipment_leases
set effective_date = start_date, expiration_date = end_date
where rate is not null;

alter table public.equipment_leases
  add constraint equipment_rate_kind_valid check (rate_kind in ('Lease', 'Maintenance')),
  add constraint equipment_rate_unit_valid check (rate_unit in ('Per month', 'Per week', 'Per day', 'Per hour', 'Per mile', 'Per event', 'Flat')),
  add constraint equipment_rate_currency_valid check (currency_code ~ '^[A-Z]{3}$'),
  add constraint equipment_rate_amount_valid check (rate is null or (rate >= 0 and rate <> 'NaN'::numeric and rate <> 'Infinity'::numeric)),
  add constraint equipment_rate_dates_valid check (expiration_date is null or effective_date is null or expiration_date >= effective_date),
  add constraint equipment_lease_dates_valid check (end_date is null or start_date is null or end_date >= start_date);

create table public.equipment_rate_history (
  id uuid primary key default gen_random_uuid(),
  rate_term_id uuid not null references public.equipment_leases(id) on delete restrict,
  event_type text not null check (event_type in ('Created', 'Revised')),
  previous_record jsonb,
  new_record jsonb not null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index equipment_rate_history_term_time on public.equipment_rate_history(rate_term_id, changed_at desc);
alter table public.equipment_rate_history enable row level security;
grant select on public.equipment_rate_history to authenticated;
create policy read_equipment_rate_history on public.equipment_rate_history
  for select to authenticated using (public.can_access_table('equipment_leases', false));

-- Rows created before this migration still have a visible starting point.
insert into public.equipment_rate_history(rate_term_id, event_type, new_record, changed_at)
select id, 'Created', to_jsonb(equipment_leases) - 'change_reason', created_at
from public.equipment_leases;

create function public.initialize_equipment_rate() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.change_reason = null;
  return new;
end $$;
create trigger initialize_equipment_rate before insert on public.equipment_leases
for each row execute function public.initialize_equipment_rate();

create function public.record_equipment_rate_creation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.equipment_rate_history(rate_term_id, event_type, new_record, changed_by)
  values (new.id, 'Created', to_jsonb(new) - 'change_reason', auth.uid());
  return new;
end $$;
create trigger record_equipment_rate_creation after insert on public.equipment_leases
for each row execute function public.record_equipment_rate_creation();

create function public.preserve_equipment_rate_history() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.created_at = old.created_at;
  new.updated_at = now();
  if (to_jsonb(new) - array['updated_at', 'change_reason']) is distinct from
     (to_jsonb(old) - array['updated_at', 'change_reason']) then
    if nullif(btrim(new.change_reason), '') is null then
      raise exception 'Rate term changes require a reason' using errcode = '23514';
    end if;
    insert into public.equipment_rate_history(rate_term_id, event_type, previous_record, new_record, reason, changed_by)
    values (old.id, 'Revised', to_jsonb(old) - 'change_reason', to_jsonb(new) - 'change_reason', btrim(new.change_reason), auth.uid());
  end if;
  new.change_reason = null;
  return new;
end $$;
create trigger preserve_equipment_rate_history before update on public.equipment_leases
for each row execute function public.preserve_equipment_rate_history();

revoke all on function public.initialize_equipment_rate(), public.record_equipment_rate_creation(), public.preserve_equipment_rate_history() from public, anon, authenticated;

commit;

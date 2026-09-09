create table if not exists public.refused_loads (
  id uuid primary key default gen_random_uuid(),
  call_in_date date not null,
  customer_id uuid null,
  contact_id uuid null,
  equipment_id uuid null,
  equipment_type text,
  load_count integer not null default 1 check (load_count > 0),
  product text,
  rated_status text,
  pickup_city text,
  pickup_state text,
  delivery_city text,
  delivery_state text,
  multiple_requested_dates boolean not null default false,
  requested_comments text,
  offered_date date,
  offered_comments text,
  loss_reason text,
  cs_rep text,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists refused_loads_call_in_date_idx on public.refused_loads(call_in_date);
create index if not exists refused_loads_customer_idx on public.refused_loads(customer_id);
create index if not exists refused_loads_loss_reason_idx on public.refused_loads(loss_reason);

alter table public.refused_loads enable row level security;

create policy "Authenticated users can read refused loads"
  on public.refused_loads for select to authenticated using (true);

create policy "Authenticated users can create refused loads"
  on public.refused_loads for insert to authenticated
  with check (created_by = auth.uid() or created_by is null);

create policy "Authenticated users can update refused loads"
  on public.refused_loads for update to authenticated using (true) with check (true);

create or replace function public.set_refused_load_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists refused_loads_updated_at on public.refused_loads;
create trigger refused_loads_updated_at before update on public.refused_loads
for each row execute function public.set_refused_load_updated_at();

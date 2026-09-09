
-- ============ ROLES & PROFILES ============
create type public.app_role as enum ('admin','sales','operations','safety','management','read_only');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  title text,
  department text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.has_any_role(_user_id uuid, _roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = any(_roles))
$$;

create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(auth.uid(), array['admin','sales','operations','safety','management']::public.app_role[])
$$;

create or replace function public.can_view_safety()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(auth.uid(), array['admin','safety','management']::public.app_role[])
$$;

create or replace function public.can_view_incidents()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(auth.uid(), array['admin','safety','management','operations']::public.app_role[])
$$;

create or replace function public.can_write_safety()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(auth.uid(), array['admin','safety']::public.app_role[])
$$;

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, case when (select count(*) from public.user_roles) = 0 then 'admin'::public.app_role else 'read_only'::public.app_role end)
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ REFERENCE / LOOKUPS ============
create table public.lookup_values (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  value text not null,
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, value)
);

-- ============ IMPORT ============
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text,
  source text,
  target_entity text,
  status text not null default 'Draft',
  imported_by uuid references auth.users(id),
  imported_at timestamptz,
  records_processed int not null default 0,
  records_created int not null default 0,
  records_updated int not null default 0,
  records_rejected int not null default 0,
  records_needing_review int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_staging (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.import_batches(id) on delete cascade,
  target_entity text,
  source_sheet text,
  source_row int,
  source_record jsonb,
  matched_record_id uuid,
  match_method text,
  confidence text,
  data_quality_status text default 'Imported — Unverified',
  review_reason text,
  import_decision text,
  import_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ CUSTOMERS ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  dba_name text,
  customer_type text,
  industry text,
  status text not null default 'Prospect',
  qualification_status text not null default 'Not Reviewed',
  account_owner uuid references auth.users(id),
  customer_since date,
  website text,
  headquarters_address text,
  commercial_notes text,
  qualification_notes text,
  risk_notes text,
  strategic_priority text,
  source_system text, source_record_id text, source_file text, source_sheet text, source_row int,
  import_batch_id uuid references public.import_batches(id),
  imported_at timestamptz, last_synced_at timestamptz, sync_status text,
  data_quality_status text default 'Verified', needs_review boolean not null default false, review_reason text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  site_name text not null,
  site_code text,
  site_type text,
  status text not null default 'Active',
  address text, city text, state text, postal_code text, country text default 'USA',
  latitude numeric, longitude numeric,
  operating_hours text,
  appointment_required boolean default false,
  emergency_contact text,
  access_requirements text, security_requirements text, ppe_requirements text,
  loading_requirements text, unloading_requirements text, safety_requirements text,
  environmental_requirements text, route_notes text, parking_notes text, special_instructions text,
  active boolean not null default true,
  source_system text, source_file text, source_sheet text, source_row int,
  import_batch_id uuid references public.import_batches(id),
  data_quality_status text default 'Verified', needs_review boolean not null default false, review_reason text,
  archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  first_name text, last_name text, title text, department text,
  email text, phone text, mobile text,
  preferred_contact_method text, contact_type text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  category text not null default 'Other',
  requirement text not null,
  description text,
  mandatory boolean not null default true,
  effective_date date, expiration_date date,
  source_document text, owner uuid references auth.users(id),
  status text not null default 'Active',
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  product_name text not null,
  customer_product_code text,
  material_description text,
  hazard_classification text,
  un_number text,
  packing_group text,
  physical_state text,
  handling_requirements text, equipment_requirements text, driver_requirements text,
  special_instructions text,
  active boolean not null default true,
  source text, notes text,
  data_quality_status text default 'Verified', needs_review boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.lanes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  origin_site_id uuid references public.sites(id) on delete set null,
  destination_site_id uuid references public.sites(id) on delete set null,
  lane_name text not null,
  origin_description text, destination_description text, route_description text,
  states_traversed text, mileage numeric,
  route_restrictions text, permit_requirements text, seasonal_notes text,
  equipment_requirements text, driver_requirements text, site_requirements text,
  active boolean not null default true, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  contract_number text, contract_name text,
  status text not null default 'Draft',
  effective_date date, expiration_date date, renewal_date date,
  owner uuid references auth.users(id),
  commercial_terms_summary text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.rates (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  lane_id uuid references public.lanes(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  rate_type text,
  amount numeric,
  unit text,
  currency text default 'USD',
  effective_date date, expiration_date date,
  fuel_surcharge text, fuel_method text,
  minimum_charge numeric, accessorials text,
  quote_reference text,
  contract_id uuid references public.contracts(id) on delete set null,
  status text not null default 'Draft',
  source text,
  approved_by uuid references auth.users(id), approval_date date,
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.rate_history (
  id uuid primary key default gen_random_uuid(),
  rate_id uuid not null references public.rates(id) on delete cascade,
  previous_amount numeric, new_amount numeric, percentage_change numeric,
  effective_date date, reason text, source text,
  approved_by uuid references auth.users(id), notes text,
  created_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  owner uuid references auth.users(id),
  name text not null,
  stage text not null default 'New',
  estimated_loads numeric, estimated_revenue numeric, probability int,
  expected_close_date date,
  qualification text, next_action text, next_action_date date,
  source text, loss_reason text, competitor text,
  capacity_status text default 'Serviceable',
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  bid_name text not null,
  bid_type text,
  status text not null default 'Identified',
  issue_date date, question_deadline date, due_date date, decision_date date,
  owner uuid references auth.users(id),
  qualification_status text default 'Not Reviewed',
  pricing_status text default 'Not Started',
  document_status text default 'Not Started',
  estimated_revenue numeric, estimated_loads numeric,
  outcome text, loss_reason text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.lost_business (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  lane_id uuid references public.lanes(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  occurred_on date,
  estimated_loads numeric, estimated_revenue numeric,
  reason_category text not null default 'Other',
  reason_detail text, competitor text,
  rate_issue boolean default false, capacity_issue boolean default false,
  driver_issue boolean default false, equipment_issue boolean default false,
  qualification_issue boolean default false, service_issue boolean default false,
  customer_issue boolean default false,
  recoverable boolean default false, recovery_plan text,
  owner uuid references auth.users(id), status text default 'Open', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ============ EQUIPMENT ============
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  unit_number text,
  category text, equipment_type text, color text,
  certified_weight text, capacity text,
  model_year int, make text, serial_number text, vin text, plate_number text,
  status text not null default 'Active',
  ownership_type text,
  current_customer_id uuid references public.customers(id) on delete set null,
  current_site_id uuid references public.sites(id) on delete set null,
  notes text,
  source_system text, source_file text, source_sheet text, source_row int, source_record jsonb,
  import_batch_id uuid references public.import_batches(id),
  data_quality_status text default 'Verified', needs_review boolean not null default false, review_reason text, import_notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  site_id uuid references public.sites(id) on delete set null,
  lane_id uuid references public.lanes(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  assignment_type text, start_date date, end_date date,
  status text default 'Active', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.equipment_leases (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  lease_type text, start_date date, end_date date, rate numeric,
  contract_id uuid references public.contracts(id) on delete set null,
  status text default 'Active', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.equipment_compliance (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  jurisdiction text, requirement text, registration_type text, plate_number text,
  effective_date date, expiration_date date,
  status text default 'Active', required boolean default true, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.equipment_technology (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  technology_type text, device_id text, cable_id text,
  installation_date date, removal_date date,
  status text default 'Installed', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ============ SAFETY ============
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  employee_reference text,
  status text default 'Active',
  hire_date date,
  qualification_status text default 'Not Reviewed',
  general_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.driver_qualifications (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  qualification_type text, status text default 'Active',
  issue_date date, expiration_date date, verification_date date, verification_source text,
  notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.driver_safety_events (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  event_date date, category text, severity text, status text default 'Open',
  source text, resolution text, review_date date, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_date date,
  incident_type text, severity text,
  customer_id uuid references public.customers(id) on delete set null,
  site_id uuid references public.sites(id) on delete set null,
  equipment_id uuid references public.equipment(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  lane_id uuid references public.lanes(id) on delete set null,
  status text not null default 'Open',
  description text, immediate_action text, root_cause text, corrective_action text,
  owner uuid references auth.users(id), due_date date,
  resolution text, customer_communication text, customer_notified boolean default false,
  closed_date date, review_date date, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.corrective_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  action text not null, owner uuid references auth.users(id),
  due_date date, status text not null default 'Open',
  completion_date date, completion_evidence text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.site_assessments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  assessment_type text, assessment_date date, next_review_date date,
  assessor text, status text default 'Draft', approval_status text default 'Pending',
  findings text, restrictions text, corrective_actions text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ============ SHARED ============
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  document_name text not null,
  document_type text,
  classification text default 'Public Internal',
  linked_entity_type text, linked_entity_id uuid,
  version text, effective_date date, expiration_date date,
  owner uuid references auth.users(id),
  source text, storage_path text,
  status text default 'Active', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  owner uuid references auth.users(id),
  linked_entity_type text, linked_entity_id uuid,
  due_date date, priority text not null default 'Normal',
  status text not null default 'Open', completed_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_type text not null, meeting_date date not null default current_date,
  title text, participants text, notes text, decisions text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null, category text, owner uuid references auth.users(id),
  version text, effective_date date, review_date date, status text default 'Draft',
  customer_id uuid references public.customers(id) on delete set null,
  site_id uuid references public.sites(id) on delete set null,
  content text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  entity_type text not null, entity_id uuid,
  action text not null, field_name text, old_value text, new_value text,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index idx_customers_name on public.customers (legal_name);
create index idx_customers_status on public.customers (status);
create index idx_sites_customer on public.sites (customer_id);
create index idx_sites_name on public.sites (site_name);
create index idx_contacts_customer on public.contacts (customer_id);
create index idx_products_customer on public.products (customer_id);
create index idx_lanes_customer on public.lanes (customer_id);
create index idx_rates_customer on public.rates (customer_id);
create index idx_rates_effective on public.rates (effective_date);
create index idx_rates_expiration on public.rates (expiration_date);
create index idx_rate_history_rate on public.rate_history (rate_id);
create index idx_bids_due on public.bids (due_date);
create index idx_bids_customer on public.bids (customer_id);
create index idx_opps_stage on public.opportunities (stage);
create index idx_opps_customer on public.opportunities (customer_id);
create index idx_lost_customer on public.lost_business (customer_id);
create index idx_equipment_unit on public.equipment (unit_number);
create index idx_equipment_vin on public.equipment (vin);
create index idx_equipment_status on public.equipment (status);
create index idx_eq_assign_equipment on public.equipment_assignments (equipment_id);
create index idx_eq_comp_expiration on public.equipment_compliance (expiration_date);
create index idx_incidents_status on public.incidents (status);
create index idx_incidents_due on public.incidents (due_date);
create index idx_ca_due on public.corrective_actions (due_date);
create index idx_assessments_next on public.site_assessments (next_review_date);
create index idx_contracts_expiration on public.contracts (expiration_date);
create index idx_tasks_due on public.tasks (due_date);
create index idx_documents_entity on public.documents (linked_entity_type, linked_entity_id);
create index idx_requirements_entity on public.requirements (entity_type, entity_id);
create index idx_audit_entity on public.audit_log (entity_type, entity_id);

-- ============ GRANTS, RLS, POLICIES, TRIGGERS ============
do $$
declare
  t text;
  commercial text[] := array['lookup_values','import_batches','import_staging','customers','sites','contacts','requirements','products','lanes','contracts','rates','rate_history','opportunities','bids','lost_business','equipment','equipment_assignments','equipment_leases','equipment_compliance','equipment_technology','documents','tasks','meetings','knowledge_articles','site_assessments'];
  restricted text[] := array['drivers','driver_qualifications','driver_safety_events'];
  incident_tables text[] := array['incidents','corrective_actions'];
  all_tables text[];
begin
  foreach t in array commercial loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read_authenticated" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "write_staff" on public.%I for insert to authenticated with check (public.can_write())', t);
    execute format('create policy "update_staff" on public.%I for update to authenticated using (public.can_write()) with check (public.can_write())', t);
    execute format('create policy "delete_admin" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;

  foreach t in array restricted loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read_safety" on public.%I for select to authenticated using (public.can_view_safety())', t);
    execute format('create policy "write_safety" on public.%I for insert to authenticated with check (public.can_write_safety())', t);
    execute format('create policy "update_safety" on public.%I for update to authenticated using (public.can_write_safety()) with check (public.can_write_safety())', t);
    execute format('create policy "delete_admin" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;

  foreach t in array incident_tables loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read_incidents" on public.%I for select to authenticated using (public.can_view_incidents())', t);
    execute format('create policy "write_safety" on public.%I for insert to authenticated with check (public.can_write_safety() or public.has_role(auth.uid(), ''operations''))', t);
    execute format('create policy "update_safety" on public.%I for update to authenticated using (public.can_write_safety() or public.has_role(auth.uid(), ''operations'')) with check (public.can_write_safety() or public.has_role(auth.uid(), ''operations''))', t);
    execute format('create policy "delete_admin" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;

  all_tables := commercial || restricted || incident_tables || array['profiles'];
  foreach t in array all_tables loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.update_updated_at_column()', t);
  end loop;
end $$;

-- profiles
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_read" on public.profiles for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = auth.uid());

-- user_roles
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "roles_read_self_or_admin" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "roles_admin_manage" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- audit log
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit_read_admin" on public.audit_log for select to authenticated using (public.has_any_role(auth.uid(), array['admin','management']::public.app_role[]));

-- seed configurable lookup values
insert into public.lookup_values (category, value, label, sort_order) values
 ('customer_status','Prospect','Prospect',1),('customer_status','Qualified Prospect','Qualified Prospect',2),
 ('customer_status','Active','Active',3),('customer_status','On Hold','On Hold',4),
 ('customer_status','Inactive','Inactive',5),('customer_status','Lost','Lost',6),('customer_status','Archived','Archived',7),
 ('qualification_status','Not Reviewed','Not Reviewed',1),('qualification_status','Under Review','Under Review',2),
 ('qualification_status','Qualified','Qualified',3),('qualification_status','Conditional','Conditional',4),('qualification_status','Not Qualified','Not Qualified',5),
 ('equipment_category','Tractor','Tractor',1),('equipment_category','Tank Trailer','Tank Trailer',2),('equipment_category','Van Trailer','Van Trailer',3),
 ('equipment_category','Dry Bulk','Dry Bulk',4),('equipment_category','Dump','Dump',5),('equipment_category','Vacuum Tank','Vacuum Tank',6),('equipment_category','Other','Other',7),
 ('bid_status','Identified','Identified',1),('bid_status','Qualification','Qualification',2),('bid_status','Preparing','Preparing',3),
 ('bid_status','Waiting on Information','Waiting on Information',4),('bid_status','Pricing','Pricing',5),('bid_status','Internal Review','Internal Review',6),
 ('bid_status','Submitted','Submitted',7),('bid_status','Won','Won',8),('bid_status','Lost','Lost',9),('bid_status','Withdrawn','Withdrawn',10),('bid_status','Cancelled','Cancelled',11),
 ('opportunity_stage','New','New',1),('opportunity_stage','Qualification','Qualification',2),('opportunity_stage','Qualified','Qualified',3),
 ('opportunity_stage','Proposal','Proposal',4),('opportunity_stage','Negotiation','Negotiation',5),('opportunity_stage','Won','Won',6),
 ('opportunity_stage','Lost','Lost',7),('opportunity_stage','On Hold','On Hold',8),
 ('rate_status','Draft','Draft',1),('rate_status','Quoted','Quoted',2),('rate_status','Pending Approval','Pending Approval',3),
 ('rate_status','Active','Active',4),('rate_status','Expired','Expired',5),('rate_status','Rejected','Rejected',6),('rate_status','Superseded','Superseded',7),
 ('lost_reason','Capacity','Capacity',1),('lost_reason','Driver','Driver',2),('lost_reason','Equipment','Equipment',3),('lost_reason','Rate','Rate',4),
 ('lost_reason','Qualification','Qualification',5),('lost_reason','Safety','Safety',6),('lost_reason','Service','Service',7),
 ('lost_reason','Customer Decision','Customer Decision',8),('lost_reason','Competitor','Competitor',9),('lost_reason','Route','Route',10),
 ('lost_reason','Scheduling','Scheduling',11),('lost_reason','Other','Other',12),
 ('requirement_category','Safety','Safety',1),('requirement_category','PPE','PPE',2),('requirement_category','Operations','Operations',3),
 ('requirement_category','Scheduling','Scheduling',4),('requirement_category','Routing','Routing',5),('requirement_category','Equipment','Equipment',6),
 ('requirement_category','Documentation','Documentation',7),('requirement_category','Security','Security',8),
 ('requirement_category','Environmental','Environmental',9),('requirement_category','Customer-specific','Customer-specific',10),('requirement_category','Other','Other',11);

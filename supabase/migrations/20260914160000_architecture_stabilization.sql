-- Additive stabilization. Invalid existing relationships stop this migration;
-- never silently discard or invent HEG records to make a constraint pass.
begin;

alter table public.refused_loads
  add column product_id uuid references public.products(id) on delete restrict,
  add column site_id uuid references public.sites(id) on delete restrict,
  add column lane_id uuid references public.lanes(id) on delete restrict,
  add column internal_notes text,
  add column estimated_lost_revenue numeric check (estimated_lost_revenue >= 0 and estimated_lost_revenue <> 'NaN'::numeric),
  add column updated_by uuid references auth.users(id) on delete set null,
  add constraint refused_loads_customer_id_fkey foreign key (customer_id) references public.customers(id) on delete restrict,
  add constraint refused_loads_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete restrict,
  add constraint refused_loads_equipment_id_fkey foreign key (equipment_id) references public.equipment(id) on delete restrict,
  add constraint refused_loads_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.refused_loads alter column customer_id set not null;
alter table public.sites alter column customer_id set not null;
create index refused_loads_site_idx on public.refused_loads(site_id);
create index refused_loads_lane_idx on public.refused_loads(lane_id);

-- A refused request is not a second commercial loss. Linked loss records are
-- context only; their amounts must not contribute a second revenue estimate.
alter table public.lost_business add column refused_load_id uuid unique references public.refused_loads(id) on delete restrict;
alter table public.lost_business add constraint linked_loss_no_duplicate_value
  check (refused_load_id is null or (estimated_revenue is null and estimated_loads is null));

-- Composite foreign keys enforce customer consistency, including when a parent
-- is reassigned. MATCH SIMPLE permits a genuinely optional relationship.
do $$
declare t text; rel record;
begin
  foreach t in array array['sites','contacts','products','lanes','contracts','opportunities','refused_loads'] loop
    execute format('alter table public.%I add constraint %I unique(id, customer_id)', t, t || '_id_customer_key');
  end loop;
  for rel in select * from (values
    ('contacts','site_id','sites'),
    ('rates','site_id','sites'),('rates','lane_id','lanes'),('rates','product_id','products'),('rates','contract_id','contracts'),
    ('opportunities','site_id','sites'),('bids','opportunity_id','opportunities'),
    ('refused_loads','contact_id','contacts'),('refused_loads','product_id','products'),('refused_loads','site_id','sites'),('refused_loads','lane_id','lanes'),
    ('lost_business','site_id','sites'),('lost_business','lane_id','lanes'),('lost_business','product_id','products'),('lost_business','opportunity_id','opportunities'),('lost_business','refused_load_id','refused_loads'),
    ('equipment_assignments','site_id','sites'),('equipment_assignments','lane_id','lanes'),('equipment_assignments','product_id','products'),
    ('equipment_leases','contract_id','contracts'),('incidents','site_id','sites'),('incidents','lane_id','lanes')
  ) as v(child, column_name, parent) loop
    execute format('alter table public.%I add constraint %I foreign key (%I, customer_id) references public.%I(id, customer_id)', rel.child, rel.child || '_' || rel.column_name || '_customer_fk', rel.column_name, rel.parent);
    execute format('alter table public.%I add constraint %I check (%I is null or customer_id is not null)', rel.child, rel.child || '_' || rel.column_name || '_needs_customer', rel.column_name);
  end loop;
end $$;

-- New signups receive no business access until an administrator assigns a role.
-- Bootstrap administrators out of band; never award admin to the first signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing;
  return new;
end $$;
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id
    where r.user_id=_user_id and r.role=_role and p.active)
$$;
create or replace function public.has_any_role(_user_id uuid, _roles public.app_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id
    where r.user_id=_user_id and r.role=any(_roles) and p.active)
$$;
grant execute on function public.has_role(uuid,public.app_role), public.has_any_role(uuid,public.app_role[]), public.can_view_safety(), public.can_view_incidents(), public.can_write_safety(), public.can_write() to authenticated;

create function public.can_access_table(_table text, _write boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
 select public.has_any_role(auth.uid(),
 case
 when _table in ('lookup_values','import_batches','import_staging','user_invitations','user_roles') and _write then array['admin']
 when _table in ('drivers','driver_qualifications','driver_safety_events') then
   case when _write then array['admin','safety'] else array['admin','safety','management'] end
 when _table in ('incidents','corrective_actions','site_assessments') then
   case when _write then array['admin','safety','operations'] else array['admin','safety','operations','management'] end
 when _table in ('rates','rate_history','bids','contracts') then
   case when _write then array['admin','sales'] else array['admin','sales','operations','management'] end
 when not _write then array['admin','sales','operations','safety','management','read_only']
 when _table in ('customers','contacts','products','lanes','opportunities','lost_business') then array['admin','sales']
 when _table in ('sites','refused_loads') then array['admin','sales','operations']
 when _table in ('equipment','equipment_assignments','equipment_leases','equipment_compliance','equipment_technology') then array['admin','operations']
 when _table in ('requirements','documents','tasks','meetings','knowledge_articles') then array['admin','sales','operations','safety']
 else array['admin'] end::public.app_role[])
$$;
revoke all on function public.can_access_table(text,boolean) from public, anon;
grant execute on function public.can_access_table(text,boolean) to authenticated;

-- Replace rather than layer permissive policies (Postgres ORs policies).
do $$
declare t text; p record;
begin
 foreach t in array array['lookup_values','import_batches','import_staging','customers','sites','contacts','requirements','products','lanes','contracts','rates','rate_history','opportunities','bids','lost_business','equipment','equipment_assignments','equipment_leases','equipment_compliance','equipment_technology','documents','tasks','meetings','knowledge_articles','site_assessments','drivers','driver_qualifications','driver_safety_events','incidents','corrective_actions','refused_loads'] loop
   for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
     execute format('drop policy %I on public.%I',p.policyname,t);
   end loop;
   execute format('grant select,insert,update,delete on public.%I to authenticated',t);
   execute format('create policy read_allowed on public.%I for select to authenticated using(public.can_access_table(%L,false))',t,t);
   if t <> 'rate_history' then
     execute format('create policy insert_allowed on public.%I for insert to authenticated with check(public.can_access_table(%L,true))',t,t);
     execute format('create policy update_allowed on public.%I for update to authenticated using(public.can_access_table(%L,true)) with check(public.can_access_table(%L,true))',t,t,t);
     execute format('create policy delete_admin on public.%I for delete to authenticated using(public.has_role(auth.uid(),''admin''))',t);
   end if;
 end loop;
end $$;
grant insert,update,delete on public.user_roles to authenticated;
grant select,insert,update,delete on public.user_invitations to authenticated;
alter table public.user_invitations add constraint invitation_role_valid check(role in ('admin','sales','operations','safety','management','read_only'));

-- A user can edit their profile but cannot reactivate their own disabled account.
create function public.protect_profile_active() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.active is distinct from old.active and current_user='authenticated' and not public.has_role(auth.uid(),'admin') then
   raise exception 'Only administrators can change account access' using errcode='42501';
 end if;
 return new;
end $$;
create trigger protect_profile_active before update on public.profiles for each row execute function public.protect_profile_active();

-- Server attribution cannot be forged by form payloads.
create function public.attribute_refused_load() returns trigger language plpgsql set search_path = '' as $$
begin
 if tg_op='INSERT' then new.created_by=auth.uid(); else new.created_by=old.created_by; new.created_at=old.created_at; end if;
 new.updated_by=auth.uid(); new.updated_at=now(); return new;
end $$;
create trigger attribute_refused_load before insert or update on public.refused_loads for each row execute function public.attribute_refused_load();

-- Each edit keeps the complete previous and replacement record, not just amount.
alter table public.rate_history add column previous_record jsonb, add column new_record jsonb,
 add column changed_by uuid references auth.users(id) on delete set null;
alter table public.rates add column change_reason text;
alter table public.rates add constraint rate_amount_valid check(amount >= 0 and amount <> 'NaN'::numeric);
alter table public.rates add constraint rate_dates_valid check(expiration_date is null or expiration_date >= effective_date);
create function public.preserve_rate_history() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 new.created_by=old.created_by; new.created_at=old.created_at;
 new.updated_by=auth.uid(); new.updated_at=now();
 if (to_jsonb(new)-array['updated_at','updated_by','change_reason']) is not distinct from
    (to_jsonb(old)-array['updated_at','updated_by','change_reason']) then return new; end if;
 if nullif(btrim(new.change_reason),'') is null or new.effective_date is null then
   raise exception 'Rate changes require an effective date and reason' using errcode='23514';
 end if;
 new.updated_by=auth.uid();
 insert into public.rate_history(rate_id,previous_amount,new_amount,percentage_change,effective_date,reason,previous_record,new_record,changed_by)
 values(old.id,old.amount,new.amount,case when old.amount<>0 then (new.amount-old.amount)/old.amount*100 end,new.effective_date,new.change_reason,to_jsonb(old),to_jsonb(new),auth.uid());
 new.change_reason=null;
 return new;
end $$;
create trigger preserve_rate_history before update on public.rates for each row execute function public.preserve_rate_history();
-- Preserve history even when an admin attempts a cascading customer/rate delete.
alter table public.rate_history drop constraint rate_history_rate_id_fkey;
alter table public.rate_history add constraint rate_history_rate_id_fkey foreign key(rate_id) references public.rates(id) on delete restrict;
revoke insert,update,delete on public.rate_history from authenticated;
revoke all on function public.preserve_rate_history() from public,anon,authenticated;

-- All updates, including direct API updates, run the history trigger atomically.
-- Locking plus expected timestamp prevents stale editors from overwriting a rate.
create function public.revise_rate(_id uuid, _expected_updated_at timestamptz, _values jsonb)
returns public.rates language plpgsql set search_path = '' as $$
declare old_rate public.rates; result public.rates; patch public.rates;
begin
 if not public.can_access_table('rates',true) then raise exception 'Rate editing is restricted' using errcode='42501'; end if;
 select * into old_rate from public.rates where id=_id for update;
 if not found or old_rate.updated_at is distinct from _expected_updated_at then
   raise exception 'This rate changed. Refresh before saving.' using errcode='40001';
 end if;
 if exists(select 1 from jsonb_object_keys(_values) k where k not in
 ('amount','unit','currency','rate_type','effective_date','expiration_date','fuel_surcharge','fuel_method','minimum_charge','accessorials','quote_reference','status','source','notes','change_reason')) then
   raise exception 'Unsupported rate field' using errcode='22023';
 end if;
 patch=jsonb_populate_record(old_rate,_values);
 update public.rates set amount=patch.amount, unit=patch.unit,currency=patch.currency,rate_type=patch.rate_type,
 effective_date=patch.effective_date,expiration_date=patch.expiration_date,fuel_surcharge=patch.fuel_surcharge,
 fuel_method=patch.fuel_method,minimum_charge=patch.minimum_charge,accessorials=patch.accessorials,
 quote_reference=patch.quote_reference,status=patch.status,source=patch.source,notes=patch.notes,change_reason=patch.change_reason
 where id=_id returning * into result;
 return result;
end $$;
revoke all on function public.revise_rate(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.revise_rate(uuid,timestamptz,jsonb) to authenticated;

-- Only one open assignment per unit. Current placement is read from history;
-- legacy equipment.current_* values remain for reconciliation, not new writes.
create unique index equipment_one_open_assignment on public.equipment_assignments(equipment_id) where status='Active' and end_date is null;
alter table public.equipment_assignments add constraint assignment_dates_valid check(end_date is null or start_date is null or end_date >= start_date);
create view public.current_equipment_assignments with (security_invoker=true) as
 select * from public.equipment_assignments where status='Active' and end_date is null and (start_date is null or start_date<=current_date);
grant select on public.current_equipment_assignments to authenticated;

commit;

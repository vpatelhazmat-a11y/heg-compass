begin;
-- Preserve known legacy placements once; conflicting histories require review.
do $$ begin
 if exists(select 1 from public.equipment e join public.equipment_assignments a on a.equipment_id=e.id and a.status='Active' and a.end_date is null
   where (e.current_customer_id is not null or e.current_site_id is not null)
   and (e.current_customer_id is distinct from a.customer_id or e.current_site_id is distinct from a.site_id)) then
   raise exception 'Equipment current placement conflicts with assignment history. Reconcile before migration.';
 end if;
end $$;
insert into public.equipment_assignments(equipment_id,customer_id,site_id,status,notes)
select e.id,e.current_customer_id,e.current_site_id,'Active','Preserved from legacy equipment placement; start date not recorded.'
from public.equipment e where (e.current_customer_id is not null or e.current_site_id is not null)
and not exists(select 1 from public.equipment_assignments a where a.equipment_id=e.id and a.status='Active' and a.end_date is null);
create function public.protect_equipment_placement() returns trigger language plpgsql set search_path='' as $$
begin
 if (tg_op='INSERT' and (new.current_customer_id is not null or new.current_site_id is not null)) or
 (tg_op='UPDATE' and (new.current_customer_id is distinct from old.current_customer_id or new.current_site_id is distinct from old.current_site_id)) then
  raise exception 'Manage equipment placement through assignment history' using errcode='23514';
 end if;
 return new;
end $$;
create trigger protect_equipment_placement before insert or update on public.equipment for each row execute function public.protect_equipment_placement();
create function public.protect_assignment_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.equipment_id,new.customer_id,new.site_id,new.lane_id,new.product_id) is distinct from
    (old.equipment_id,old.customer_id,old.site_id,old.lane_id,old.product_id) then
  raise exception 'Close this assignment and create another to preserve placement history' using errcode='23514';
 end if;
 return new;
end $$;
create trigger protect_assignment_identity before update on public.equipment_assignments for each row execute function public.protect_assignment_identity();
-- Do not carry an INSERT reason forward to authorize a later silent update.
create function public.initialize_rate() returns trigger language plpgsql set search_path='' as $$
begin new.change_reason=null; new.created_by=auth.uid(); new.updated_by=auth.uid(); return new; end $$;
create trigger initialize_rate before insert on public.rates for each row execute function public.initialize_rate();
alter table public.rates add constraint rate_minimum_valid check(minimum_charge >= 0 and minimum_charge not in ('NaN'::numeric,'Infinity'::numeric));
alter table public.rates add constraint rate_amount_finite check(amount <> 'Infinity'::numeric);
alter table public.refused_loads add constraint refused_revenue_finite check(estimated_lost_revenue <> 'Infinity'::numeric);

-- Archived master records remain addressable for history but cannot take new links.
create function public.reject_archived_parent() returns trigger language plpgsql set search_path='' as $$
declare value uuid; old_value uuid; col text; parent text;
begin
 for col,parent in select * from (values ('customer_id','customers'),('site_id','sites'),('equipment_id','equipment')) v(c,p) loop
  value=(to_jsonb(new)->>col)::uuid;
  old_value=case when tg_op='UPDATE' then (to_jsonb(old)->>col)::uuid end;
  if value is not null and value is distinct from old_value then
   if parent='customers' and exists(select 1 from public.customers where id=value and archived_at is not null) or
      parent='sites' and exists(select 1 from public.sites where id=value and archived_at is not null) or
      parent='equipment' and exists(select 1 from public.equipment where id=value and archived_at is not null) then
     raise exception 'Cannot link a new record to an archived %',parent using errcode='23514';
   end if;
  end if;
 end loop;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['sites','contacts','products','lanes','rates','bids','opportunities','refused_loads','equipment_assignments','equipment_compliance','equipment_leases','equipment_technology','incidents','site_assessments'] loop
  execute format('create trigger reject_archived_parent before insert or update on public.%I for each row execute function public.reject_archived_parent()',t);
 end loop;
end $$;
commit;

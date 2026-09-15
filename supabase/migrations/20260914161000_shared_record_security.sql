begin;
-- Existing polymorphic links keep their UI contract but gain real foreign keys.
-- Generated FK columns cannot be forged separately from the entity pair.
do $$
declare t text; kind text; parent text; type_col text; id_col text;
begin
 foreach t in array array['requirements','documents','tasks'] loop
  type_col=case when t='requirements' then 'entity_type' else 'linked_entity_type' end;
  id_col=case when t='requirements' then 'entity_id' else 'linked_entity_id' end;
  execute format('alter table public.%I add constraint entity_pair_valid check ((%I is null and %I is null) or (%I is not null and %I in (''customer'',''site'',''equipment'',''incident'',''driver'',''rate'',''bid'',''opportunity'',''contract'') and %I is not null))',t,type_col,id_col,type_col,type_col,id_col);
  foreach kind in array array['customer','site','equipment','incident','driver','rate','bid','opportunity','contract'] loop
   parent=case kind when 'equipment' then 'equipment' when 'opportunity' then 'opportunities' else kind||'s' end;
   execute format('alter table public.%I add column %I uuid generated always as (case when %I=%L then %I end) stored references public.%I(id) on delete restrict',t,'linked_'||kind||'_fk',type_col,kind,id_col,parent);
  end loop;
 end loop;
end $$;

create function public.can_access_link(_kind text, _write boolean) returns boolean
language sql stable set search_path='' as $$
 select case when _kind is null then true else public.can_access_table(case _kind
 when 'customer' then 'customers' when 'site' then 'sites' when 'equipment' then 'equipment'
 when 'incident' then 'incidents' when 'driver' then 'drivers' when 'rate' then 'rates'
 when 'bid' then 'bids' when 'opportunity' then 'opportunities' when 'contract' then 'contracts'
 else '__denied__' end, _write) end
$$;
revoke all on function public.can_access_link(text,boolean) from public,anon;
grant execute on function public.can_access_link(text,boolean) to authenticated;

-- Restricted policies AND with the table policies, preventing metadata leaks.
create policy document_link_read on public.documents as restrictive for select to authenticated
 using(public.can_access_link(linked_entity_type,false) and
 case classification when 'Public Internal' then true when 'Operations' then true
 when 'Commercial' then public.can_access_table('rates',false)
 when 'Safety' then public.can_access_table('drivers',false)
 else public.has_any_role(auth.uid(),array['admin','management']::public.app_role[]) end);
create policy document_link_insert on public.documents as restrictive for insert to authenticated
 with check(public.can_access_link(linked_entity_type,true) and
 case classification when 'Public Internal' then true when 'Operations' then true
 when 'Commercial' then public.can_access_table('rates',true)
 when 'Safety' then public.can_access_table('drivers',true)
 else public.has_role(auth.uid(),'admin') end);
create policy document_link_update on public.documents as restrictive for update to authenticated
 using(public.can_access_link(linked_entity_type,true)) with check(public.can_access_link(linked_entity_type,true) and
 case classification when 'Public Internal' then true when 'Operations' then true
 when 'Commercial' then public.can_access_table('rates',true)
 when 'Safety' then public.can_access_table('drivers',true)
 else public.has_role(auth.uid(),'admin') end);
create policy task_link_read on public.tasks as restrictive for select to authenticated using(public.can_access_link(linked_entity_type,false));
create policy task_link_insert on public.tasks as restrictive for insert to authenticated with check(public.can_access_link(linked_entity_type,true));
create policy task_link_update on public.tasks as restrictive for update to authenticated using(public.can_access_link(linked_entity_type,true)) with check(public.can_access_link(linked_entity_type,true));
create policy requirement_link_read on public.requirements as restrictive for select to authenticated using(public.can_access_link(entity_type,false));
-- Safety staff maintain structured site safety requirements, not customer/rate data.
create policy requirement_link_insert on public.requirements as restrictive for insert to authenticated with check(public.can_access_link(entity_type,true) or (entity_type='site' and category in ('Safety','PPE','Environmental','Security') and public.has_role(auth.uid(),'safety')));
create policy requirement_link_update on public.requirements as restrictive for update to authenticated
 using(public.can_access_link(entity_type,true) or (entity_type='site' and category in ('Safety','PPE','Environmental','Security') and public.has_role(auth.uid(),'safety')))
 with check(public.can_access_link(entity_type,true) or (entity_type='site' and category in ('Safety','PPE','Environmental','Security') and public.has_role(auth.uid(),'safety')));

-- Profile creation belongs to the authentication trigger. A deleted/disabled
-- profile must not be recreated by its owner to restore access.
drop policy profiles_insert_self on public.profiles;
revoke insert on public.profiles from authenticated;
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.can_access_table('customers',false));

-- Critical audit entries are database-owned; clients cannot forge history.
drop policy if exists audit_insert_self on public.audit_log;
revoke insert on public.audit_log from authenticated;
create function public.audit_record_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_log(user_id,entity_type,entity_id,action)
 values(auth.uid(),tg_table_name,case when tg_op='DELETE' then old.id else new.id end,lower(tg_op));
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function public.audit_record_change() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['customers','sites','contacts','products','lanes','rates','refused_loads','lost_business','equipment','equipment_assignments','requirements','incidents','driver_safety_events','user_roles','user_invitations'] loop
  execute format('create trigger audit_record_change after insert or update or delete on public.%I for each row execute function public.audit_record_change()',t);
 end loop;
end $$;
commit;

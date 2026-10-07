begin;

-- Read the actual parent under its RLS policy. In particular, document
-- classification and linked-record visibility must govern its messages too.
create function public.can_access_chatter_record(_kind text,_id uuid,_write boolean) returns boolean
language plpgsql stable set search_path='' as $$
declare parent_table text; parent_record jsonb;
begin
  parent_table := '{"customer":"customers","site":"sites","equipment":"equipment","driver":"drivers","bid":"bids","contact":"contacts","product":"products","lane":"lanes","rate":"rates","contract":"contracts","opportunity":"opportunities","refused_load":"refused_loads","incident":"incidents","site_assessment":"site_assessments","task":"tasks","document":"documents","requirement":"requirements","lost_business":"lost_business","corrective_action":"corrective_actions","equipment_assignment":"equipment_assignments","equipment_lease":"equipment_leases","equipment_compliance":"equipment_compliance","equipment_technology":"equipment_technology","knowledge_article":"knowledge_articles"}'::jsonb ->> _kind;
  if parent_table is null or _id is null or not public.can_access_table(parent_table,_write) then return false; end if;
  execute format('select to_jsonb(r) from public.%I r where id=$1',parent_table) into parent_record using _id;
  if parent_record is null then return false; end if;
  if not _write then return true; end if;
  if parent_record->>'archived_at' is not null then return false; end if;
  if parent_table='documents' then
    return public.can_access_link(parent_record->>'linked_entity_type',true) and
      case parent_record->>'classification'
        when 'Public Internal' then true when 'Operations' then true
        when 'Commercial' then public.can_access_table('rates',true)
        when 'Safety' then public.can_access_table('drivers',true)
        else public.has_role(auth.uid(),'admin') end;
  elsif parent_table='tasks' then
    return public.can_access_link(parent_record->>'linked_entity_type',true);
  elsif parent_table='requirements' then
    return public.can_access_link(parent_record->>'entity_type',true) or
      (parent_record->>'entity_type'='site' and parent_record->>'category' in ('Safety','PPE','Environmental','Security') and public.has_role(auth.uid(),'safety'));
  end if;
  return true;
end $$;
revoke all on function public.can_access_chatter_record(text,uuid,boolean) from public,anon;
grant execute on function public.can_access_chatter_record(text,uuid,boolean) to authenticated;

alter table public.mail_messages drop constraint mail_messages_entity_valid;
alter table public.mail_messages add constraint mail_messages_entity_valid check(linked_entity_type in ('customer','site','equipment','driver','bid','contact','product','lane','rate','contract','opportunity','refused_load','incident','site_assessment','task','document','requirement','lost_business','corrective_action','equipment_assignment','equipment_lease','equipment_compliance','equipment_technology','knowledge_article'));
alter table public.mail_messages add column linked_contact_fk uuid generated always as (case when linked_entity_type='contact' then linked_entity_id end) stored references public.contacts(id) on delete restrict;
alter table public.mail_messages add column linked_product_fk uuid generated always as (case when linked_entity_type='product' then linked_entity_id end) stored references public.products(id) on delete restrict;
alter table public.mail_messages add column linked_lane_fk uuid generated always as (case when linked_entity_type='lane' then linked_entity_id end) stored references public.lanes(id) on delete restrict;
alter table public.mail_messages add column linked_refused_load_fk uuid generated always as (case when linked_entity_type='refused_load' then linked_entity_id end) stored references public.refused_loads(id) on delete restrict;
alter table public.mail_messages add column linked_site_assessment_fk uuid generated always as (case when linked_entity_type='site_assessment' then linked_entity_id end) stored references public.site_assessments(id) on delete restrict;
alter table public.mail_messages add column linked_task_fk uuid generated always as (case when linked_entity_type='task' then linked_entity_id end) stored references public.tasks(id) on delete restrict;
alter table public.mail_messages add column linked_document_fk uuid generated always as (case when linked_entity_type='document' then linked_entity_id end) stored references public.documents(id) on delete restrict;
alter table public.mail_messages add column linked_requirement_fk uuid generated always as (case when linked_entity_type='requirement' then linked_entity_id end) stored references public.requirements(id) on delete restrict;
alter table public.mail_messages add column linked_lost_business_fk uuid generated always as (case when linked_entity_type='lost_business' then linked_entity_id end) stored references public.lost_business(id) on delete restrict;
alter table public.mail_messages add column linked_corrective_action_fk uuid generated always as (case when linked_entity_type='corrective_action' then linked_entity_id end) stored references public.corrective_actions(id) on delete restrict;
alter table public.mail_messages add column linked_equipment_assignment_fk uuid generated always as (case when linked_entity_type='equipment_assignment' then linked_entity_id end) stored references public.equipment_assignments(id) on delete restrict;
alter table public.mail_messages add column linked_equipment_lease_fk uuid generated always as (case when linked_entity_type='equipment_lease' then linked_entity_id end) stored references public.equipment_leases(id) on delete restrict;
alter table public.mail_messages add column linked_equipment_compliance_fk uuid generated always as (case when linked_entity_type='equipment_compliance' then linked_entity_id end) stored references public.equipment_compliance(id) on delete restrict;
alter table public.mail_messages add column linked_equipment_technology_fk uuid generated always as (case when linked_entity_type='equipment_technology' then linked_entity_id end) stored references public.equipment_technology(id) on delete restrict;
alter table public.mail_messages add column linked_knowledge_article_fk uuid generated always as (case when linked_entity_type='knowledge_article' then linked_entity_id end) stored references public.knowledge_articles(id) on delete restrict;

drop policy mail_messages_read on public.mail_messages;
create policy mail_messages_read on public.mail_messages for select to authenticated using(public.can_access_chatter_record(linked_entity_type,linked_entity_id,false));
drop policy mail_messages_insert on public.mail_messages;
create policy mail_messages_insert on public.mail_messages for insert to authenticated with check(kind in ('message','note') and public.can_access_chatter_record(linked_entity_type,linked_entity_id,true) and author_id=auth.uid() and field_name is null and old_value is null and new_value is null);

create function public.record_thread_access(_kind text,_id uuid) returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('readable',public.can_access_chatter_record(_kind,_id,false),'writable',public.can_access_chatter_record(_kind,_id,true))
$$;
revoke all on function public.record_thread_access(text,uuid) from public,anon;
grant execute on function public.record_thread_access(text,uuid) to authenticated;

-- Clients use this capability list before exposing newer record threads.
create function public.record_chatter_kinds() returns text[] language sql stable set search_path='' as $$ select array['customer','site','equipment','driver','bid','contact','product','lane','rate','contract','opportunity','refused_load','incident','site_assessment','task','document','requirement','lost_business','corrective_action','equipment_assignment','equipment_lease','equipment_compliance','equipment_technology','knowledge_article']::text[] $$;
revoke all on function public.record_chatter_kinds() from public,anon;
grant execute on function public.record_chatter_kinds() to authenticated;

create or replace function public.track_record_changes() returns trigger
language plpgsql security definer set search_path='' as $$
declare field text; note_field text; previous jsonb := to_jsonb(old);
  current_values jsonb := to_jsonb(new); record_kind text;
begin
  record_kind := '{"customers":"customer","sites":"site","equipment":"equipment","drivers":"driver","bids":"bid","contacts":"contact","products":"product","lanes":"lane","rates":"rate","contracts":"contract","opportunities":"opportunity","refused_loads":"refused_load","incidents":"incident","site_assessments":"site_assessment","tasks":"task","documents":"document","requirements":"requirement","lost_business":"lost_business","corrective_actions":"corrective_action","equipment_assignments":"equipment_assignment","equipment_leases":"equipment_lease","equipment_compliance":"equipment_compliance","equipment_technology":"equipment_technology","knowledge_articles":"knowledge_article"}'::jsonb ->> tg_table_name;
  if record_kind is null then return new; end if;
  for field in select jsonb_object_keys(current_values) loop
    if field in ('id','created_at','updated_at','created_by','updated_by','change_reason') or field like 'linked_%_fk' then continue; end if;
    if field='rich_text' then
      for note_field in select jsonb_object_keys(coalesce(previous->field,'{}'::jsonb) || coalesce(current_values->field,'{}'::jsonb)) loop
        if previous->field->note_field is distinct from current_values->field->note_field
          and previous->note_field is not distinct from current_values->note_field then
          insert into public.mail_messages(linked_entity_type,linked_entity_id,kind,body,author_id,field_name,old_value,new_value)
          values(record_kind,new.id,'change',replace(note_field,'_',' ') || ' formatting changed',auth.uid(),note_field || '_formatting','Earlier formatting','Updated formatting');
        end if;
      end loop;
      continue;
    end if;
    if previous->field is distinct from current_values->field then
      insert into public.mail_messages(linked_entity_type,linked_entity_id,kind,body,author_id,field_name,old_value,new_value)
      values(record_kind,new.id,'change',replace(field,'_',' ') || ' changed',auth.uid(),field,left(previous->>field,1000),left(current_values->>field,1000));
    end if;
  end loop;
  return new;
end $$;
create trigger track_record_changes after update on public.contacts for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.products for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.lanes for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.refused_loads for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.site_assessments for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.tasks for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.documents for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.requirements for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.lost_business for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.corrective_actions for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.equipment_assignments for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.equipment_leases for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.equipment_compliance for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.equipment_technology for each row execute function public.track_record_changes();
create trigger track_record_changes after update on public.knowledge_articles for each row execute function public.track_record_changes();

commit;

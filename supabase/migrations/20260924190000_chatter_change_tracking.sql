begin;

alter table public.mail_messages drop constraint mail_messages_kind_check;
alter table public.mail_messages add constraint mail_messages_kind_check
  check (kind in ('message','note','change'));
alter table public.mail_messages alter column author_id drop not null;
alter table public.mail_messages
  add column field_name text,
  add column old_value text,
  add column new_value text,
  add constraint mail_message_change_shape check (
    (kind = 'change' and field_name is not null) or
    (kind <> 'change' and field_name is null and old_value is null and new_value is null)
  );

drop policy mail_messages_insert on public.mail_messages;
create policy mail_messages_insert on public.mail_messages for insert to authenticated
with check(kind in ('message','note') and public.can_access_link(linked_entity_type,true)
  and author_id=auth.uid() and field_name is null and old_value is null and new_value is null);

create function public.track_record_changes() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  field text;
  previous jsonb := to_jsonb(old);
  current_values jsonb := to_jsonb(new);
  record_kind text;
begin
  record_kind := case tg_table_name
    when 'customers' then 'customer' when 'sites' then 'site'
    when 'equipment' then 'equipment' when 'incidents' then 'incident'
    when 'drivers' then 'driver' when 'rates' then 'rate'
    when 'bids' then 'bid' when 'opportunities' then 'opportunity'
    when 'contracts' then 'contract' end;
  if record_kind is null then return new; end if;
  for field in select jsonb_object_keys(current_values) loop
    if field in ('id','created_at','updated_at','created_by','updated_by','change_reason')
       or field like 'linked_%_fk' then continue; end if;
    if previous -> field is distinct from current_values -> field then
      insert into public.mail_messages
        (linked_entity_type,linked_entity_id,kind,body,author_id,field_name,old_value,new_value)
      values
        (record_kind,new.id,'change',replace(field,'_',' ') || ' changed',auth.uid(),field,
         left(previous ->> field,1000),left(current_values ->> field,1000));
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.track_record_changes() from public,anon,authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['customers','sites','equipment','incidents','drivers','rates','bids','opportunities','contracts'] loop
    execute format('create trigger track_record_changes after update on public.%I for each row execute function public.track_record_changes()',table_name);
  end loop;
end $$;

commit;

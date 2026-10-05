begin;

-- Formatting is separate from existing text so search, exports, and older
-- integrations continue using readable notes.
create function public.sanitize_note_node(_node jsonb, _depth integer default 0)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare kind text; clean jsonb; child jsonb; children jsonb := '[]'; mark jsonb;
  clean_marks jsonb := '[]'; href text; allowed text[];
begin
  if _depth > 16 or jsonb_typeof(_node) is distinct from 'object' then return null; end if;
  kind := _node->>'type';
  if kind is null or kind not in ('doc','paragraph','heading','bulletList','orderedList','listItem','blockquote','codeBlock','horizontalRule','hardBreak','text') then return null; end if;
  clean := jsonb_build_object('type', kind);
  if kind = 'text' then
    if jsonb_typeof(_node->'text') is distinct from 'string' then return null; end if;
    clean := clean || jsonb_build_object('text', left(_node->>'text',50000));
    if jsonb_typeof(_node->'marks') = 'array' then
      for mark in select value from jsonb_array_elements(_node->'marks') limit 10 loop
        if mark->>'type' in ('bold','italic','underline','strike','code') then
          clean_marks := clean_marks || jsonb_build_array(jsonb_build_object('type',mark->>'type'));
        elsif mark->>'type' = 'link' then
          href := mark->'attrs'->>'href';
          if length(href) <= 2048 and href ~* '^(https?://|mailto:)' and href !~ '[[:space:][:cntrl:]]' then
            clean_marks := clean_marks || jsonb_build_array(jsonb_build_object('type','link','attrs',jsonb_build_object('href',href)));
          end if;
        end if;
      end loop;
      clean := clean || jsonb_build_object('marks',clean_marks);
    end if;
    return clean;
  end if;
  if kind = 'heading' then clean := clean || jsonb_build_object('attrs',jsonb_build_object('level',case when _node->'attrs'->>'level' = '3' then 3 else 2 end)); end if;
  if kind = 'orderedList' then clean := clean || jsonb_build_object('attrs',jsonb_build_object('start',case when _node->'attrs'->>'start' ~ '^[0-9]{1,6}$' then least(100000,greatest(1,(_node->'attrs'->>'start')::integer)) else 1 end)); end if;
  allowed := case when kind in ('paragraph','heading') then array['text','hardBreak']
    when kind = 'codeBlock' then array['text']
    when kind in ('bulletList','orderedList') then array['listItem']
    else array['paragraph','heading','bulletList','orderedList','blockquote','codeBlock','horizontalRule'] end;
  if jsonb_typeof(_node->'content') = 'array' then
    for child in select value from jsonb_array_elements(_node->'content') limit 1000 loop
      child := public.sanitize_note_node(child,_depth+1);
      if child is not null and child->>'type' = any(allowed) then children := children || jsonb_build_array(child); end if;
    end loop;
  end if;
  if kind in ('bulletList','orderedList') and jsonb_array_length(children)=0 then return null; end if;
  if kind='listItem' and coalesce(children->0->>'type','') <> 'paragraph' then children := '[{"type":"paragraph"}]'::jsonb || children; end if;
  if kind in ('doc','blockquote') and jsonb_array_length(children)=0 then children := '[{"type":"paragraph"}]'; end if;
  if kind not in ('hardBreak','horizontalRule') then clean := clean || jsonb_build_object('content',children); end if;
  return clean;
end $$;

create function public.note_plain_text(_node jsonb) returns text
language plpgsql immutable set search_path = '' as $$
declare result text := ''; child jsonb; separator text; first_child boolean := true;
begin
  if _node->>'type'='text' then return coalesce(_node->>'text',''); end if;
  if _node->>'type'='hardBreak' then return chr(10); end if;
  separator := case when _node->>'type' in ('doc','bulletList','orderedList','listItem','blockquote') then chr(10) else '' end;
  if jsonb_typeof(_node->'content')='array' then
    for child in select value from jsonb_array_elements(_node->'content') loop
      result := result || case when first_child then '' else separator end || public.note_plain_text(child);
      first_child := false;
    end loop;
  end if;
  return result;
end $$;

create function public.synchronize_rich_notes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare field text; clean jsonb; old_document jsonb; supplied jsonb;
begin
  if jsonb_typeof(new.rich_text) <> 'object' or length(new.rich_text::text)>262144 then
    raise exception 'Notes formatting must be an object smaller than 256 KB' using errcode='23514';
  end if;
  for field in select jsonb_object_keys(new.rich_text) loop
    if not field = any(tg_argv) then raise exception 'This field does not support rich notes' using errcode='23514'; end if;
  end loop;
  foreach field in array tg_argv loop
    old_document := case when tg_op='UPDATE' then old.rich_text->field else null end;
    supplied := new.rich_text->field;
    if supplied is distinct from old_document then
      if supplied is null or supplied='null'::jsonb then new.rich_text := new.rich_text-field;
      else
        clean := public.sanitize_note_node(supplied);
        if clean is null or clean->>'type'<>'doc' then raise exception 'Invalid notes document' using errcode='23514'; end if;
        new.rich_text := jsonb_set(new.rich_text,array[field],clean);
        new := jsonb_populate_record(new,jsonb_build_object(field,nullif(public.note_plain_text(clean),'')));
      end if;
    elsif tg_op='UPDATE' and to_jsonb(new)->field is distinct from to_jsonb(old)->field then
      -- A plain-text API edit wins over stale formatting.
      new.rich_text := new.rich_text-field;
    end if;
  end loop;
  return new;
end $$;

do $$ declare item record; arguments text; begin
  for item in
    select c.table_name,array_agg(c.column_name order by c.column_name) as fields
    from information_schema.columns c join information_schema.tables t using(table_catalog,table_schema,table_name)
    where c.table_schema='public' and t.table_type='BASE TABLE' and c.data_type='text'
      and (c.column_name='notes' or c.column_name like '%\_notes' escape '\' or c.column_name='special_instructions')
    group by c.table_name
  loop
    execute format('alter table public.%I add column rich_text jsonb not null default ''{}''',item.table_name);
    select string_agg(quote_literal(value),',') into arguments from unnest(item.fields) as value;
    execute format('create trigger aa_synchronize_rich_notes before insert or update on public.%I for each row execute function public.synchronize_rich_notes(%s)',item.table_name,arguments);
  end loop;
end $$;
-- Keep the existing stale-edit and field-identity guards for commercial rates.
create or replace function public.revise_rate(_id uuid, _expected_updated_at timestamptz, _values jsonb)
returns public.rates language plpgsql set search_path = '' as $$
declare old_rate public.rates; result public.rates; patch public.rates;
begin
  if not public.can_access_table('rates',true) then raise exception 'Rate editing is restricted' using errcode='42501'; end if;
  select * into old_rate from public.rates where id=_id for update;
  if not found or old_rate.updated_at is distinct from _expected_updated_at then raise exception 'This rate changed. Refresh before saving.' using errcode='40001'; end if;
  if exists(select 1 from jsonb_object_keys(_values) k where k not in
    ('amount','unit','currency','rate_type','effective_date','expiration_date','fuel_surcharge','fuel_method','minimum_charge','accessorials','quote_reference','status','source','notes','rich_text','change_reason')) then
    raise exception 'Unsupported rate field' using errcode='22023';
  end if;
  patch := jsonb_populate_record(old_rate,_values);
  update public.rates set amount=patch.amount,unit=patch.unit,currency=patch.currency,rate_type=patch.rate_type,
    effective_date=patch.effective_date,expiration_date=patch.expiration_date,fuel_surcharge=patch.fuel_surcharge,
    fuel_method=patch.fuel_method,minimum_charge=patch.minimum_charge,accessorials=patch.accessorials,
    quote_reference=patch.quote_reference,status=patch.status,source=patch.source,notes=patch.notes,
    rich_text=patch.rich_text,change_reason=patch.change_reason where id=_id returning * into result;
  return result;
end $$;
revoke all on function public.sanitize_note_node(jsonb,integer),public.note_plain_text(jsonb),public.synchronize_rich_notes() from public,anon,authenticated;

-- Chatter shows readable note edits and a compact formatting-only entry.
create or replace function public.track_record_changes() returns trigger
language plpgsql security definer set search_path='' as $$
declare field text; note_field text; previous jsonb := to_jsonb(old);
  current_values jsonb := to_jsonb(new); record_kind text;
begin
  record_kind := case tg_table_name
    when 'customers' then 'customer' when 'sites' then 'site'
    when 'equipment' then 'equipment' when 'incidents' then 'incident'
    when 'drivers' then 'driver' when 'rates' then 'rate'
    when 'bids' then 'bid' when 'opportunities' then 'opportunity'
    when 'contracts' then 'contract' end;
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

commit;

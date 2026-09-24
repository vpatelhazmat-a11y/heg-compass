create table public.mail_messages (
  id uuid primary key default gen_random_uuid(),
  linked_entity_type text not null,
  linked_entity_id uuid not null,
  kind text not null check (kind in ('message', 'note')),
  body text not null check (length(btrim(body)) between 1 and 10000),
  author_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint mail_messages_entity_valid check (linked_entity_type in
    ('customer','site','equipment','incident','driver','rate','bid','opportunity','contract'))
);

do $$
declare kind text; parent text;
begin
  foreach kind in array array['customer','site','equipment','incident','driver','rate','bid','opportunity','contract'] loop
    parent=case kind when 'equipment' then 'equipment' when 'opportunity' then 'opportunities' else kind||'s' end;
    execute format('alter table public.mail_messages add column %I uuid generated always as (case when linked_entity_type=%L then linked_entity_id end) stored references public.%I(id) on delete restrict', 'linked_'||kind||'_fk',kind,parent);
  end loop;
end $$;

create index mail_messages_record_idx on public.mail_messages(linked_entity_type,linked_entity_id,created_at,id);

create function public.attribute_mail_message() returns trigger language plpgsql set search_path='' as $$
begin
  new.author_id=auth.uid();
  new.created_at=now();
  return new;
end $$;
create trigger attribute_mail_message before insert on public.mail_messages
for each row execute function public.attribute_mail_message();

grant select, insert on public.mail_messages to authenticated;
grant all on public.mail_messages to service_role;
alter table public.mail_messages enable row level security;
create policy mail_messages_read on public.mail_messages for select to authenticated
using(public.can_access_link(linked_entity_type,false));
create policy mail_messages_insert on public.mail_messages for insert to authenticated
with check(public.can_access_link(linked_entity_type,true) and author_id=auth.uid());

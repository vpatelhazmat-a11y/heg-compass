begin;

alter table public.documents
  add column file_path text unique,
  add column file_name text,
  add constraint documents_file_pair check ((file_path is null) = (file_name is null)),
  add constraint documents_file_path_scope check (
    file_path is null or file_path like id::text || '/%'
  );

-- The old UPDATE policy checked sensitivity only on the new row. Require
-- permission on both sides so an unauthorized user cannot downgrade a file.
drop policy document_link_update on public.documents;
create policy document_link_update on public.documents as restrictive
  for update to authenticated
  using (
    public.can_access_link(linked_entity_type, true)
    and case classification
      when 'Public Internal' then true
      when 'Operations' then true
      when 'Commercial' then public.can_access_table('rates', true)
      when 'Safety' then public.can_access_table('drivers', true)
      else public.has_role(auth.uid(), 'admin')
    end
  )
  with check (
    public.can_access_link(linked_entity_type, true)
    and case classification
      when 'Public Internal' then true
      when 'Operations' then true
      when 'Commercial' then public.can_access_table('rates', true)
      when 'Safety' then public.can_access_table('drivers', true)
      else public.has_role(auth.uid(), 'admin')
    end
  );

insert into storage.buckets (id, name, public, file_size_limit)
values ('heg-documents', 'heg-documents', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

-- A private object is visible only through its readable document row. The
-- document table's own RLS also checks entity permissions and classification.
create policy heg_document_file_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'heg-documents'
    and exists (
      select 1 from public.documents d
      where d.file_path = name
    )
  );

create policy heg_document_file_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'heg-documents'
    and public.can_access_table('documents', true)
    and exists (
      select 1 from public.documents d
      where d.file_path = name
    )
  );

commit;

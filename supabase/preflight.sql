-- Read-only inspection before applying the stabilization migrations.
-- Run with an administrative role so RLS does not hide conflicts.
begin transaction read only;
select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns where table_schema='public' order by table_name,ordinal_position;
select tablename,policyname,cmd,roles,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname;
select c.relname,con.conname,pg_get_constraintdef(con.oid)
from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' order by c.relname,con.conname;
select r.id as refused_load_id,r.customer_id,r.contact_id,r.equipment_id
from public.refused_loads r
left join public.customers c on c.id=r.customer_id
left join public.contacts ct on ct.id=r.contact_id
left join public.equipment e on e.id=r.equipment_id
where c.id is null or (r.contact_id is not null and (ct.id is null or ct.customer_id is distinct from r.customer_id))
or (r.equipment_id is not null and e.id is null);
select equipment_id,count(*) from public.equipment_assignments where status='Active' and end_date is null group by equipment_id having count(*)>1;
select id,site_name from public.sites where customer_id is null;
select e.id,e.current_customer_id,e.current_site_id,a.customer_id,a.site_id
from public.equipment e join public.equipment_assignments a on a.equipment_id=e.id and a.status='Active' and a.end_date is null
where (e.current_customer_id is not null or e.current_site_id is not null)
and (e.current_customer_id is distinct from a.customer_id or e.current_site_id is distinct from a.site_id);
select id,entity_type,entity_id from public.requirements where entity_id is null or entity_type not in ('customer','site','equipment','incident','driver','rate','bid','opportunity','contract');
rollback;

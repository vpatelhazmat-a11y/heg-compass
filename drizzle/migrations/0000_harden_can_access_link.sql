create or replace function public.can_access_link(_kind text, _write boolean)
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
 select case when _kind is null then true else public.can_access_table(case _kind
 when 'customer' then 'customers' when 'site' then 'sites' when 'equipment' then 'equipment'
 when 'incident' then 'incidents' when 'driver' then 'drivers' when 'rate' then 'rates'
 when 'bid' then 'bids' when 'opportunity' then 'opportunities' when 'contract' then 'contracts'
 else '__denied__' end, _write) end
$function$;

revoke all on function public.can_access_link(text, boolean) from public;
grant execute on function public.can_access_link(text, boolean) to authenticated;

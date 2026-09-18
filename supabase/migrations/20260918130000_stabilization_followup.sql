begin;

-- These hosted commercial links need the same customer consistency as the
-- original Refused Load links. Existing conflicts abort the whole migration.
alter table public.bids add constraint bids_id_customer_key unique(id, customer_id);
alter table public.rates add constraint rates_id_customer_key unique(id, customer_id);
alter table public.refused_loads
  add constraint refused_loads_opportunity_id_customer_fk foreign key(opportunity_id, customer_id) references public.opportunities(id, customer_id),
  add constraint refused_loads_bid_id_customer_fk foreign key(bid_id, customer_id) references public.bids(id, customer_id),
  add constraint refused_loads_rate_id_customer_fk foreign key(rate_id, customer_id) references public.rates(id, customer_id);

create or replace function public.preserve_rate_history() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 new.created_by=old.created_by; new.created_at=old.created_at;
 new.updated_by=auth.uid(); new.updated_at=now();
 if (to_jsonb(new)-array['updated_at','updated_by','change_reason']) is not distinct from
    (to_jsonb(old)-array['updated_at','updated_by','change_reason']) then
   -- A reason is consumed by this statement, even if no terms changed.
   new.change_reason=null;
   return new;
 end if;
 if nullif(btrim(new.change_reason),'') is null or new.effective_date is null then
   raise exception 'Rate changes require an effective date and reason' using errcode='23514';
 end if;
 insert into public.rate_history(rate_id,previous_amount,new_amount,percentage_change,effective_date,reason,previous_record,new_record,changed_by)
 values(old.id,old.amount,new.amount,case when old.amount<>0 then (new.amount-old.amount)/old.amount*100 end,new.effective_date,new.change_reason,to_jsonb(old),to_jsonb(new),auth.uid());
 new.change_reason=null;
 return new;
end $$;

-- Remove any unused reasons left by the previous trigger. Terms and existing
-- history stay intact; the normal audit trigger records this metadata cleanup.
update public.rates set change_reason=null where change_reason is not null;

commit;

DROP VIEW IF EXISTS public.staff_directory;

CREATE TABLE public.staff_directory (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text,
  title text,
  active boolean NOT NULL DEFAULT true
);

GRANT SELECT ON public.staff_directory TO authenticated;
GRANT ALL ON public.staff_directory TO service_role;
ALTER TABLE public.staff_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_directory_read ON public.staff_directory FOR SELECT TO authenticated USING (true);

INSERT INTO public.staff_directory (id, full_name, title, active)
SELECT id, full_name, title, active FROM public.profiles
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_staff_directory()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
begin
  if tg_op = 'DELETE' then
    delete from public.staff_directory where id = old.id;
    return old;
  end if;
  insert into public.staff_directory(id, full_name, title, active)
  values (new.id, new.full_name, new.title, new.active)
  on conflict (id) do update
    set full_name = excluded.full_name, title = excluded.title, active = excluded.active;
  return new;
end $function$;

REVOKE EXECUTE ON FUNCTION public.sync_staff_directory() FROM authenticated, anon, public;

CREATE TRIGGER sync_staff_directory
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_directory();

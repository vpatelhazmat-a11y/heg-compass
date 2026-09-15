-- 1. search_path hardening
CREATE OR REPLACE FUNCTION public.set_refused_load_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
begin new.updated_at = now(); return new; end;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_invitations_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
begin new.updated_at = now(); return new; end;
$function$;

-- 2. Revoke SECURITY DEFINER helpers that are not referenced by any RLS policy or app call
REVOKE EXECUTE ON FUNCTION public.can_view_incidents() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.can_view_safety() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.can_write() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.can_write_safety() FROM authenticated, anon, public;

-- 3. Restrict profile PII
DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.has_any_role(auth.uid(), array['admin','management']::public.app_role[])
);

-- Name-only directory for assignment dropdowns
CREATE OR REPLACE VIEW public.staff_directory
WITH (security_invoker = off) AS
SELECT id, full_name, title, active FROM public.profiles;

GRANT SELECT ON public.staff_directory TO authenticated;

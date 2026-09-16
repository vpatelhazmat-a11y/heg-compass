-- The name-only directory is for approved active staff, not every signup.
drop policy if exists staff_directory_read on public.staff_directory;
create policy staff_directory_read on public.staff_directory for select to authenticated
using (public.has_any_role(auth.uid(), array['admin','sales','operations','safety','management','read_only']::public.app_role[]));


revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.has_any_role(uuid, public.app_role[]) from public, anon;
revoke all on function public.can_write() from public, anon;
revoke all on function public.can_view_safety() from public, anon;
revoke all on function public.can_view_incidents() from public, anon;
revoke all on function public.can_write_safety() from public, anon;

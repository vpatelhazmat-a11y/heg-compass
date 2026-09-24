create table public.user_workspace_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_order_is_array check (jsonb_typeof(app_order) = 'array')
);

create trigger user_workspace_preferences_updated_at
before update on public.user_workspace_preferences
for each row execute function public.update_updated_at_column();

grant select, insert, update, delete on public.user_workspace_preferences to authenticated;
grant all on public.user_workspace_preferences to service_role;
alter table public.user_workspace_preferences enable row level security;

create policy "workspace_preferences_read_self" on public.user_workspace_preferences
for select to authenticated using (user_id = auth.uid());
create policy "workspace_preferences_insert_self" on public.user_workspace_preferences
for insert to authenticated with check (user_id = auth.uid());
create policy "workspace_preferences_update_self" on public.user_workspace_preferences
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workspace_preferences_delete_self" on public.user_workspace_preferences
for delete to authenticated using (user_id = auth.uid());

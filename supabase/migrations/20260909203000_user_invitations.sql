create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  title text,
  role text not null default 'read_only',
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_invitations_email_idx on public.user_invitations(lower(email));
create index if not exists user_invitations_status_idx on public.user_invitations(status);

alter table public.user_invitations enable row level security;

create policy "admins can read invitations"
  on public.user_invitations for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins can create invitations"
  on public.user_invitations for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "admins can update invitations"
  on public.user_invitations for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.set_user_invitations_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_invitations_updated_at on public.user_invitations;
create trigger user_invitations_updated_at
before update on public.user_invitations
for each row execute function public.set_user_invitations_updated_at();

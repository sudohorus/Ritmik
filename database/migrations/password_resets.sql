create table if not exists public.password_resets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.password_resets enable row level security;

create policy "Service role can do everything on password_resets"
  on public.password_resets
  for all
  using ( auth.role() = 'service_role' );

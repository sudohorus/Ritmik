create table if not exists public.avatar_decorations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text not null,
  type text not null default 'static', -- 'static', 'animated'
  is_free boolean default false,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.user_decorations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  decoration_id uuid references public.avatar_decorations(id) on delete cascade not null,
  acquired_at timestamp with time zone default now() not null,
  unique(user_id, decoration_id)
);

alter table public.profile_customization 
add column if not exists avatar_decoration_id uuid references public.avatar_decorations(id) on delete set null;

alter table public.avatar_decorations enable row level security;

create policy "Avatar decorations are viewable by everyone"
  on public.avatar_decorations for select
  using (true);

alter table public.user_decorations enable row level security;

create policy "Users can view their own decorations"
  on public.user_decorations for select
  using (auth.uid() = user_id);

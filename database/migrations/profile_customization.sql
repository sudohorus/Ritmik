create table if not exists public.profile_customization (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  
  background_mode text not null default 'banner' check (background_mode in ('banner', 'full-bg')),
  background_blur integer not null default 0 check (background_blur >= 0 and background_blur <= 20),
  background_brightness integer not null default 100 check (background_brightness >= 0 and background_brightness <= 200),
  
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists idx_profile_customization_user_id on public.profile_customization(user_id);

create trigger update_profile_customization_updated_at
before update on public.profile_customization
for each row
execute function public.update_updated_at_column();

alter table public.profile_customization enable row level security;

create policy "Profile customizations are viewable by everyone."
on public.profile_customization
for select
using (true);

create policy "Users can insert their own customization."
on public.profile_customization
for insert
with check (auth.uid() = user_id);

create policy "Users can update own customization."
on public.profile_customization
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own customization."
on public.profile_customization
for delete
using (auth.uid() = user_id);

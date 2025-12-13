-- Create a table for public profiles
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Auto-update updated_at column
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on public.users
for each row
execute function public.update_updated_at_column();

-- Enable Row Level Security
alter table public.users enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
on public.users
for select
using (true);

create policy "Users can insert their own profile."
on public.users
for insert
with check (auth.uid() = id);

create policy "Users can update own profile."
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS banner_url TEXT;
-- Create a table for public profiles
create table users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Set up Row Level Security (RLS)
alter table users enable row level security;

create policy "Public profiles are viewable by everyone." on users for select using (true);

create policy "Users can insert their own profile." on users for insert with check (auth.uid() = id);

create policy "Users can update own profile." on users for update using (auth.uid() = id);

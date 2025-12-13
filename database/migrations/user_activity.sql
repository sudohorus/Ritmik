-- Create user_activity table
create table if not exists public.user_activity (
  user_id uuid references public.users(id) on delete cascade primary key,
  current_track jsonb,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.user_activity enable row level security;

-- Policies
-- Activity is viewable ONLY if the user has enabled 'show_activity' in settings.
create policy "User activity is viewable based on settings."
  on public.user_activity for select
  using (
    user_id = auth.uid() -- Always view own activity
    OR
    exists (
      select 1 from public.user_settings
      where user_id = public.user_activity.user_id
      and show_activity = true
    )
  );

create policy "Users can update their own activity."
  on public.user_activity for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own activity (update)."
  on public.user_activity for update
  using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.user_activity;

drop policy if exists "User activity is viewable based on settings." on public.user_activity;

create policy "User activity is viewable based on settings and following."
  on public.user_activity for select
  using (
    user_id = auth.uid() 
    OR
    (
      exists (
        select 1 from public.user_settings
        where user_id = public.user_activity.user_id
        and show_activity = true
      )
      AND
      exists (
        select 1 from public.followers
        where follower_id = public.user_activity.user_id
        and following_id = auth.uid()
      )
    )
  );

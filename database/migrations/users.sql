create table public.user_statistics (
  user_id uuid not null,
  total_plays integer null default 0,
  total_listen_time integer null default 0,
  completed_plays integer null default 0,
  playlists_created integer null default 0,
  playlists_followed integer null default 0,
  tracks_favorited integer null default 0,
  followers_count integer null default 0,
  following_count integer null default 0,
  last_played_at timestamp with time zone null,
  stats_updated_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint user_statistics_pkey primary key (user_id),
  constraint user_statistics_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.users (
  id uuid not null,
  username character varying(50) null,
  display_name character varying(100) null,
  avatar_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  email text null,
  banner_url text null,
  has_completed_onboarding boolean null default false,
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_timestamp BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();
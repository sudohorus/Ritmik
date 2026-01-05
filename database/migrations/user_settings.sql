create table public.user_settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  followers_public boolean not null default true,
  following_public boolean not null default true,
  show_activity boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  allow_statistics_tracking boolean not null default false,
  ambient_background boolean not null default false,
  constraint user_settings_pkey primary key (id),
  constraint user_settings_user_id_key unique (user_id),
  constraint user_settings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_settings_user_id on public.user_settings using btree (user_id) TABLESPACE pg_default;

create trigger update_user_settings_updated_at BEFORE
update on user_settings for EACH row
execute FUNCTION update_updated_at_column ();
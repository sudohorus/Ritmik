create table public.playlists (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name character varying(200) not null,
  description text null,
  cover_image_url text null,
  is_public boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  banner_image_url text null,
  banner_crop jsonb null,
  cover_crop jsonb null,
  constraint playlists_pkey primary key (id),
  constraint playlists_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_playlists_user_id on public.playlists using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_playlists_created_at on public.playlists using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_update_playlists_updated_at BEFORE
update on playlists for EACH row
execute FUNCTION update_updated_at_column ();

create trigger trigger_update_playlist_count
after INSERT
or DELETE on playlists for EACH row
execute FUNCTION update_playlist_count ();

create trigger update_playlists_updated_at BEFORE
update on playlists for EACH row
execute FUNCTION update_updated_at_column ();
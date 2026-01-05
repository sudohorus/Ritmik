create table public.play_history (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  video_id text not null,
  title text not null,
  artist text null,
  thumbnail_url text null,
  duration integer null,
  playlist_id uuid null,
  played_at timestamp with time zone null default now(),
  listen_duration integer null,
  completed boolean null default false,
  constraint play_history_pkey primary key (id),
  constraint play_history_playlist_id_fkey foreign KEY (playlist_id) references playlists (id) on delete set null,
  constraint play_history_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint valid_listen_duration check (
    (
      (listen_duration is null)
      or (listen_duration <= duration)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_play_history_user on public.play_history using btree (user_id, played_at desc) TABLESPACE pg_default;

create index IF not exists idx_play_history_video on public.play_history using btree (video_id) TABLESPACE pg_default;

create index IF not exists idx_play_history_playlist on public.play_history using btree (playlist_id) TABLESPACE pg_default;

create trigger trigger_update_track_stats
after INSERT on play_history for EACH row
execute FUNCTION update_track_statistics ();

create trigger trigger_update_user_stats
after INSERT on play_history for EACH row
execute FUNCTION update_user_statistics ();

create table public.playlist_tracks (
  id uuid not null default gen_random_uuid (),
  playlist_id uuid not null,
  video_id character varying(20) not null,
  title character varying(300) not null,
  artist character varying(200) null,
  thumbnail_url text null,
  duration integer null,
  position integer not null,
  added_at timestamp with time zone null default now(),
  constraint playlist_tracks_pkey primary key (id),
  constraint playlist_tracks_unique_track unique (playlist_id, video_id),
  constraint playlist_tracks_playlist_id_fkey foreign KEY (playlist_id) references playlists (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_playlist_tracks_playlist_id on public.playlist_tracks using btree (playlist_id) TABLESPACE pg_default;

create index IF not exists idx_playlist_tracks_position on public.playlist_tracks using btree (playlist_id, "position") TABLESPACE pg_default;
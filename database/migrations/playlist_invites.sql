create table public.playlist_invites (
  id uuid not null default gen_random_uuid (),
  playlist_id uuid not null,
  token text not null,
  created_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null,
  max_uses integer null default 1,
  used_count integer null default 0,
  created_by uuid not null,
  constraint playlist_invites_pkey primary key (id),
  constraint playlist_invites_token_key unique (token),
  constraint playlist_invites_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE,
  constraint playlist_invites_playlist_id_fkey foreign KEY (playlist_id) references playlists (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_playlist_invites_playlist_id on public.playlist_invites using btree (playlist_id) TABLESPACE pg_default;

create index IF not exists idx_playlist_invites_token on public.playlist_invites using btree (token) TABLESPACE pg_default;
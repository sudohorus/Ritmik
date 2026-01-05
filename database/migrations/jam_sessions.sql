create table public.jam_sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  host_user_id uuid not null,
  name character varying(255) not null,
  code character varying(8) not null,
  is_active boolean null default true,
  current_track_id character varying(255) null,
  current_position double precision null default 0,
  is_playing boolean null default false,
  queue jsonb null default '[]'::jsonb,
  max_participants integer null default 10,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  ended_at timestamp without time zone null,
  constraint jam_sessions_pkey primary key (id),
  constraint jam_sessions_code_key unique (code),
  constraint jam_sessions_host_user_id_fkey foreign KEY (host_user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_jam_sessions_code on public.jam_sessions using btree (code) TABLESPACE pg_default;

create index IF not exists idx_jam_sessions_host on public.jam_sessions using btree (host_user_id) TABLESPACE pg_default;

create index IF not exists idx_jam_sessions_active on public.jam_sessions using btree (is_active) TABLESPACE pg_default;


create table public.jam_participants (
  id uuid not null default extensions.uuid_generate_v4 (),
  jam_session_id uuid not null,
  user_id uuid not null,
  joined_at timestamp without time zone null default now(),
  left_at timestamp without time zone null,
  is_active boolean null default true,
  last_seen timestamp without time zone null default now(),
  constraint jam_participants_pkey primary key (id),
  constraint jam_participants_jam_session_id_user_id_key unique (jam_session_id, user_id),
  constraint jam_participants_jam_session_id_fkey foreign KEY (jam_session_id) references jam_sessions (id) on delete CASCADE,
  constraint jam_participants_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_jam_participants_session on public.jam_participants using btree (jam_session_id) TABLESPACE pg_default;

create index IF not exists idx_jam_participants_user on public.jam_participants using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_jam_participants_active on public.jam_participants using btree (jam_session_id, is_active) TABLESPACE pg_default;

create index IF not exists idx_jam_participants_last_seen on public.jam_participants using btree (last_seen) TABLESPACE pg_default
where
  (is_active = true);
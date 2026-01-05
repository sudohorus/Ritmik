create table public.user_decorations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  decoration_id uuid not null,
  acquired_at timestamp with time zone not null default now(),
  constraint user_decorations_pkey primary key (id),
  constraint user_decorations_user_id_decoration_id_key unique (user_id, decoration_id),
  constraint user_decorations_decoration_id_fkey foreign KEY (decoration_id) references avatar_decorations (id) on delete CASCADE,
  constraint user_decorations_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.password_resets (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  token text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  constraint password_resets_pkey primary key (id),
  constraint password_resets_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
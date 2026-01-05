create table public.profile_customization (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  background_mode text not null default 'banner'::text,
  background_blur integer not null default 0,
  background_brightness integer not null default 100,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  avatar_decoration_id uuid null,
  favorite_music jsonb null,
  avatar_crop jsonb null,
  banner_crop jsonb null,
  constraint profile_customization_pkey primary key (id),
  constraint profile_customization_user_id_key unique (user_id),
  constraint profile_customization_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint profile_customization_avatar_decoration_id_fkey foreign KEY (avatar_decoration_id) references avatar_decorations (id) on delete set null,
  constraint profile_customization_background_mode_check check (
    (
      background_mode = any (array['banner'::text, 'full-bg'::text])
    )
  ),
  constraint profile_customization_background_blur_check check (
    (
      (background_blur >= 0)
      and (background_blur <= 20)
    )
  ),
  constraint profile_customization_background_brightness_check check (
    (
      (background_brightness >= 0)
      and (background_brightness <= 200)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_profile_customization_user_id on public.profile_customization using btree (user_id) TABLESPACE pg_default;

create trigger update_profile_customization_updated_at BEFORE
update on profile_customization for EACH row
execute FUNCTION update_updated_at_column ();
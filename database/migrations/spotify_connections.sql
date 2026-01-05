create table public.rate_limit_attempts (
  id uuid not null default gen_random_uuid (),
  ip_address text not null,
  action_type text not null,
  attempt_count integer not null default 1,
  blocked_until timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint rate_limit_attempts_pkey primary key (id),
  constraint rate_limit_attempts_ip_address_action_type_key unique (ip_address, action_type),
  constraint rate_limit_attempts_action_type_check check (
    (
      action_type = any (array['login'::text, 'signup'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_rate_limit_ip_action on public.rate_limit_attempts using btree (ip_address, action_type) TABLESPACE pg_default;

create index IF not exists idx_rate_limit_blocked on public.rate_limit_attempts using btree (blocked_until) TABLESPACE pg_default
where
  (blocked_until is not null);

create trigger update_rate_limit_attempts_timestamp BEFORE
update on rate_limit_attempts for EACH row
execute FUNCTION update_rate_limit_timestamp ();
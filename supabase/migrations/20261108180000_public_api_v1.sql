-- Public REST API v1: API keys and durable render records.
-- Keys are hashed at rest. Plaintext is shown once at creation.
-- Service role only — no anon/authenticated policies.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Default',
  key_prefix text not null,
  key_hash text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint api_keys_key_hash_key unique (key_hash)
);

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create index if not exists api_keys_prefix_idx on public.api_keys (key_prefix);

alter table public.api_keys enable row level security;
revoke all on table public.api_keys from public, anon, authenticated;
grant all on table public.api_keys to service_role;

create table if not exists public.api_renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  api_key_id uuid references public.api_keys (id) on delete set null,
  space_type text not null,
  status text not null,
  prompt text,
  instruction text,
  options jsonb not null default '{}'::jsonb,
  source_image_url text,
  result_image_url text,
  result_storage_path text,
  error_message text,
  credits_charged numeric(10, 2),
  idempotency_key text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint api_renders_space_type_check check (space_type in ('landscape', 'exterior', 'interior')),
  constraint api_renders_status_check check (status in ('queued', 'running', 'completed', 'failed'))
);

create unique index if not exists api_renders_user_idempotency_key
  on public.api_renders (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists api_renders_user_created_idx
  on public.api_renders (user_id, created_at desc);

create index if not exists api_renders_api_key_id_idx on public.api_renders (api_key_id);

alter table public.api_renders enable row level security;
revoke all on table public.api_renders from public, anon, authenticated;
grant all on table public.api_renders to service_role;

notify pgrst, 'reload schema';

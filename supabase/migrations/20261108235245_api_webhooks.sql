-- Public API v1 completion webhooks.
-- Signing secrets are encrypted at rest (app layer). Service role only — no anon/authenticated policies.

create table if not exists public.api_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  secret_encrypted text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint api_webhooks_url_https check (url ~* '^https://')
);

create index if not exists api_webhooks_user_id_idx on public.api_webhooks (user_id);
create index if not exists api_webhooks_user_active_idx
  on public.api_webhooks (user_id)
  where active = true;

alter table public.api_webhooks enable row level security;
revoke all on table public.api_webhooks from public, anon, authenticated;
grant all on table public.api_webhooks to service_role;

notify pgrst, 'reload schema';

-- Demo carry-over: successful demo renders are recorded against the browser demo
-- cookie, then claimed into a "Demo renders" project after signup.
-- Service role only (API routes). Matches the live production table shape.

create table if not exists public.guest_render_claims (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  demo_cookie_id text not null,
  studio_type text not null,
  image_url text not null,
  source_image_url text,
  preset_id text,
  settings jsonb not null default '{}'::jsonb,
  project_id uuid references public.projects (id) on delete set null,
  render_id uuid references public.project_renders (id) on delete set null,
  claimed_by uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_guest_render_claims_cookie
  on public.guest_render_claims (demo_cookie_id);

alter table public.guest_render_claims enable row level security;

revoke all on table public.guest_render_claims from public, anon, authenticated;
grant all on table public.guest_render_claims to service_role;

notify pgrst, 'reload schema';

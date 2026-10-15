-- Daily content render bot (marketing images).
-- Service-role only: RLS on, no policies, no grants to anon/authenticated.
-- Sources are KeSean's own photos or free-license stock photos. Never customer uploads.

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('own', 'stock')),
  scene text not null default 'backyard'
    check (scene in ('backyard', 'front_yard', 'patio', 'pool', 'house_exterior', 'interior', 'commercial', 'other')),
  storage_path text,
  public_url text,
  source_url text,
  license text,
  credit text,
  notes text,
  status text not null default 'ready' check (status in ('pending_ingest', 'ready', 'rejected')),
  times_used integer not null default 0,
  last_used_at timestamptz,
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);

create unique index if not exists content_sources_source_url_key
  on public.content_sources (source_url) where source_url is not null;

create table if not exists public.content_render_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_date date not null default ((now() at time zone 'America/Chicago')::date),
  concept_key text,
  render_type text not null default 'landscape' check (render_type in ('landscape', 'exterior', 'interior')),
  source_id uuid references public.content_sources (id) on delete set null,
  prompt text not null,
  title text,
  alt_text text,
  caption text,
  slug text,
  region text,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed', 'skipped')),
  priority integer not null default 0,
  attempts integer not null default 0,
  result_url text,
  storage_path text,
  error text,
  created_by text not null default 'auto',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists content_render_jobs_queue_idx
  on public.content_render_jobs (status, batch_date, priority desc, created_at);
create index if not exists content_render_jobs_batch_idx
  on public.content_render_jobs (batch_date);

-- Singleton row the editor bot updates from performance learnings.
create table if not exists public.content_render_guidance (
  id integer primary key default 1 check (id = 1),
  boost_keys text[] not null default '{}',
  avoid_keys text[] not null default '{}',
  photo_share real check (photo_share is null or (photo_share >= 0 and photo_share <= 1)),
  notes text,
  updated_at timestamptz not null default now()
);
insert into public.content_render_guidance (id) values (1) on conflict (id) do nothing;

alter table public.content_sources enable row level security;
alter table public.content_render_jobs enable row level security;
alter table public.content_render_guidance enable row level security;

revoke all on public.content_sources, public.content_render_jobs, public.content_render_guidance from anon, authenticated;
grant all on public.content_sources, public.content_render_jobs, public.content_render_guidance to service_role;

-- Public-read bucket for source photos (the image model fetches them by URL).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-sources', 'content-sources', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

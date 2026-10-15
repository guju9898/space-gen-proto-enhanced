-- Gallery publishing for content renders: AI quality check, SEO text, approval.
alter table public.content_render_jobs
  add column if not exists qc_score integer check (qc_score is null or (qc_score between 1 and 10)),
  add column if not exists qc_notes text,
  add column if not exists description text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists described_at timestamptz,
  add column if not exists published boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists public_slug text;

create unique index if not exists content_render_jobs_public_slug_key
  on public.content_render_jobs (public_slug) where public_slug is not null;
create index if not exists content_render_jobs_published_idx
  on public.content_render_jobs (published, published_at desc);

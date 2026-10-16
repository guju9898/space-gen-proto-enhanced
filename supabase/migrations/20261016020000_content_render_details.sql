-- Render prompts with Studio-style custom details (materials, focal objects,
-- planting, lighting), compare pairs, and editor steering of those details.
alter table public.content_render_jobs
  add column if not exists details jsonb not null default '[]'::jsonb,
  add column if not exists compare_group text;

create index if not exists content_render_jobs_compare_group_idx
  on public.content_render_jobs (compare_group) where compare_group is not null;

alter table public.content_render_guidance
  add column if not exists prefer_details text[] not null default '{}',
  add column if not exists avoid_details text[] not null default '{}',
  add column if not exists extra_details jsonb not null default '[]'::jsonb,
  add column if not exists compare_pairs integer not null default 2;

alter table public.content_render_guidance
  drop constraint if exists content_render_guidance_compare_pairs_check;
alter table public.content_render_guidance
  add constraint content_render_guidance_compare_pairs_check check (compare_pairs between 0 and 4);

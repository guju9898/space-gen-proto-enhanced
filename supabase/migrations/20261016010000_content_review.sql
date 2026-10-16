-- Approve / reject flow for content renders and stock photos.
alter table public.content_render_jobs
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected'));
update public.content_render_jobs set review_status = 'approved' where published = true;

-- Stock photos land in 'review' after download and are only used once approved ('ready').
alter table public.content_sources drop constraint if exists content_sources_status_check;
alter table public.content_sources
  add constraint content_sources_status_check
  check (status in ('pending_ingest', 'review', 'ready', 'rejected'));

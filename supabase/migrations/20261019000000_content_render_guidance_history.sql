-- Append-only render guidance. The editor bot INSERTs a full row each time it
-- changes guidance (UPDATEs need a human confirmation through the Supabase
-- connector, which an unattended run can't give). The render bot reads the
-- newest of: the latest history row, or content_render_guidance (id = 1) when
-- that was edited more recently by hand.
create table if not exists public.content_render_guidance_history (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  created_by text not null default 'editor',
  boost_keys text[] not null default '{}',
  avoid_keys text[] not null default '{}',
  photo_share double precision check (photo_share is null or (photo_share >= 0 and photo_share <= 1)),
  prefer_details text[] not null default '{}',
  avoid_details text[] not null default '{}',
  extra_details jsonb not null default '[]'::jsonb check (jsonb_typeof(extra_details) = 'array'),
  compare_pairs integer not null default 2 check (compare_pairs between 0 and 4),
  notes text
);

create index if not exists content_render_guidance_history_created_idx
  on public.content_render_guidance_history (created_at desc);

alter table public.content_render_guidance_history enable row level security;
revoke all on public.content_render_guidance_history from anon, authenticated;
grant all on public.content_render_guidance_history to service_role;
grant usage, select on sequence public.content_render_guidance_history_id_seq to service_role;

-- Seed with the current guidance so history starts from today's state.
insert into public.content_render_guidance_history
  (created_at, created_by, boost_keys, avoid_keys, photo_share, prefer_details, avoid_details, extra_details, compare_pairs, notes)
select updated_at, 'seed', boost_keys, avoid_keys, photo_share, prefer_details, avoid_details, extra_details, compare_pairs, notes
from public.content_render_guidance
where id = 1
  and not exists (select 1 from public.content_render_guidance_history);

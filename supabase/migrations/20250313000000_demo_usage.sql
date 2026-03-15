-- Demo usage tracking for contractor demo (no-account renders).
-- Limits: 5 renders per email, per IP, and per cookie.

create table if not exists demo_usage (
  id uuid primary key default gen_random_uuid(),
  email text,
  ip_address text,
  cookie_id text,
  renders_used integer not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes for limit checks
create index if not exists idx_demo_usage_email on demo_usage (email) where email is not null;
create index if not exists idx_demo_usage_ip on demo_usage (ip_address) where ip_address is not null;
create index if not exists idx_demo_usage_cookie on demo_usage (cookie_id) where cookie_id is not null;

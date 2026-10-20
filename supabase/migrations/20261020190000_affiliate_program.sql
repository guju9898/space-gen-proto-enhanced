-- Affiliate and referral foundation.
-- Writes stay on the service role. Affiliates can read only their own rows.
-- Program status defaults to draft. Commissions also require AFFILIATES_ENABLED=true.

create table if not exists public.affiliate_program_config (
  id text primary key default 'default' check (id = 'default'),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  max_commission_bps integer not null default 2500 check (max_commission_bps between 0 and 2500),
  attribution_window_days integer not null default 30 check (attribution_window_days between 1 and 90),
  commission_window_days integer not null default 365 check (commission_window_days between 1 and 365),
  hold_days integer not null default 30 check (hold_days between 0 and 90),
  customer_discount_percent integer not null default 0 check (customer_discount_percent between 0 and 25),
  updated_at timestamptz not null default now()
);

insert into public.affiliate_program_config (id)
values ('default')
on conflict (id) do nothing;

create table if not exists public.affiliate_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  display_name text not null check (char_length(display_name) between 2 and 80),
  partner_type text not null check (partner_type in ('landscaping', 'pool', 'educator', 'creator', 'consultant', 'other')),
  website text check (website is null or char_length(website) <= 200),
  note text check (note is null or char_length(note) <= 500),
  code text,
  commission_bps integer check (commission_bps is null or commission_bps between 0 and 2500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_accounts_code_format check (code is null or code ~ '^[A-Z0-9]{4,16}$'),
  constraint affiliate_accounts_approved_ready check (
    status <> 'approved' or (code is not null and commission_bps is not null)
  )
);

create unique index if not exists affiliate_accounts_code_key
  on public.affiliate_accounts (code) where code is not null;

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts (id) on delete cascade,
  visitor_id uuid not null,
  landing_path text check (landing_path is null or char_length(landing_path) <= 120),
  created_at timestamptz not null default now(),
  unique (affiliate_id, visitor_id)
);

create index if not exists affiliate_clicks_affiliate_idx
  on public.affiliate_clicks (affiliate_id, created_at desc);

create table if not exists public.affiliate_attributions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts (id) on delete restrict,
  referred_user_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null,
  attributed_at timestamptz not null default now(),
  commission_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_attributions_affiliate_idx
  on public.affiliate_attributions (affiliate_id, attributed_at desc);

create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts (id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'requested' check (status in ('requested', 'approved', 'paid', 'rejected')),
  external_reference text,
  admin_note text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_payouts_affiliate_idx
  on public.affiliate_payouts (affiliate_id, status, requested_at desc);

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_accounts (id) on delete restrict,
  attribution_id uuid not null references public.affiliate_attributions (id) on delete restrict,
  referred_user_id uuid not null,
  stripe_event_id text not null unique,
  stripe_invoice_id text,
  stripe_charge_id text,
  kind text not null check (kind in ('earn', 'reversal')),
  status text not null check (status in ('pending', 'approved', 'paid', 'reversed', 'void')),
  basis_cents integer not null check (basis_cents >= 0),
  commission_bps integer not null check (commission_bps between 0 and 2500),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  available_at timestamptz,
  reversal_of uuid references public.affiliate_commissions (id),
  payout_id uuid references public.affiliate_payouts (id),
  reason text,
  created_at timestamptz not null default now()
);

create unique index if not exists affiliate_commissions_one_earn_per_invoice
  on public.affiliate_commissions (stripe_invoice_id)
  where kind = 'earn' and stripe_invoice_id is not null;

create index if not exists affiliate_commissions_affiliate_idx
  on public.affiliate_commissions (affiliate_id, status, created_at desc);

create index if not exists affiliate_commissions_invoice_idx
  on public.affiliate_commissions (stripe_invoice_id);

alter table public.affiliate_program_config enable row level security;
alter table public.affiliate_accounts enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_attributions enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_payouts enable row level security;

revoke all on public.affiliate_program_config from anon, authenticated;
revoke all on public.affiliate_accounts from anon, authenticated;
revoke all on public.affiliate_clicks from anon, authenticated;
revoke all on public.affiliate_attributions from anon, authenticated;
revoke all on public.affiliate_commissions from anon, authenticated;
revoke all on public.affiliate_payouts from anon, authenticated;

grant select on public.affiliate_accounts to authenticated;
grant select on public.affiliate_clicks to authenticated;
grant select on public.affiliate_attributions to authenticated;
grant select on public.affiliate_commissions to authenticated;
grant select on public.affiliate_payouts to authenticated;

grant all on public.affiliate_program_config to service_role;
grant all on public.affiliate_accounts to service_role;
grant all on public.affiliate_clicks to service_role;
grant all on public.affiliate_attributions to service_role;
grant all on public.affiliate_commissions to service_role;
grant all on public.affiliate_payouts to service_role;

create policy affiliate_accounts_select_own
  on public.affiliate_accounts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy affiliate_clicks_select_own
  on public.affiliate_clicks
  for select
  to authenticated
  using (
    affiliate_id in (
      select id from public.affiliate_accounts where user_id = (select auth.uid())
    )
  );

create policy affiliate_attributions_select_own
  on public.affiliate_attributions
  for select
  to authenticated
  using (
    affiliate_id in (
      select id from public.affiliate_accounts where user_id = (select auth.uid())
    )
  );

create policy affiliate_commissions_select_own
  on public.affiliate_commissions
  for select
  to authenticated
  using (
    affiliate_id in (
      select id from public.affiliate_accounts where user_id = (select auth.uid())
    )
  );

create policy affiliate_payouts_select_own
  on public.affiliate_payouts
  for select
  to authenticated
  using (
    affiliate_id in (
      select id from public.affiliate_accounts where user_id = (select auth.uid())
    )
  );

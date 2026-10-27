-- Credit bookkeeping log. Service role only. Does not modify existing user_usage rows.

create table if not exists public.credit_errors (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  plan_id text,
  render_id text,
  amount numeric,
  stage text,
  message text
);

alter table public.credit_errors enable row level security;

revoke all on table public.credit_errors from public, anon, authenticated;
grant all on table public.credit_errors to service_role;
grant usage, select on sequence public.credit_errors_id_seq to service_role;

insert into public.plans (id, monthly_credits)
values ('intro', 40)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_usage'
      and column_name = 'credits_used'
      and data_type = 'integer'
  ) then
    alter table public.user_usage
      alter column credits_used type numeric(10,2)
      using credits_used::numeric;
  end if;
end $$;

-- Production user_render_events was created before this repo's migration:
-- render_id uuid, credits_used numeric, and no period_start, cost, or unique (user_id, render_id).
-- Inserts of period_start/cost were rejected, the error was swallowed, and no rows were stored.
alter table public.user_render_events add column if not exists period_start timestamptz;
alter table public.user_render_events add column if not exists cost numeric(10,2);

create unique index if not exists user_render_events_user_render_unique
  on public.user_render_events (user_id, render_id);

notify pgrst, 'reload schema';

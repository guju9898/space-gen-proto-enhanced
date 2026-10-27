-- Intro credit grants failed because user_usage.plan_id is NOT NULL and
-- references plans(id), while plans had no intro row and the webhook omitted plan_id.
-- period_start is a date, so the old (user_id, period_start) key collides when an
-- intro week and a professional month start on the same calendar day.

insert into public.plans (id, monthly_credits)
values ('intro', 40)
on conflict (id) do nothing;

alter table public.user_usage
  alter column credits_used type numeric(10,2)
  using credits_used::numeric;

update public.user_usage
set plan_code = plan_id
where plan_code is null;

alter table public.user_usage
  alter column plan_code set not null;

do $$
begin
  if (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.user_usage'::regclass
      and contype = 'p'
  ) not like '%plan_code%' then
    alter table public.user_usage drop constraint user_usage_pkey;
    alter table public.user_usage
      add constraint user_usage_pkey primary key (user_id, period_start, plan_code);
  end if;
end $$;

-- Safety net if a writer sends plan_code and forgets plan_id. Code still sets both.
create or replace function public.user_usage_fill_plan_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.plan_id is null then
    new.plan_id := new.plan_code;
  end if;
  if new.plan_code is null then
    new.plan_code := new.plan_id;
  end if;
  return new;
end;
$$;

drop trigger if exists user_usage_fill_plan_id on public.user_usage;
create trigger user_usage_fill_plan_id
  before insert on public.user_usage
  for each row
  execute function public.user_usage_fill_plan_id();

revoke execute on function public.user_usage_fill_plan_id() from public, anon, authenticated;
grant execute on function public.user_usage_fill_plan_id() to service_role;

-- Atomic spend. Intro rows already exist; professional rows are created on first use.
-- A parallel pair cannot both pass credits_used + amount <= credits_allocated.
create or replace function public.consume_user_credits(
  p_user_id uuid,
  p_period_start date,
  p_plan_code text,
  p_amount numeric,
  p_credits_allocated numeric default null,
  p_uncapped boolean default false
)
returns setof public.user_usage
language plpgsql
set search_path = public
as $$
declare
  updated_row public.user_usage%rowtype;
begin
  if p_amount is null or p_amount <= 0 or p_plan_code is null or p_period_start is null then
    return;
  end if;

  if p_uncapped then
    update public.user_usage
    set credits_used = credits_used + p_amount,
        updated_at = now()
    where user_id = p_user_id
      and period_start = p_period_start
      and plan_code = p_plan_code
      and (period_end is null or period_end > now())
    returning * into updated_row;
  else
    update public.user_usage
    set credits_used = credits_used + p_amount,
        updated_at = now()
    where user_id = p_user_id
      and period_start = p_period_start
      and plan_code = p_plan_code
      and (period_end is null or period_end > now())
      and (credits_used + p_amount) <= credits_allocated
    returning * into updated_row;
  end if;

  if found then
    return next updated_row;
    return;
  end if;

  if exists (
    select 1
    from public.user_usage
    where user_id = p_user_id
      and period_start = p_period_start
      and plan_code = p_plan_code
  ) then
    return;
  end if;

  if not p_uncapped and (p_credits_allocated is null or p_amount > p_credits_allocated) then
    return;
  end if;

  insert into public.user_usage (
    user_id, plan_id, plan_code, period_start, credits_used, credits_allocated, updated_at
  ) values (
    p_user_id, p_plan_code, p_plan_code, p_period_start, p_amount, p_credits_allocated, now()
  )
  on conflict (user_id, period_start, plan_code) do update
    set credits_used = public.user_usage.credits_used + excluded.credits_used,
        updated_at = now()
    where p_uncapped
      or public.user_usage.credits_used + excluded.credits_used <= public.user_usage.credits_allocated
  returning * into updated_row;

  if found then
    return next updated_row;
  end if;
end;
$$;

revoke execute on function public.consume_user_credits(uuid, date, text, numeric, numeric, boolean) from public, anon, authenticated;
grant execute on function public.consume_user_credits(uuid, date, text, numeric, numeric, boolean) to service_role;

comment on function public.consume_user_credits(uuid, date, text, numeric, numeric, boolean) is
  'Atomically add a render cost to user_usage when the period is live and the new total fits credits_allocated.';

-- The live subscriptions table predates stripe_customer_id / stripe_subscription_id /
-- intro_offer_used. CREATE TABLE IF NOT EXISTS did not add them, so the webhook upsert
-- failed in PostgREST and the error was ignored.
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists intro_offer_used boolean not null default false;

create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions (stripe_subscription_id);

create index if not exists idx_subscriptions_stripe_customer_id
  on public.subscriptions (stripe_customer_id);

notify pgrst, 'reload schema';

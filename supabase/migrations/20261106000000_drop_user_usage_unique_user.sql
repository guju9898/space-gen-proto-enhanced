-- Live user_usage still had a UNIQUE index on (user_id) alone from an older schema.
-- The real key since 20261027180000_fix_user_usage is (user_id, period_start, plan_code).
-- consume_user_credits inserts a new month/week row and hit user_usage_unique_user.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_usage'::regclass
      and conname = 'user_usage_unique_user'
  ) then
    alter table public.user_usage drop constraint user_usage_unique_user;
  end if;
end $$;

drop index if exists public.user_usage_unique_user;

notify pgrst, 'reload schema';

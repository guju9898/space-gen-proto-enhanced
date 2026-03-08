-- Atomic demo credit consumption to prevent race conditions.
-- Single UPDATE with condition credits_used + amount <= credits_allocated; returns updated row or nothing.

CREATE OR REPLACE FUNCTION public.consume_demo_credits(p_user_id uuid, p_amount numeric)
RETURNS SETOF public.demo_access
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.demo_access
  SET credits_used = credits_used + p_amount
  WHERE user_id = p_user_id
    AND status = 'active'
    AND starts_at <= now()
    AND expires_at > now()
    AND (credits_used + p_amount) <= credits_allocated
  RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.consume_demo_credits(uuid, numeric) IS
  'Atomically consume demo credits; returns updated row or empty if would exceed credits_allocated.';

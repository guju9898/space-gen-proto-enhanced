-- Intro subscription: subscriptions table, intro_offer_claims, user_usage extensions
-- Idempotent where possible.

-- 1) subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_schedule_id text,
  plan_code text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  intro_offer_used boolean NOT NULL DEFAULT false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  rollover_to_plan text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 2) intro_offer_claims table (one row per user who claimed intro)
CREATE TABLE IF NOT EXISTS public.intro_offer_claims (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  claimed_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.intro_offer_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own intro claim"
  ON public.intro_offer_claims FOR SELECT
  USING (auth.uid() = user_id);

-- 3) user_usage: add plan_code, credits_allocated, period_end (nullable for backward compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_usage' AND column_name = 'plan_code'
  ) THEN
    ALTER TABLE public.user_usage ADD COLUMN plan_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_usage' AND column_name = 'credits_allocated'
  ) THEN
    ALTER TABLE public.user_usage ADD COLUMN credits_allocated numeric(10, 2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_usage' AND column_name = 'period_end'
  ) THEN
    ALTER TABLE public.user_usage ADD COLUMN period_end timestamptz;
  END IF;
END $$;

COMMENT ON TABLE public.subscriptions IS 'Stripe subscription state; one row per user.';
COMMENT ON TABLE public.intro_offer_claims IS 'Tracks users who claimed the one-time intro offer.';

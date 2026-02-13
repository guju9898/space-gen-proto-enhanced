-- Migration: Add render events table for idempotency and support fractional credits
-- This migration is idempotent and safe to run multiple times

-- Step 1: Create user_render_events table for idempotency
CREATE TABLE IF NOT EXISTS public.user_render_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  render_id text NOT NULL,
  cost numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, render_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_render_events_user_period 
  ON public.user_render_events(user_id, period_start);

-- Enable RLS
ALTER TABLE public.user_render_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own render events
CREATE POLICY "Users can view their own render events"
  ON public.user_render_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own render events
CREATE POLICY "Users can insert their own render events"
  ON public.user_render_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 2: Ensure user_usage table exists and credits_used supports decimals
-- Check if user_usage table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_usage'
  ) THEN
    CREATE TABLE public.user_usage (
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      period_start timestamptz NOT NULL,
      credits_used numeric(10, 2) DEFAULT 0 NOT NULL,
      updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
      PRIMARY KEY (user_id, period_start)
    );
  END IF;
END $$;

-- Convert credits_used to numeric if it's currently integer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_usage' 
    AND column_name = 'credits_used'
    AND data_type = 'integer'
  ) THEN
    -- Convert integer to numeric, preserving existing values
    ALTER TABLE public.user_usage 
    ALTER COLUMN credits_used TYPE numeric(10, 2) USING credits_used::numeric(10, 2);
  END IF;
END $$;

-- Ensure credits_used is numeric(10, 2) if column exists but is wrong type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_usage' 
    AND column_name = 'credits_used'
  ) THEN
    -- Ensure it's numeric(10, 2)
    ALTER TABLE public.user_usage 
    ALTER COLUMN credits_used TYPE numeric(10, 2) USING credits_used::numeric(10, 2);
  END IF;
END $$;

-- Create index for user_usage if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_usage_user_period 
  ON public.user_usage(user_id, period_start);

-- Enable RLS on user_usage if not already enabled
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_usage' 
    AND policyname = 'Users can view their own usage'
  ) THEN
    CREATE POLICY "Users can view their own usage"
      ON public.user_usage FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policy: Service role can manage usage (for server-side updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_usage' 
    AND policyname = 'Service role can manage usage'
  ) THEN
    CREATE POLICY "Service role can manage usage"
      ON public.user_usage FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;



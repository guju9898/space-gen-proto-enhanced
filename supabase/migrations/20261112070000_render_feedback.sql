-- Thumbs up/down on a Studio render (spec Phase 2). One row per vote; a later vote on the
-- same render by the same user replaces the earlier one. Owner-only access.
CREATE TABLE IF NOT EXISTS public.render_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  render_url text NOT NULL,
  project_render_id uuid NULL REFERENCES public.project_renders(id) ON DELETE SET NULL,
  studio_type text NOT NULL CHECK (studio_type IN ('interior', 'exterior', 'landscape')),
  rating smallint NOT NULL CHECK (rating IN (-1, 1)),
  reasons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, render_url)
);

CREATE INDEX IF NOT EXISTS idx_render_feedback_created ON public.render_feedback (created_at DESC);

ALTER TABLE public.render_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'render_feedback' AND policyname = 'Users manage own render_feedback') THEN
    CREATE POLICY "Users manage own render_feedback" ON public.render_feedback
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

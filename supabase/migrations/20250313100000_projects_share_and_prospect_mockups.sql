-- Growth Loop: ensure projects has share_slug (unique) and is_shared; create prospect_mockups.
-- Idempotent.

-- 1) Ensure projects table exists with share columns
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  project_type text NOT NULL,
  cover_image text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'share_slug') THEN
    ALTER TABLE public.projects ADD COLUMN share_slug text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'is_shared') THEN
    ALTER TABLE public.projects ADD COLUMN is_shared boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_share_slug_unique ON public.projects(share_slug) WHERE share_slug IS NOT NULL;

-- 2) Ensure project_renders exists (referenced by prospect_mockups)
CREATE TABLE IF NOT EXISTS public.project_renders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_type text NOT NULL,
  image_url text NOT NULL,
  thumbnail_url text,
  source_image_url text,
  prompt_summary text,
  credits_used numeric(10, 2),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3) Prospect mockups (Loop 3)
CREATE TABLE IF NOT EXISTS public.prospect_mockups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  render_id uuid NOT NULL REFERENCES public.project_renders(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  prospect_name text,
  property_address text,
  message text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prospect_mockups_slug ON public.prospect_mockups(slug);
CREATE INDEX IF NOT EXISTS idx_prospect_mockups_user_id ON public.prospect_mockups(user_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_mockups ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects (allow owner)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can manage own projects') THEN
    CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Public read for shared projects (for /view/[slug])
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Public can view shared projects') THEN
    CREATE POLICY "Public can view shared projects" ON public.projects FOR SELECT USING (is_shared = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_renders' AND policyname = 'Users can manage own project_renders') THEN
    CREATE POLICY "Users can manage own project_renders" ON public.project_renders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_renders' AND policyname = 'Public can view renders of shared projects') THEN
    CREATE POLICY "Public can view renders of shared projects" ON public.project_renders FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_shared = true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prospect_mockups' AND policyname = 'Users can manage own prospect_mockups') THEN
    CREATE POLICY "Users can manage own prospect_mockups" ON public.prospect_mockups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Public read for prospect mockups by slug (for /mockup/[slug])
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prospect_mockups' AND policyname = 'Public can view prospect_mockups by slug') THEN
    CREATE POLICY "Public can view prospect_mockups by slug" ON public.prospect_mockups FOR SELECT USING (true);
  END IF;
END $$;

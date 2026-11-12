-- Restore the owner policies that 20250313100000_projects_share_and_prospect_mockups.sql
-- declares but that are missing in production. Without them, "Save to project" fails on the
-- project_renders insert (RLS on, no insert policy) and owners cannot read their own
-- unshared renders or create prospect mockups. Owner-scoped only; no public access added.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'project_renders'
      AND policyname = 'Users can manage own project_renders'
  ) THEN
    CREATE POLICY "Users can manage own project_renders" ON public.project_renders
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = project_renders.project_id AND p.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prospect_mockups'
      AND policyname = 'Users can manage own prospect_mockups'
  ) THEN
    CREATE POLICY "Users can manage own prospect_mockups" ON public.prospect_mockups
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

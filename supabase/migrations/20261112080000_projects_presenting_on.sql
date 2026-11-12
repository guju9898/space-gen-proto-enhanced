-- "Presenting on" date for a project (spec Phase 2 / section 3): the day the contractor
-- shows the client. Optional; owner RLS on projects already covers it.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS presenting_on date NULL;

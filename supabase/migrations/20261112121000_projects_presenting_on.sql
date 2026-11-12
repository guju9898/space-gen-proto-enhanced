-- Meeting date for a job (Wave 5 "When are you showing this?"). Exists in
-- production; capture in repo so fresh environments match.

alter table public.projects
  add column if not exists presenting_on date;

comment on column public.projects.presenting_on is
  'Optional date the contractor plans to present this project to a client.';

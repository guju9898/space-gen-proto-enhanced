-- Human Polish Phase 6B — operational hardening columns.
-- Replacement-upload tokens (paid needs_information), Brief-Match note tracking.
-- Does not alter RLS, storage policies, or buckets.

ALTER TABLE public.human_polish_requests
  ADD COLUMN IF NOT EXISTS replacement_upload_token_hash text NULL,
  ADD COLUMN IF NOT EXISTS replacement_upload_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS replacement_upload_issued_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS last_revision_note text NULL,
  ADD COLUMN IF NOT EXISTS last_revision_requested_at timestamptz NULL;

COMMENT ON COLUMN public.human_polish_requests.replacement_upload_token_hash IS
  'SHA-256 hex of paid replacement-upload token; raw token never stored.';
COMMENT ON COLUMN public.human_polish_requests.replacement_upload_expires_at IS
  'Absolute expiry for replacement-upload access (7-day window from issue).';
COMMENT ON COLUMN public.human_polish_requests.replacement_upload_issued_at IS
  'When the current replacement-upload token was issued.';
COMMENT ON COLUMN public.human_polish_requests.last_revision_note IS
  'Admin note for the First-Batch Brief-Match correction (AI Render Packs).';
COMMENT ON COLUMN public.human_polish_requests.last_revision_requested_at IS
  'When the Brief-Match correction was recorded.';

-- Human Polish Phase 8B — rights permission workflow + AI pack expiration.
-- Additive only. Preserves rights_request_sent / rights_permission_granted.
-- Does not alter RLS, storage policies, or buckets.

ALTER TABLE public.human_polish_requests
  ADD COLUMN IF NOT EXISTS rights_permission_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS rights_requested_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS rights_responded_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS rights_permission_token_hash text NULL,
  ADD COLUMN IF NOT EXISTS rights_permission_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS pack_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS expiration_reminder_sent_at timestamptz NULL;

-- Compatibility backfill from legacy booleans (no invented timestamps).
UPDATE public.human_polish_requests
SET rights_permission_status = CASE
  WHEN rights_permission_granted = true THEN 'granted'
  WHEN rights_request_sent = true THEN 'requested'
  ELSE 'not_requested'
END
WHERE rights_permission_status = 'not_requested'
  AND (rights_permission_granted = true OR rights_request_sent = true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'human_polish_requests_rights_permission_status_check'
  ) THEN
    ALTER TABLE public.human_polish_requests
      ADD CONSTRAINT human_polish_requests_rights_permission_status_check
      CHECK (
        rights_permission_status IN (
          'not_requested',
          'requested',
          'granted',
          'declined'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.human_polish_requests.rights_permission_status IS
  'Phase 8 authority for portfolio permission: not_requested | requested | granted | declined.';
COMMENT ON COLUMN public.human_polish_requests.rights_requested_at IS
  'When the current rights permission request was issued.';
COMMENT ON COLUMN public.human_polish_requests.rights_responded_at IS
  'When the customer Allow/Decline decision was recorded.';
COMMENT ON COLUMN public.human_polish_requests.rights_permission_token_hash IS
  'SHA-256 hex of rights permission token; raw token never stored.';
COMMENT ON COLUMN public.human_polish_requests.rights_permission_expires_at IS
  'Absolute expiry for rights permission access (14-day window from issue).';
COMMENT ON COLUMN public.human_polish_requests.paid_at IS
  'Trusted server time of the first successful paid transition.';
COMMENT ON COLUMN public.human_polish_requests.pack_expires_at IS
  'AI Render Pack 90-day use-by date from paid_at; null for Build-Ready.';
COMMENT ON COLUMN public.human_polish_requests.expiration_reminder_sent_at IS
  'When the single ~14-day pack expiration reminder was successfully claimed/sent.';

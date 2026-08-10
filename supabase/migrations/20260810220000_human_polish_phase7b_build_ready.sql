-- Human Polish Phase 7B — Build-Ready durable approval + payment access.
-- Adds approved_amount (cents), scope review audit fields, and payment-token columns.
-- Does not alter RLS, storage policies, or buckets.
-- Does not remove or rewrite quoted_amount (legacy/history only for Phase 7 Checkout).

ALTER TABLE public.human_polish_requests
  ADD COLUMN IF NOT EXISTS approved_amount integer NULL,
  ADD COLUMN IF NOT EXISTS scope_reviewed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS scope_reviewed_by uuid NULL,
  ADD COLUMN IF NOT EXISTS reviewer_message text NULL,
  ADD COLUMN IF NOT EXISTS internal_review_notes text NULL,
  ADD COLUMN IF NOT EXISTS payment_requested_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS build_ready_payment_token_hash text NULL,
  ADD COLUMN IF NOT EXISTS build_ready_payment_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS build_ready_payment_issued_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS payment_request_id uuid NULL;

COMMENT ON COLUMN public.human_polish_requests.approved_amount IS
  'Server-authoritative Build-Ready approved price in integer USD cents.';
COMMENT ON COLUMN public.human_polish_requests.scope_reviewed_at IS
  'When Admin approved Build-Ready scope/package/amount.';
COMMENT ON COLUMN public.human_polish_requests.scope_reviewed_by IS
  'Auth user id of the Admin who approved Build-Ready scope.';
COMMENT ON COLUMN public.human_polish_requests.reviewer_message IS
  'Customer-facing message included with Build-Ready approval/quote.';
COMMENT ON COLUMN public.human_polish_requests.internal_review_notes IS
  'Internal-only Build-Ready review notes; never emailed or shown on pay page.';
COMMENT ON COLUMN public.human_polish_requests.payment_requested_at IS
  'When the current Build-Ready payment request email/token was issued.';
COMMENT ON COLUMN public.human_polish_requests.build_ready_payment_token_hash IS
  'SHA-256 hex of Build-Ready payment token; raw token never stored.';
COMMENT ON COLUMN public.human_polish_requests.build_ready_payment_expires_at IS
  'Absolute expiry for Build-Ready payment access (7-day window from issue).';
COMMENT ON COLUMN public.human_polish_requests.build_ready_payment_issued_at IS
  'When the current Build-Ready payment token was issued.';
COMMENT ON COLUMN public.human_polish_requests.payment_request_id IS
  'Non-secret correlation id binding Checkout/PaymentIntent metadata to this approval version.';

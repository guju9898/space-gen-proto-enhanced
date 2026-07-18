-- Human Polish V1 — core request + file tables, RLS, private storage bucket.
-- Spec: docs/human-polish-v1-spec.md §7
-- Idempotent where practical.

-- ---------------------------------------------------------------------------
-- human_polish_requests
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.human_polish_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  draft_token_hash text,
  draft_expires_at timestamptz,
  contact_name text,
  contact_email text,
  contact_phone text,
  phone_normalized text,
  company_name text,
  customer_role text,
  preferred_contact_method text,
  family text NOT NULL,
  requested_package text NOT NULL,
  approved_package text,
  intake_method text NOT NULL DEFAULT 'wizard',
  lead_source text,
  project_type text,
  project_name text,
  project_address text,
  project_city text,
  project_state text,
  brief_text text,
  design_objectives text,
  must_have_elements text,
  avoid_elements text,
  material_preferences text,
  client_words text,
  success_definition text,
  deadline_date date,
  budget_band text,
  has_approved_concept boolean NOT NULL DEFAULT false,
  has_property_survey boolean NOT NULL DEFAULT false,
  second_property_requested boolean NOT NULL DEFAULT false,
  branding_requested boolean NOT NULL DEFAULT false,
  brand_phone text,
  brand_website text,
  brand_notes text,
  rush_requested boolean NOT NULL DEFAULT false,
  rush_approved boolean NOT NULL DEFAULT false,
  scope_confirmed boolean NOT NULL DEFAULT false,
  scope_confirmed_at timestamptz,
  terms_accepted_at timestamptz,
  marketing_permission boolean NOT NULL DEFAULT false,
  manual_quote_required boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  standard_amount integer,
  discount_amount integer NOT NULL DEFAULT 0,
  quoted_amount integer,
  currency text NOT NULL DEFAULT 'usd',
  promotion_type text NOT NULL DEFAULT 'none',
  subscriber_discount_applied boolean NOT NULL DEFAULT false,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  payment_status text NOT NULL DEFAULT 'unpaid',
  files_accepted_at timestamptz,
  delivery_clock_started_at timestamptz,
  assigned_to text,
  revision_count integer NOT NULL DEFAULT 0,
  first_batch_delivered_at timestamptz,
  final_delivered_at timestamptz,
  rights_request_sent boolean NOT NULL DEFAULT false,
  rights_permission_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT human_polish_requests_family_check
    CHECK (family IN ('ai-render-pack', 'build-ready')),
  CONSTRAINT human_polish_requests_package_check
    CHECK (requested_package IN ('25', '50', '100', 'essentials-2d', 'essentials-3d', 'custom')),
  CONSTRAINT human_polish_requests_status_check
    CHECK (status IN (
      'draft',
      'submitted',
      'needs_information',
      'under_review',
      'rush_review',
      'ready_for_payment',
      'awaiting_payment',
      'paid',
      'files_accepted',
      'assigned',
      'in_progress',
      'first_batch_ready',
      'first_batch_delivered',
      'ready_for_review',
      'delivered',
      'revision_requested',
      'completed',
      'cancelled',
      'expired'
    )),
  CONSTRAINT human_polish_requests_promotion_check
    CHECK (promotion_type IN ('none', 'first_purchase_25', 'subscriber_15')),
  CONSTRAINT human_polish_requests_payment_status_check
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'cancelled')),
  CONSTRAINT human_polish_requests_family_package_check
    CHECK (
      (family = 'ai-render-pack' AND requested_package IN ('25', '50', '100'))
      OR (family = 'build-ready' AND requested_package IN ('essentials-2d', 'essentials-3d', 'custom'))
    )
);

CREATE INDEX IF NOT EXISTS idx_human_polish_requests_status
  ON public.human_polish_requests (status);

CREATE INDEX IF NOT EXISTS idx_human_polish_requests_phone_normalized
  ON public.human_polish_requests (phone_normalized);

CREATE INDEX IF NOT EXISTS idx_human_polish_requests_draft_token_hash
  ON public.human_polish_requests (draft_token_hash)
  WHERE draft_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_human_polish_requests_user_id
  ON public.human_polish_requests (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_human_polish_requests_created_at
  ON public.human_polish_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_human_polish_requests_stripe_checkout_session_id
  ON public.human_polish_requests (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

DROP TRIGGER IF EXISTS handle_human_polish_requests_updated_at ON public.human_polish_requests;
CREATE TRIGGER handle_human_polish_requests_updated_at
  BEFORE UPDATE ON public.human_polish_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.human_polish_requests ENABLE ROW LEVEL SECURITY;

-- Guest intake goes through service-role API routes only.
-- No anonymous/public table policies (service role bypasses RLS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'human_polish_requests'
      AND policyname = 'Authenticated users can view own human_polish_requests'
  ) THEN
    CREATE POLICY "Authenticated users can view own human_polish_requests"
      ON public.human_polish_requests
      FOR SELECT
      USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- human_polish_files
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.human_polish_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.human_polish_requests(id) ON DELETE CASCADE,
  bucket_name text NOT NULL DEFAULT 'human-polish-uploads',
  object_path text NOT NULL,
  file_type text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT human_polish_files_file_type_check
    CHECK (file_type IN (
      'site_photos',
      'property_survey',
      'inspiration_images',
      'plant_references',
      'hoa_guidelines',
      'existing_plans',
      'approved_concepts',
      'company_logo',
      'other'
    )),
  CONSTRAINT human_polish_files_mime_type_check
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  CONSTRAINT human_polish_files_size_bytes_check
    CHECK (size_bytes > 0 AND size_bytes <= 26214400),
  CONSTRAINT human_polish_files_object_path_unique
    UNIQUE (bucket_name, object_path)
);

CREATE INDEX IF NOT EXISTS idx_human_polish_files_request_id
  ON public.human_polish_files (request_id);

CREATE INDEX IF NOT EXISTS idx_human_polish_files_file_type
  ON public.human_polish_files (file_type);

ALTER TABLE public.human_polish_files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'human_polish_files'
      AND policyname = 'Authenticated users can view files for own human_polish_requests'
  ) THEN
    CREATE POLICY "Authenticated users can view files for own human_polish_requests"
      ON public.human_polish_files
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.human_polish_requests r
          WHERE r.id = request_id
            AND r.user_id IS NOT NULL
            AND r.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Private storage bucket: human-polish-uploads
-- public = false; no public-read policies; no getPublicUrl usage in app code.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'human-polish-uploads',
  'human-polish-uploads',
  false,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure no public/anon read or list policies exist for this bucket.
-- Uploads and downloads are authorized only via service-role signed URLs.
DO $$
BEGIN
  -- Drop any accidental public policies if re-running after a bad deploy.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read human-polish-uploads'
  ) THEN
    DROP POLICY "Public read human-polish-uploads" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anon upload human-polish-uploads'
  ) THEN
    DROP POLICY "Anon upload human-polish-uploads" ON storage.objects;
  END IF;
END $$;

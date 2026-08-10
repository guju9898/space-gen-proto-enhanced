-- Restrict legacy bucket-unscoped storage.objects policies so they no longer
-- grant authenticated SELECT/INSERT on private buckets such as human-polish-uploads.
--
-- Prerequisite (verified live Production names):
--   - "Authenticated users can read"   (SELECT, role authenticated)
--   - "Authenticated users can upload" (INSERT, role authenticated)
--
-- Explicit allowlist: reference-images, renders only.
-- Does not alter buckets, Human Polish table RLS, or bucket-specific policies.

ALTER POLICY "Authenticated users can read"
  ON storage.objects
  USING (bucket_id IN ('reference-images', 'renders'));

ALTER POLICY "Authenticated users can upload"
  ON storage.objects
  WITH CHECK (bucket_id IN ('reference-images', 'renders'));

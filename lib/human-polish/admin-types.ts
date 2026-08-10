/**
 * Schema-aligned request row types for Human Polish admin (service-role queries).
 * Columns mirror supabase/migrations/20260716150000_human_polish_foundation.sql.
 */

export type HumanPolishAdminListRow = {
  id: string
  created_at: string
  updated_at: string
  contact_name: string | null
  company_name: string | null
  contact_email: string | null
  family: string
  requested_package: string
  project_type: string | null
  status: string
  payment_status: string
  rush_requested: boolean
  rush_approved: boolean
  assigned_to: string | null
  delivery_clock_started_at: string | null
}

export type HumanPolishAdminDetailRow = HumanPolishAdminListRow & {
  contact_phone: string | null
  customer_role: string | null
  preferred_contact_method: string | null
  approved_package: string | null
  intake_method: string
  lead_source: string | null
  project_name: string | null
  project_address: string | null
  project_city: string | null
  project_state: string | null
  brief_text: string | null
  design_objectives: string | null
  must_have_elements: string | null
  avoid_elements: string | null
  material_preferences: string | null
  client_words: string | null
  success_definition: string | null
  deadline_date: string | null
  budget_band: string | null
  has_approved_concept: boolean
  has_property_survey: boolean
  second_property_requested: boolean
  branding_requested: boolean
  brand_phone: string | null
  brand_website: string | null
  brand_notes: string | null
  scope_confirmed: boolean
  scope_confirmed_at: string | null
  terms_accepted_at: string | null
  marketing_permission: boolean
  manual_quote_required: boolean
  standard_amount: number | null
  discount_amount: number
  quoted_amount: number | null
  currency: string
  promotion_type: string
  subscriber_discount_applied: boolean
  payment_status: string
  files_accepted_at: string | null
  delivery_clock_started_at: string | null
  revision_count: number
  first_batch_delivered_at: string | null
  final_delivered_at: string | null
  last_revision_note: string | null
  last_revision_requested_at: string | null
  rights_request_sent: boolean
  rights_permission_granted: boolean
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  approved_amount: number | null
  scope_reviewed_at: string | null
  scope_reviewed_by: string | null
  reviewer_message: string | null
  internal_review_notes: string | null
  payment_requested_at: string | null
  payment_request_id: string | null
  build_ready_payment_expires_at: string | null
  build_ready_payment_issued_at: string | null
}

export type HumanPolishAdminFileRow = {
  id: string
  request_id: string
  bucket_name: string
  object_path: string
  file_type: string
  original_filename: string
  mime_type: string
  size_bytes: number
  created_at: string
}

export const ADMIN_LIST_SELECT = [
  "id",
  "created_at",
  "updated_at",
  "contact_name",
  "company_name",
  "contact_email",
  "family",
  "requested_package",
  "project_type",
  "status",
  "payment_status",
  "rush_requested",
  "rush_approved",
  "assigned_to",
  "delivery_clock_started_at",
].join(", ")

export const ADMIN_DETAIL_SELECT = [
  ADMIN_LIST_SELECT,
  "contact_phone",
  "customer_role",
  "preferred_contact_method",
  "approved_package",
  "intake_method",
  "lead_source",
  "project_name",
  "project_address",
  "project_city",
  "project_state",
  "brief_text",
  "design_objectives",
  "must_have_elements",
  "avoid_elements",
  "material_preferences",
  "client_words",
  "success_definition",
  "deadline_date",
  "budget_band",
  "has_approved_concept",
  "has_property_survey",
  "second_property_requested",
  "branding_requested",
  "brand_phone",
  "brand_website",
  "brand_notes",
  "scope_confirmed",
  "scope_confirmed_at",
  "terms_accepted_at",
  "marketing_permission",
  "manual_quote_required",
  "standard_amount",
  "discount_amount",
  "quoted_amount",
  "currency",
  "promotion_type",
  "subscriber_discount_applied",
  "files_accepted_at",
  "revision_count",
  "first_batch_delivered_at",
  "final_delivered_at",
  "last_revision_note",
  "last_revision_requested_at",
  "rights_request_sent",
  "rights_permission_granted",
  "stripe_checkout_session_id",
  "stripe_payment_intent_id",
  "approved_amount",
  "scope_reviewed_at",
  "scope_reviewed_by",
  "reviewer_message",
  "internal_review_notes",
  "payment_requested_at",
  "payment_request_id",
  "build_ready_payment_expires_at",
  "build_ready_payment_issued_at",
].join(", ")

export const ADMIN_FILE_SELECT = [
  "id",
  "request_id",
  "bucket_name",
  "object_path",
  "file_type",
  "original_filename",
  "mime_type",
  "size_bytes",
  "created_at",
].join(", ")

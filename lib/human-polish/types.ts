/**
 * Human Polish™ V1 — canonical types and label maps.
 * Source of truth: docs/human-polish-v1-spec.md (§2, §4.4, §7).
 * No TypeScript enum keyword — string unions + as const arrays + Record maps.
 */

// ---------------------------------------------------------------------------
// Service family
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_SERVICE_FAMILIES = ["ai-render-pack", "build-ready"] as const

export type HumanPolishServiceFamily = (typeof HUMAN_POLISH_SERVICE_FAMILIES)[number]

export const HUMAN_POLISH_SERVICE_FAMILY_LABELS: Record<HumanPolishServiceFamily, string> = {
  "ai-render-pack": "AI Render Packs",
  "build-ready": "Build-Ready Packages",
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

export const AI_RENDER_PACK_PACKAGES = ["25", "50", "100"] as const
export type AiRenderPackPackage = (typeof AI_RENDER_PACK_PACKAGES)[number]

export const BUILD_READY_PACKAGES = ["essentials-2d", "essentials-3d", "custom"] as const
export type BuildReadyPackage = (typeof BUILD_READY_PACKAGES)[number]

export const HUMAN_POLISH_PACKAGES = [
  ...AI_RENDER_PACK_PACKAGES,
  ...BUILD_READY_PACKAGES,
] as const

export type HumanPolishPackage = (typeof HUMAN_POLISH_PACKAGES)[number]

export const HUMAN_POLISH_PACKAGE_LABELS: Record<HumanPolishPackage, string> = {
  "25": "25 concepts",
  "50": "50 concepts",
  "100": "100 concepts",
  "essentials-2d": "Essentials 2D",
  "essentials-3d": "Essentials 3D",
  custom: "Custom",
}

// ---------------------------------------------------------------------------
// Status (§7.1)
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_STATUSES = [
  "draft",
  "submitted",
  "needs_information",
  "under_review",
  "rush_review",
  "ready_for_payment",
  "awaiting_payment",
  "paid",
  "files_accepted",
  "assigned",
  "in_progress",
  "first_batch_ready",
  "first_batch_delivered",
  "ready_for_review",
  "delivered",
  "revision_requested",
  "completed",
  "cancelled",
  "expired",
] as const

export type HumanPolishStatus = (typeof HUMAN_POLISH_STATUSES)[number]

export const HUMAN_POLISH_STATUS_LABELS: Record<HumanPolishStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  needs_information: "Needs information",
  under_review: "Under review",
  rush_review: "Rush review",
  ready_for_payment: "Ready for payment",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  files_accepted: "Files accepted",
  assigned: "Assigned",
  in_progress: "In progress",
  first_batch_ready: "First batch ready",
  first_batch_delivered: "First batch delivered",
  ready_for_review: "Ready for review",
  delivered: "Delivered",
  revision_requested: "Revision requested",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
}

// ---------------------------------------------------------------------------
// File types (§4.4)
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_FILE_TYPES = [
  "site_photos",
  "property_survey",
  "inspiration_images",
  "plant_references",
  "hoa_guidelines",
  "existing_plans",
  "approved_concepts",
  "company_logo",
  "other",
] as const

export type HumanPolishFileType = (typeof HUMAN_POLISH_FILE_TYPES)[number]

export const HUMAN_POLISH_FILE_TYPE_LABELS: Record<HumanPolishFileType, string> = {
  site_photos: "Site photos",
  property_survey: "Property survey",
  inspiration_images: "Inspiration images",
  plant_references: "Plant references",
  hoa_guidelines: "HOA guidelines",
  existing_plans: "Existing plans",
  approved_concepts: "Approved concepts",
  company_logo: "Company logo",
  other: "Other supporting document",
}

// ---------------------------------------------------------------------------
// Promotion type
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_PROMOTION_TYPES = [
  "none",
  "first_purchase_25",
  "subscriber_15",
] as const

export type HumanPolishPromotionType = (typeof HUMAN_POLISH_PROMOTION_TYPES)[number]

export const HUMAN_POLISH_PROMOTION_TYPE_LABELS: Record<HumanPolishPromotionType, string> = {
  none: "None",
  first_purchase_25: "First-purchase 25-pack",
  subscriber_15: "Subscriber 15% off",
}

// ---------------------------------------------------------------------------
// Contact / intake helpers (shared contracts; used by later phases)
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_CUSTOMER_ROLES = [
  "contractor",
  "designer",
  "homeowner",
  "developer",
  "other",
] as const

export type HumanPolishCustomerRole = (typeof HUMAN_POLISH_CUSTOMER_ROLES)[number]

export const HUMAN_POLISH_PREFERRED_CONTACT_METHODS = [
  "phone",
  "email",
  "whatsapp",
] as const

export type HumanPolishPreferredContactMethod =
  (typeof HUMAN_POLISH_PREFERRED_CONTACT_METHODS)[number]

export const HUMAN_POLISH_PROJECT_TYPES = [
  "landscape_outdoor_living",
  "exterior_home",
  "interior",
  "pool",
  "commercial_large_property",
  "other_custom",
] as const

export type HumanPolishProjectType = (typeof HUMAN_POLISH_PROJECT_TYPES)[number]

export const HUMAN_POLISH_PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "refunded",
  "cancelled",
] as const

export type HumanPolishPaymentStatus = (typeof HUMAN_POLISH_PAYMENT_STATUSES)[number]

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isHumanPolishServiceFamily(value: unknown): value is HumanPolishServiceFamily {
  return (
    typeof value === "string" &&
    (HUMAN_POLISH_SERVICE_FAMILIES as readonly string[]).includes(value)
  )
}

export function isAiRenderPackPackage(value: unknown): value is AiRenderPackPackage {
  return typeof value === "string" && (AI_RENDER_PACK_PACKAGES as readonly string[]).includes(value)
}

export function isBuildReadyPackage(value: unknown): value is BuildReadyPackage {
  return typeof value === "string" && (BUILD_READY_PACKAGES as readonly string[]).includes(value)
}

export function isHumanPolishPackage(value: unknown): value is HumanPolishPackage {
  return typeof value === "string" && (HUMAN_POLISH_PACKAGES as readonly string[]).includes(value)
}

export function isHumanPolishFileType(value: unknown): value is HumanPolishFileType {
  return typeof value === "string" && (HUMAN_POLISH_FILE_TYPES as readonly string[]).includes(value)
}

export function isHumanPolishStatus(value: unknown): value is HumanPolishStatus {
  return typeof value === "string" && (HUMAN_POLISH_STATUSES as readonly string[]).includes(value)
}

export function isHumanPolishPromotionType(
  value: unknown
): value is HumanPolishPromotionType {
  return (
    typeof value === "string" &&
    (HUMAN_POLISH_PROMOTION_TYPES as readonly string[]).includes(value)
  )
}

/** Validates that package belongs to the given service family. */
export function isPackageForFamily(
  family: HumanPolishServiceFamily,
  pkg: unknown
): pkg is HumanPolishPackage {
  if (family === "ai-render-pack") return isAiRenderPackPackage(pkg)
  if (family === "build-ready") return isBuildReadyPackage(pkg)
  return false
}

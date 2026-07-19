/**
 * Human Polish™ intake — client-safe presentation config.
 *
 * All machine-readable values (prices, limits, first-batch sizes, delivery
 * targets, package labels) are imported from the canonical shared modules
 * `lib/human-polish/config` and `lib/human-polish/types`. Nothing here
 * duplicates pricing or business rules. Server-only modules (phone.ts,
 * storage.ts, rate-limit.ts, supabase.ts) are never imported by client code.
 */

import {
  HUMAN_POLISH_CUSTOMER_ROLES,
  HUMAN_POLISH_FILE_TYPES,
  HUMAN_POLISH_FILE_TYPE_LABELS,
  HUMAN_POLISH_PREFERRED_CONTACT_METHODS,
  HUMAN_POLISH_PROJECT_TYPES,
  type HumanPolishCustomerRole,
  type HumanPolishFileType,
  type HumanPolishPreferredContactMethod,
  type HumanPolishProjectType,
} from "@/lib/human-polish/types"
import type { IntakeFormData } from "./intakeTypes"

// ---------------------------------------------------------------------------
// Default empty form
// ---------------------------------------------------------------------------

export const EMPTY_INTAKE_FORM: IntakeFormData = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  companyName: "",
  customerRole: "",
  preferredContactMethod: "",
  projectType: "",
  projectName: "",
  projectAddress: "",
  projectCity: "",
  projectState: "",
  briefText: "",
  budgetBand: "",
  deadlineDate: "",
  hasApprovedConcept: false,
  onePropertyConfirmed: false,
  secondPropertyRequested: false,
  hasPropertySurvey: false,
  designObjectives: "",
  mustHaveElements: "",
  avoidElements: "",
  materialPreferences: "",
  clientWords: "",
  successDefinition: "",
  tonePreference: "",
  rushRequested: false,
  brandingRequested: false,
  brandPhone: "",
  brandWebsite: "",
  brandNotes: "",
  projectTitle: "",
  ackPermission: false,
  ackConceptual: false,
  ackDeliveryClock: false,
  ackGuaranteeScope: false,
  ackExpiration: false,
  ackScopeReview: false,
  ackTerms: false,
  marketingPermission: false,
}

// ---------------------------------------------------------------------------
// Option lists (labels are marketing copy; slugs are canonical)
// ---------------------------------------------------------------------------

export const CUSTOMER_ROLE_OPTIONS: { value: HumanPolishCustomerRole; label: string }[] =
  HUMAN_POLISH_CUSTOMER_ROLES.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }))

export const PREFERRED_CONTACT_OPTIONS: {
  value: HumanPolishPreferredContactMethod
  label: string
}[] = HUMAN_POLISH_PREFERRED_CONTACT_METHODS.map((value) => ({
  value,
  label: value === "whatsapp" ? "WhatsApp" : value.charAt(0).toUpperCase() + value.slice(1),
}))

export const PROJECT_TYPE_LABELS: Record<HumanPolishProjectType, string> = {
  landscape_outdoor_living: "Landscape / outdoor living",
  exterior_home: "Exterior / home",
  interior: "Interior",
  pool: "Pool",
  commercial_large_property: "Commercial / large property",
  other_custom: "Other / custom",
}

export const PROJECT_TYPE_OPTIONS: { value: HumanPolishProjectType; label: string }[] =
  HUMAN_POLISH_PROJECT_TYPES.map((value) => ({ value, label: PROJECT_TYPE_LABELS[value] }))

/** Budget bands are presentation-only guidance, not pricing. */
export const BUDGET_BAND_OPTIONS: { value: string; label: string }[] = [
  { value: "under_25k", label: "Under $25k" },
  { value: "25k_50k", label: "$25k – $50k" },
  { value: "50k_100k", label: "$50k – $100k" },
  { value: "100k_250k", label: "$100k – $250k" },
  { value: "250k_plus", label: "$250k+" },
  { value: "unsure", label: "Not sure yet" },
]

export const FILE_TYPE_OPTIONS: { value: HumanPolishFileType; label: string }[] =
  HUMAN_POLISH_FILE_TYPES.map((value) => ({
    value,
    label: HUMAN_POLISH_FILE_TYPE_LABELS[value],
  }))

export const TONE_OPTIONS: { value: string; label: string }[] = [
  { value: "practical", label: "Practical" },
  { value: "premium", label: "Premium" },
  { value: "experimental", label: "Experimental" },
  { value: "mixed", label: "Mixed" },
]

// ---------------------------------------------------------------------------
// Wizard step model
// ---------------------------------------------------------------------------

export const INTAKE_STEP_IDS = [
  "contact",
  "project",
  "scope",
  "upload",
  "interview",
  "delivery",
  "acknowledgments",
  "summary",
] as const

export type IntakeStepId = (typeof INTAKE_STEP_IDS)[number]

export const INTAKE_STEP_META: Record<
  IntakeStepId,
  { title: string; shortLabel: string; description: string }
> = {
  contact: {
    title: "Contact & business",
    shortLabel: "Contact",
    description: "So the Renderspace team can reach you about this project.",
  },
  project: {
    title: "Project basics",
    shortLabel: "Project",
    description: "Tell us what and where we are visualizing.",
  },
  scope: {
    title: "Property & scope",
    shortLabel: "Scope",
    description: "A standard pack covers one project at one property.",
  },
  upload: {
    title: "Private file upload",
    shortLabel: "Files",
    description: "Site photos, survey, inspiration, and supporting documents.",
  },
  interview: {
    title: "Design interview",
    shortLabel: "Brief",
    description: "Describe the vision in your own words — no prompt engineering needed.",
  },
  delivery: {
    title: "Delivery & branding",
    shortLabel: "Delivery",
    description: "How we deliver and whether the PDF carries your branding.",
  },
  acknowledgments: {
    title: "Expectations & acknowledgments",
    shortLabel: "Confirm",
    description: "Please review and confirm how the package works.",
  },
  summary: {
    title: "Order summary",
    shortLabel: "Summary",
    description: "Review everything before you continue.",
  },
}

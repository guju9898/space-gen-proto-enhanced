/**
 * Human Polish™ intake — client-side form state and draft-session types.
 *
 * These types describe the *client* wizard state only. The server contracts
 * (draft create / recover / upload sign / upload complete) remain authoritative;
 * see docs/human-polish-v1-spec.md §4 and the routes under app/api/human-polish.
 *
 * Field names intentionally mirror the safe fields returned by
 * app/api/human-polish/draft/recover so a recovered draft can be hydrated
 * directly onto this shape.
 */

import type {
  HumanPolishCustomerRole,
  HumanPolishFileType,
  HumanPolishPackage,
  HumanPolishPreferredContactMethod,
  HumanPolishProjectType,
  HumanPolishServiceFamily,
} from "@/lib/human-polish/types"

/** The full guided-interview state collected in the browser. */
export interface IntakeFormData {
  // Step 1 — contact & business
  contactName: string
  contactEmail: string
  contactPhone: string
  companyName: string
  customerRole: HumanPolishCustomerRole | ""
  preferredContactMethod: HumanPolishPreferredContactMethod | ""

  // Step 2 — project basics
  projectType: HumanPolishProjectType | ""
  projectName: string
  projectAddress: string
  projectCity: string
  projectState: string
  briefText: string
  budgetBand: string
  deadlineDate: string
  hasApprovedConcept: boolean

  // Step 3 — property & scope rule
  onePropertyConfirmed: boolean
  secondPropertyRequested: boolean
  hasPropertySurvey: boolean

  // Step 5 — prescriptive design interview
  designObjectives: string
  mustHaveElements: string
  avoidElements: string
  materialPreferences: string
  clientWords: string
  successDefinition: string
  tonePreference: string

  // Step 6 — delivery & branding
  rushRequested: boolean
  brandingRequested: boolean
  brandPhone: string
  brandWebsite: string
  brandNotes: string
  projectTitle: string

  // Step 7 — acknowledgments
  ackPermission: boolean
  ackConceptual: boolean
  ackDeliveryClock: boolean
  ackGuaranteeScope: boolean
  ackExpiration: boolean
  ackScopeReview: boolean
  ackTerms: boolean
  marketingPermission: boolean
}

/**
 * Persisted draft session returned by POST /api/human-polish/draft (create) and
 * refreshed by POST /api/human-polish/draft/recover. The plaintext draftToken is
 * returned by the server exactly once and stored client-side to support recovery.
 */
export interface DraftSession {
  requestId: string
  draftToken: string
  family: HumanPolishServiceFamily
  package: HumanPolishPackage
  /** ISO timestamp; draft recovery expires after this. */
  expiresAt: string
  standardAmountCents: number | null
  currency: string
  deliveryTarget: string | null
  firstBatchSize: number | null
  promotionType: string
  status: string
}

/** A file registered against the draft via the sign → upload → complete flow. */
export interface UploadedFile {
  fileId: string
  fileType: HumanPolishFileType
  originalFilename: string
  mimeType: string
  sizeBytes: number
  objectPath: string
}

/** A file the user selected but that has not yet completed the upload flow. */
export interface PendingUpload {
  localId: string
  fileType: HumanPolishFileType
  filename: string
  sizeBytes: number
  status: "queued" | "signing" | "uploading" | "registering" | "done" | "error"
  error?: string
}

export type IntakeErrors = Partial<Record<keyof IntakeFormData | "form", string>>

export interface StepComponentProps {
  form: IntakeFormData
  update: (patch: Partial<IntakeFormData>) => void
  errors: IntakeErrors
  family: HumanPolishServiceFamily
  pkg: HumanPolishPackage
  session: DraftSession | null
}

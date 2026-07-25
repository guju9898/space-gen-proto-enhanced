/**
 * Human Polish™ intake — client-side validation.
 *
 * Mirrors the server limits from lib/human-polish/config so users get fast
 * feedback, but the server (upload sign/complete, draft, and the eventual
 * checkout route) remains the sole authority. Nothing here is trusted for
 * pricing, discounts, rush approval, or storage acceptance.
 */

import {
  HUMAN_POLISH_ALLOWED_EXTENSIONS,
  HUMAN_POLISH_ALLOWED_MIME_TYPES,
  HUMAN_POLISH_MAX_BYTES_PER_FILE,
  HUMAN_POLISH_MAX_BYTES_PER_REQUEST,
  HUMAN_POLISH_MAX_FILES_PER_REQUEST,
} from "@/lib/human-polish/config"
import type { HumanPolishServiceFamily } from "@/lib/human-polish/types"
import type { IntakeErrors, IntakeFormData } from "./intakeTypes"
import type { IntakeStepId } from "./intakeConfig"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Loose client check only; server (lib/human-polish/phone.ts) is authoritative.
const PHONE_RE = /[0-9]/g

export function isLikelyEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function isLikelyPhone(value: string): boolean {
  const digits = value.match(PHONE_RE)?.length ?? 0
  return digits >= 7 && digits <= 15
}

export function extensionOf(filename: string): string | null {
  const parts = filename.toLowerCase().split(".")
  if (parts.length < 2) return null
  return parts[parts.length - 1] ?? null
}

export interface FileCheckResult {
  ok: boolean
  error?: string
}

/**
 * Fast pre-flight check before requesting a signed URL. The server re-validates
 * MIME/extension/size and enforces the authoritative quotas.
 */
export function checkFileForUpload(
  file: File,
  existingBytes: number,
  existingCount: number,
): FileCheckResult {
  if (existingCount >= HUMAN_POLISH_MAX_FILES_PER_REQUEST) {
    return { ok: false, error: `You can upload up to ${HUMAN_POLISH_MAX_FILES_PER_REQUEST} files.` }
  }
  if (!(HUMAN_POLISH_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, and PDF files are allowed." }
  }
  const ext = extensionOf(file.name)
  if (!ext || !(HUMAN_POLISH_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, error: "File extension must be .jpg, .jpeg, .png, or .pdf." }
  }
  if (file.size <= 0) {
    return { ok: false, error: "File appears to be empty." }
  }
  if (file.size > HUMAN_POLISH_MAX_BYTES_PER_FILE) {
    return { ok: false, error: "Each file must be 25 MB or smaller." }
  }
  if (existingBytes + file.size > HUMAN_POLISH_MAX_BYTES_PER_REQUEST) {
    return { ok: false, error: "Total uploads for this request cannot exceed 250 MB." }
  }
  return { ok: true }
}

/**
 * Per-step validation. Returns field-keyed errors; empty object means the step
 * may advance. Build-Ready and AI Render Pack differ on a few required fields.
 */
export function validateStep(
  step: IntakeStepId,
  form: IntakeFormData,
  family: HumanPolishServiceFamily,
  uploadedCount: number,
): IntakeErrors {
  const errors: IntakeErrors = {}

  if (step === "contact") {
    if (!form.contactName.trim()) errors.contactName = "Full name is required."
    if (!form.contactEmail.trim()) errors.contactEmail = "Email is required."
    else if (!isLikelyEmail(form.contactEmail)) errors.contactEmail = "Enter a valid email address."
    if (!form.contactPhone.trim()) errors.contactPhone = "Phone number is required."
    else if (!isLikelyPhone(form.contactPhone))
      errors.contactPhone = "Enter a valid phone number (7–15 digits)."
    if (!form.companyName.trim()) errors.companyName = "Company name is required."
    if (!form.customerRole) errors.customerRole = "Select your role."
    if (!form.preferredContactMethod)
      errors.preferredContactMethod = "Choose a preferred contact method."
  }

  if (step === "project") {
    if (!form.projectType) errors.projectType = "Select a project type."
    if (!form.projectName.trim()) errors.projectName = "Project name is required."
    if (!form.projectCity.trim() && !form.projectAddress.trim())
      errors.projectCity = "Provide at least a city and state (or address)."
    if (!form.briefText.trim()) errors.briefText = "A short project description is required."
  }

  if (step === "scope") {
    if (!form.onePropertyConfirmed)
      errors.onePropertyConfirmed = "Please confirm this is for one property."
  }

  if (step === "upload") {
    // Build-Ready requires supporting materials; AI Render Packs strongly
    // encourage at least one reference so the brief can be interpreted.
    if (uploadedCount < 1) {
      errors.form =
        family === "build-ready"
          ? "Build-Ready requires a survey, site photos, and an inspiration/approved concept."
          : "Please upload at least one site photo or reference so we can start the brief."
    }
  }

  if (step === "interview") {
    if (!form.designObjectives.trim())
      errors.designObjectives = "Describe what the client wants this space to become."
    if (!form.mustHaveElements.trim())
      errors.mustHaveElements = "List the elements that must appear in every concept."
  }

  if (step === "acknowledgments") {
    if (!form.ackPermission) errors.ackPermission = "Required."
    if (!form.ackConceptual) errors.ackConceptual = "Required."
    if (!form.ackDeliveryClock) errors.ackDeliveryClock = "Required."
    if (family === "ai-render-pack") {
      if (!form.ackGuaranteeScope) errors.ackGuaranteeScope = "Required."
      if (!form.ackExpiration) errors.ackExpiration = "Required."
    }
    if (family === "build-ready") {
      if (!form.ackScopeReview) errors.ackScopeReview = "Required."
    }
    if (!form.ackTerms) errors.ackTerms = "Required."
  }

  return errors
}

/**
 * Pure operational guards for Human Polish Phase 6B Admin actions.
 * Kept free of DB/IO so node:test can cover them without Production access.
 */

import { isAiRenderPackPackage } from "./types"

export type RushApproveInput = {
  paymentStatus: string
  requestedPackage: string
  rushRequested: boolean
  rushApproved: boolean
}

export type RushApproveDecision =
  | { ok: true }
  | { ok: false; error: string }

export function evaluateRushApprove(input: RushApproveInput): RushApproveDecision {
  if (!input.rushRequested) {
    return { ok: false, error: "Rush was not requested." }
  }
  if (input.rushApproved) {
    return { ok: false, error: "Rush is already approved." }
  }
  if (input.paymentStatus === "paid") {
    return {
      ok: false,
      error: "Rush approval must occur before payment so the rush fee can be collected.",
    }
  }
  if (input.requestedPackage === "100") {
    return {
      ok: false,
      error: "100-concept expedited delivery requires manual custom review.",
    }
  }
  if (input.requestedPackage !== "25" && input.requestedPackage !== "50") {
    return {
      ok: false,
      error: "100-concept expedited delivery requires manual custom review.",
    }
  }
  if (!isAiRenderPackPackage(input.requestedPackage)) {
    return {
      ok: false,
      error: "100-concept expedited delivery requires manual custom review.",
    }
  }
  return { ok: true }
}

/** UI helper: whether the normal Approve Rush control should be offered. */
export function isFixedRushApproveAvailable(input: {
  paymentStatus: string
  requestedPackage: string
  rushRequested: boolean
  rushApproved: boolean
}): boolean {
  if (!input.rushRequested || input.rushApproved) return false
  if (input.paymentStatus === "paid") return false
  if (input.requestedPackage === "100") return false
  return input.requestedPackage === "25" || input.requestedPackage === "50"
}

export type BriefMatchInput = {
  family: string
  paymentStatus: string
  status: string
  revisionCount: number
  note: string
}

export type BriefMatchDecision =
  | { ok: true; sanitizedNote: string }
  | { ok: false; error: string }

export function evaluateBriefMatchCorrection(
  input: BriefMatchInput,
  sanitize: (raw: string, max: number) => string
): BriefMatchDecision {
  if (input.family !== "ai-render-pack") {
    return { ok: false, error: "Brief-Match correction applies only to AI Render Packs." }
  }
  if (input.paymentStatus !== "paid") {
    return { ok: false, error: "Payment must be complete before this production action." }
  }
  if (input.status !== "first_batch_delivered") {
    return {
      ok: false,
      error: "Brief-Match correction is only available after first-batch delivery.",
    }
  }
  if (input.revisionCount >= 1) {
    return {
      ok: false,
      error: "The included First-Batch Brief-Match correction has already been used.",
    }
  }
  const note = sanitize(input.note, 2000)
  if (!note) {
    return { ok: false, error: "A correction note is required." }
  }
  return { ok: true, sanitizedNote: note }
}

export function canMarkCompletedFromStatus(status: string): boolean {
  return status === "delivered"
}

export type ReplacementAccessRow = {
  id: string
  family: string
  payment_status: string
  status: string
  replacement_upload_token_hash: string | null
  replacement_upload_expires_at: string | null
}

export type ReplacementAccessDecision =
  | { ok: true }
  | { ok: false; status: number; error: string; code?: "replacement_expired" }

/**
 * Evaluate whether a provided token hash unlocks replacement uploads.
 * Does not perform DB I/O. Caller supplies the hash of the presented token.
 */
export function evaluateReplacementUploadAccess(input: {
  row: ReplacementAccessRow | null
  providedHash: string
  nowMs?: number
  hashesEqual: (a: string, b: string) => boolean
}): ReplacementAccessDecision {
  const { row, providedHash, hashesEqual } = input
  const nowMs = input.nowMs ?? Date.now()

  // Uniform messaging — do not reveal whether a request id exists.
  const deny = (
    status: number,
    error = "This upload link is invalid or has expired.",
    code?: "replacement_expired"
  ): ReplacementAccessDecision => ({ ok: false, status, error, ...(code ? { code } : {}) })

  if (!row) return deny(403)
  if (!row.replacement_upload_token_hash || !row.replacement_upload_expires_at) {
    return deny(403)
  }

  const expiresAt = Date.parse(row.replacement_upload_expires_at)
  if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
    return deny(410, "This upload link is invalid or has expired.", "replacement_expired")
  }

  if (!hashesEqual(providedHash, row.replacement_upload_token_hash)) {
    return deny(403)
  }

  if (row.status !== "needs_information") return deny(403)

  if (row.family === "ai-render-pack") {
    // Phase 6B: AI replacement uploads require paid + needs_information.
    if (row.payment_status !== "paid") return deny(403)
    return { ok: true }
  }

  if (row.family === "build-ready") {
    // Phase 7B: Build-Ready may request files before or after payment.
    if (
      row.payment_status === "refunded" ||
      row.payment_status === "cancelled"
    ) {
      return deny(403)
    }
    return { ok: true }
  }

  return deny(403)
}

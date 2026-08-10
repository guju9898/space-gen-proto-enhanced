/**
 * Pure Build-Ready Phase 7B guards — no DB/IO (node:test friendly).
 */

import { BUILD_READY_REVISION_ROUNDS, BUILD_READY_STANDARD_PRICES_CENTS } from "./config"
import {
  isBuildReadyPackage,
  type BuildReadyPackage,
  type HumanPolishPackage,
} from "./types"

export type BuildReadyApprovePackage = Exclude<BuildReadyPackage, never>

export type BuildReadyApprovalDecision =
  | {
      ok: true
      approvedPackage: BuildReadyPackage
      approvedAmountCents: number
      sanitizedReviewerMessage: string | null
      sanitizedInternalNotes: string | null
    }
  | { ok: false; error: string }

const APPROVAL_STATUSES = new Set([
  "submitted",
  "under_review",
  "needs_information",
  "ready_for_payment",
])

/**
 * Parse a customer/admin dollar string into integer USD cents.
 * Accepts whole dollars or up to 2 decimal places only.
 */
export function parseUsdDollarsToCents(raw: unknown):
  | { ok: true; cents: number }
  | { ok: false; error: string } {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return { ok: false, error: "A custom amount is required." }
  }
  const text =
    typeof raw === "number"
      ? Number.isFinite(raw)
        ? String(raw)
        : ""
      : raw.trim()
  if (!text) return { ok: false, error: "A custom amount is required." }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return {
      ok: false,
      error: "Enter a valid dollar amount with up to two decimal places.",
    }
  }
  const [wholePart, fracPart = ""] = text.split(".")
  const whole = Number(wholePart)
  if (!Number.isSafeInteger(whole) || whole < 0) {
    return { ok: false, error: "Enter a valid dollar amount." }
  }
  const frac = Number((fracPart + "00").slice(0, 2))
  if (!Number.isSafeInteger(frac) || frac < 0 || frac > 99) {
    return { ok: false, error: "Enter a valid dollar amount." }
  }
  const cents = whole * 100 + frac
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return { ok: false, error: "Custom amount must be greater than zero." }
  }
  return { ok: true, cents }
}

/** Validate already-integer cents from a trusted server path. */
export function validatePositiveCents(raw: unknown):
  | { ok: true; cents: number }
  | { ok: false; error: string } {
  if (typeof raw !== "number" || !Number.isFinite(raw) || !Number.isSafeInteger(raw)) {
    return { ok: false, error: "Approved amount must be a whole number of cents." }
  }
  if (raw <= 0) {
    return { ok: false, error: "Approved amount must be greater than zero." }
  }
  return { ok: true, cents: raw }
}

export function evaluateBuildReadyApproval(input: {
  family: string
  paymentStatus: string
  status: string
  approvedPackage: unknown
  /** Required for custom; ignored for essentials (server uses config). */
  customAmountDollars?: unknown
  reviewerMessage?: unknown
  internalReviewNotes?: unknown
  hasOpenCheckoutSession?: boolean
  sanitize: (raw: string, max: number) => string
}): BuildReadyApprovalDecision {
  if (input.family !== "build-ready") {
    return { ok: false, error: "Scope approval applies only to Build-Ready requests." }
  }
  if (input.paymentStatus === "paid") {
    return { ok: false, error: "Paid requests cannot be re-approved." }
  }
  if (!APPROVAL_STATUSES.has(input.status)) {
    return {
      ok: false,
      error: "Build-Ready approval is not available in the current status.",
    }
  }
  if (input.hasOpenCheckoutSession) {
    return {
      ok: false,
      error: "Revoke the current payment request before changing approval.",
    }
  }
  if (!isBuildReadyPackage(input.approvedPackage)) {
    return { ok: false, error: "Select a valid Build-Ready package to approve." }
  }
  const approvedPackage = input.approvedPackage

  let approvedAmountCents: number
  if (approvedPackage === "essentials-2d" || approvedPackage === "essentials-3d") {
    approvedAmountCents = BUILD_READY_STANDARD_PRICES_CENTS[approvedPackage]
  } else {
    const parsed = parseUsdDollarsToCents(input.customAmountDollars)
    if (!parsed.ok) return parsed
    approvedAmountCents = parsed.cents
  }

  const reviewerMessage = input.sanitize(
    typeof input.reviewerMessage === "string" ? input.reviewerMessage : "",
    2000
  )
  const internalNotes = input.sanitize(
    typeof input.internalReviewNotes === "string" ? input.internalReviewNotes : "",
    4000
  )

  return {
    ok: true,
    approvedPackage,
    approvedAmountCents,
    sanitizedReviewerMessage: reviewerMessage || null,
    sanitizedInternalNotes: internalNotes || null,
  }
}

export function evaluateBuildReadyPaymentRequest(input: {
  family: string
  paymentStatus: string
  status: string
  approvedPackage: string | null
  approvedAmount: number | null
  scopeReviewedAt: string | null
}): { ok: true } | { ok: false; error: string } {
  if (input.family !== "build-ready") {
    return { ok: false, error: "Payment requests apply only to Build-Ready." }
  }
  if (input.paymentStatus === "paid") {
    return { ok: false, error: "This request is already paid." }
  }
  if (input.status !== "ready_for_payment") {
    return {
      ok: false,
      error: "Approve scope before sending a payment request.",
    }
  }
  if (!isBuildReadyPackage(input.approvedPackage)) {
    return { ok: false, error: "Approved package is missing." }
  }
  const amount = validatePositiveCents(input.approvedAmount)
  if (!amount.ok) return amount
  if (!input.scopeReviewedAt) {
    return { ok: false, error: "Scope review timestamp is missing." }
  }
  return { ok: true }
}

export type BuildReadyPaymentAccessRow = {
  id: string
  family: string
  payment_status: string
  status: string
  approved_package: string | null
  approved_amount: number | null
  payment_request_id: string | null
  build_ready_payment_token_hash: string | null
  build_ready_payment_expires_at: string | null
}

export type BuildReadyPaymentAccessDecision =
  | { ok: true }
  | { ok: false; status: number; error: string; code?: "payment_expired" }

export function evaluateBuildReadyPaymentAccess(input: {
  row: BuildReadyPaymentAccessRow | null
  providedHash: string
  nowMs?: number
  hashesEqual: (a: string, b: string) => boolean
}): BuildReadyPaymentAccessDecision {
  const { row, providedHash, hashesEqual } = input
  const nowMs = input.nowMs ?? Date.now()
  const deny = (
    status: number,
    error = "This payment link is invalid or has expired.",
    code?: "payment_expired"
  ): BuildReadyPaymentAccessDecision => ({
    ok: false,
    status,
    error,
    ...(code ? { code } : {}),
  })

  if (!row) return deny(403)
  if (!row.build_ready_payment_token_hash || !row.build_ready_payment_expires_at) {
    return deny(403)
  }

  const expiresAt = Date.parse(row.build_ready_payment_expires_at)
  if (!Number.isFinite(expiresAt) || expiresAt <= nowMs) {
    return deny(410, "This payment link is invalid or has expired.", "payment_expired")
  }
  if (!hashesEqual(providedHash, row.build_ready_payment_token_hash)) {
    return deny(403)
  }
  if (row.family !== "build-ready") return deny(403)
  if (row.payment_status === "paid") return deny(403)
  if (!row.payment_request_id) return deny(403)
  if (!isBuildReadyPackage(row.approved_package)) return deny(403)
  const amount = validatePositiveCents(row.approved_amount)
  if (!amount.ok) return deny(403)
  if (row.status !== "ready_for_payment" && row.status !== "awaiting_payment") {
    return deny(403)
  }
  return { ok: true }
}

export type BuildReadyWebhookGuardInput = {
  family: string
  paymentStatus: string
  status: string
  approvedPackage: string | null
  approvedAmountCents: number | null
  paymentRequestId: string | null
  storedCheckoutSessionId: string | null
  metadata: {
    productType?: string | null
    family?: string | null
    requestId?: string | null
    paymentRequestId?: string | null
    approvedPackage?: string | null
  }
  eventRequestId: string
  eventCheckoutSessionId?: string | null
  amountTotalCents: number | null
  currency: string | null
  stripePaid: boolean
}

export type BuildReadyWebhookGuardDecision =
  | { ok: true }
  | { ok: false; error: string }

export function evaluateBuildReadyWebhookPaid(
  input: BuildReadyWebhookGuardInput
): BuildReadyWebhookGuardDecision {
  if (input.metadata.productType !== "human_polish") {
    return { ok: false, error: "Not a Human Polish payment." }
  }
  if (input.family !== "build-ready" || input.metadata.family !== "build-ready") {
    return { ok: false, error: "Build-Ready family mismatch." }
  }
  if (input.eventRequestId !== input.metadata.requestId) {
    return { ok: false, error: "Request id mismatch." }
  }
  if (input.paymentStatus === "paid") {
    return { ok: false, error: "Already paid." }
  }
  if (input.status !== "awaiting_payment") {
    return { ok: false, error: "Unexpected status for paid reconciliation." }
  }
  if (!input.stripePaid) {
    return { ok: false, error: "Stripe payment is not complete." }
  }
  if (
    input.eventCheckoutSessionId &&
    input.storedCheckoutSessionId &&
    input.eventCheckoutSessionId !== input.storedCheckoutSessionId
  ) {
    return { ok: false, error: "Checkout session mismatch." }
  }
  if (
    !input.paymentRequestId ||
    input.metadata.paymentRequestId !== input.paymentRequestId
  ) {
    return { ok: false, error: "Payment request version mismatch." }
  }
  if (
    !input.approvedPackage ||
    input.metadata.approvedPackage !== input.approvedPackage
  ) {
    return { ok: false, error: "Approved package mismatch." }
  }
  const approved = validatePositiveCents(input.approvedAmountCents)
  if (!approved.ok) {
    return { ok: false, error: "Approved amount missing." }
  }
  if (input.amountTotalCents !== approved.cents) {
    return { ok: false, error: "Paid amount does not match approved amount." }
  }
  if ((input.currency || "").toLowerCase() !== "usd") {
    return { ok: false, error: "Unexpected currency." }
  }
  return { ok: true }
}

export function getBuildReadyRevisionLimit(
  approvedPackage: string | null
): number | null {
  if (approvedPackage === "essentials-2d" || approvedPackage === "essentials-3d") {
    return BUILD_READY_REVISION_ROUNDS[approvedPackage]
  }
  return null
}

export function evaluateBuildReadyRevision(input: {
  family: string
  paymentStatus: string
  status: string
  approvedPackage: string | null
  revisionCount: number
  note: string
  sanitize: (raw: string, max: number) => string
}):
  | { ok: true; nextCount: number; sanitizedNote: string; maxRounds: number }
  | { ok: false; error: string } {
  if (input.family !== "build-ready") {
    return { ok: false, error: "Build-Ready revision applies only to Build-Ready." }
  }
  if (input.paymentStatus !== "paid") {
    return { ok: false, error: "Payment must be complete before recording a revision." }
  }
  if (input.status !== "delivered") {
    return {
      ok: false,
      error: "Build-Ready revisions are recorded from delivered status.",
    }
  }
  const max = getBuildReadyRevisionLimit(input.approvedPackage)
  if (max == null) {
    return {
      ok: false,
      error: "Custom revision terms apply — use an internal note instead of this control.",
    }
  }
  if (input.revisionCount >= max) {
    return {
      ok: false,
      error: `All ${max} included Build-Ready revision rounds have been used.`,
    }
  }
  const note = input.sanitize(input.note, 2000)
  if (!note) return { ok: false, error: "A revision note is required." }
  return {
    ok: true,
    nextCount: input.revisionCount + 1,
    sanitizedNote: note,
    maxRounds: max,
  }
}

/** Line-item label helper for approved Build-Ready Checkout. */
export function buildReadyApprovedLineLabel(pkg: HumanPolishPackage): string {
  const labels: Record<string, string> = {
    "essentials-2d": "Build-Ready Packages — Essentials 2D",
    "essentials-3d": "Build-Ready Packages — Essentials 3D",
    custom: "Build-Ready Packages — Custom",
  }
  return labels[pkg] || `Build-Ready Packages — ${pkg}`
}

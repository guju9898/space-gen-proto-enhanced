import { MAX_COMMISSION_BPS } from "@/lib/affiliates/config"

const QUALIFYING_REASONS = new Set([
  "subscription_create",
  "subscription_cycle",
  "subscription_update",
])

export type CommissionSkipReason =
  | "program_inactive"
  | "self_referral"
  | "outside_window"
  | "unpaid"
  | "not_subscription"
  | "unsupported_currency"
  | "zero_basis"
  | "duplicate"
  | "invalid_rate"
  | "missing_attribution"

export type CommissionDecision = {
  action: "earn" | "skip"
  reason: CommissionSkipReason | "ok"
  basisCents: number
  amountCents: number
  commissionBps: number
}

export function qualifyingBasisCents(amountPaidCents: number, taxCents: number): number {
  if (!Number.isFinite(amountPaidCents) || amountPaidCents <= 0) return 0
  const tax = Number.isFinite(taxCents) && taxCents > 0 ? taxCents : 0
  return Math.max(0, Math.floor(amountPaidCents) - Math.floor(tax))
}

/**
 * When Stripe reports a pre-tax total, scale the collected amount by that
 * share so a partial payment does not treat the whole tax as unpaid revenue.
 */
export function basisFromInvoiceTotals(input: {
  amountPaidCents: number
  totalCents: number | null
  totalExcludingTaxCents: number | null
}): { basisCents: number; taxCents: number } {
  const paid = Math.max(0, Math.floor(input.amountPaidCents))
  const total = input.totalCents
  const exTax = input.totalExcludingTaxCents
  if (paid === 0) return { basisCents: 0, taxCents: 0 }
  if (total === null || exTax === null || total <= 0) {
    return { basisCents: paid, taxCents: 0 }
  }
  const tax = Math.max(0, total - exTax)
  const basis = Math.min(paid, Math.floor((paid * exTax) / total))
  return { basisCents: Math.max(0, basis), taxCents: tax }
}

export function commissionAmountCents(basisCents: number, commissionBps: number, maxBps: number): number {
  const cap = Math.min(MAX_COMMISSION_BPS, Math.max(0, Math.floor(maxBps)))
  const rate = Math.floor(commissionBps)
  if (rate < 0 || rate > cap || basisCents <= 0) return 0
  return Math.floor((basisCents * rate) / 10_000)
}

export function commissionEndsAt(firstPaidAt: Date, windowDays: number): Date {
  return new Date(firstPaidAt.getTime() + windowDays * 24 * 60 * 60 * 1000)
}

export function decideCommission(input: {
  programActive: boolean
  selfReferral: boolean
  hasAttribution: boolean
  paidAt: Date
  commissionEndsAt: Date | null
  billingReason: string | null
  currency: string
  amountPaidCents: number
  taxCents: number
  commissionBps: number
  maxBps: number
  duplicateInvoice: boolean
}): CommissionDecision {
  const basisCents = qualifyingBasisCents(input.amountPaidCents, input.taxCents)
  const empty = {
    action: "skip" as const,
    basisCents,
    amountCents: 0,
    commissionBps: 0,
  }
  if (!input.programActive) return { ...empty, reason: "program_inactive" }
  if (!input.hasAttribution) return { ...empty, reason: "missing_attribution" }
  if (input.selfReferral) return { ...empty, reason: "self_referral" }
  if (input.duplicateInvoice) return { ...empty, reason: "duplicate" }
  if (input.currency.toLowerCase() !== "usd") return { ...empty, reason: "unsupported_currency" }
  if (!input.billingReason || !QUALIFYING_REASONS.has(input.billingReason)) {
    return { ...empty, reason: "not_subscription" }
  }
  if (input.amountPaidCents <= 0) return { ...empty, reason: "unpaid" }
  if (input.commissionEndsAt && input.paidAt.getTime() >= input.commissionEndsAt.getTime()) {
    return { ...empty, reason: "outside_window" }
  }
  const rate = Math.floor(input.commissionBps)
  const cap = Math.min(MAX_COMMISSION_BPS, Math.max(0, Math.floor(input.maxBps)))
  if (rate < 0 || rate > cap) return { ...empty, reason: "invalid_rate" }
  if (basisCents <= 0) return { ...empty, reason: "zero_basis" }
  return {
    action: "earn",
    reason: "ok",
    basisCents,
    amountCents: commissionAmountCents(basisCents, rate, cap),
    commissionBps: rate,
  }
}

export function reversalAmountCents(input: {
  originalAmountCents: number
  alreadyReversedCents: number
  amountPaidCents: number
  amountRefundedCents: number
}): number {
  const original = Math.max(0, Math.floor(input.originalAmountCents))
  const already = Math.max(0, Math.floor(input.alreadyReversedCents))
  const remaining = Math.max(0, original - already)
  if (remaining === 0 || input.amountPaidCents <= 0 || input.amountRefundedCents <= 0) return 0
  if (input.amountRefundedCents >= input.amountPaidCents) return remaining
  const target = Math.floor((original * input.amountRefundedCents) / input.amountPaidCents)
  return Math.max(0, Math.min(remaining, target - already))
}

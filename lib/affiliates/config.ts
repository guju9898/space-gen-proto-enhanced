/**
 * Affiliate program switches.
 *
 * Commissions and referral discounts stay off unless both are true:
 * - AFFILIATES_ENABLED is exactly "true"
 * - affiliate_program_config.status is "active"
 *
 * The customer discount also needs AFFILIATE_CUSTOMER_COUPON to be an
 * existing Stripe coupon id. This module never creates a coupon.
 */

export const MAX_COMMISSION_BPS = 2500
export const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 30
export const DEFAULT_COMMISSION_WINDOW_DAYS = 365
export const DEFAULT_HOLD_DAYS = 30

export const AFFILIATE_COOKIE = "rs_aff"
export const AFFILIATE_VISITOR_COOKIE = "rs_aff_vid"

export type ProgramStatus = "draft" | "active" | "paused"

export type AffiliateProgramConfig = {
  status: ProgramStatus
  maxCommissionBps: number
  attributionWindowDays: number
  commissionWindowDays: number
  holdDays: number
  customerDiscountPercent: number
}

export const PROPOSED_PROGRAM: AffiliateProgramConfig = {
  status: "draft",
  maxCommissionBps: MAX_COMMISSION_BPS,
  attributionWindowDays: DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  commissionWindowDays: DEFAULT_COMMISSION_WINDOW_DAYS,
  holdDays: DEFAULT_HOLD_DAYS,
  customerDiscountPercent: 0,
}

export function affiliatesEnabled(
  raw: string | undefined | null = process.env.AFFILIATES_ENABLED
): boolean {
  return raw === "true"
}

export function programIsLive(
  config: AffiliateProgramConfig | null,
  enabled: boolean = affiliatesEnabled()
): boolean {
  return enabled && config?.status === "active"
}

export function readCustomerCouponId(
  raw: string | undefined | null = process.env.AFFILIATE_CUSTOMER_COUPON
): string | null {
  if (typeof raw !== "string") return null
  const id = raw.trim()
  return id.startsWith("coupon_") ? id : null
}

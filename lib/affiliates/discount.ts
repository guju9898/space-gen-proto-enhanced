import type { PromoDecision } from "@/lib/pricing/promotions"

export type ReferralDiscountDecision = {
  apply: boolean
  reason:
    | "ok"
    | "program_inactive"
    | "no_attribution"
    | "self_referral"
    | "human_polish"
    | "stacks_with_promotion"
    | "discount_not_approved"
    | "missing_coupon"
}

/**
 * Group 3 owns promotion amounts. A referral discount is a separate coupon
 * and never stacks with an eligible pricing campaign or Human Polish.
 * A zero configured percent means the offer is not approved.
 */
export function decideReferralDiscount(input: {
  programActive: boolean
  hasAttribution: boolean
  selfReferral: boolean
  surface: "subscription" | "human_polish"
  customerDiscountPercent: number
  couponConfigured: boolean
  promotion: PromoDecision | null
}): ReferralDiscountDecision {
  if (input.surface === "human_polish") return { apply: false, reason: "human_polish" }
  if (!input.programActive) return { apply: false, reason: "program_inactive" }
  if (!input.hasAttribution) return { apply: false, reason: "no_attribution" }
  if (input.selfReferral) return { apply: false, reason: "self_referral" }
  if (input.promotion?.eligible) return { apply: false, reason: "stacks_with_promotion" }
  if (input.customerDiscountPercent <= 0 || input.customerDiscountPercent > 25) {
    return { apply: false, reason: "discount_not_approved" }
  }
  if (!input.couponConfigured) return { apply: false, reason: "missing_coupon" }
  return { apply: true, reason: "ok" }
}

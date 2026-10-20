import type { BillingInterval, PlanCode } from "@/lib/pricing/catalog"

export type PromoDuration = "once" | "repeating" | "forever"

export type PricingCampaign = {
  id: string
  planCodes: readonly PlanCode[]
  intervals: readonly BillingInterval[]
  percentOff: number | null
  amountOffCents: number | null
  /** once = first invoice only. forever is rejected unless explicitly configured. */
  duration: PromoDuration
  startsAt: string
  endsAt: string
  maxRedemptions: number | null
  /** Stripe Coupon ID. The client never supplies this. */
  stripeCouponEnv: string | null
  enabled: boolean
  stacksWithHumanPolish: false
  stacksWithAffiliate: false
}

/**
 * Candidate experiments. Every campaign stays disabled until a Stripe coupon
 * exists and the business turns `enabled` on. Dates are real, not a reset timer.
 */
export const PRICING_CAMPAIGNS: readonly PricingCampaign[] = [
  {
    id: "candidate-initial-20",
    planCodes: ["professional", "business"],
    intervals: ["month"],
    percentOff: 20,
    amountOffCents: null,
    duration: "once",
    startsAt: "2026-11-01T00:00:00.000Z",
    endsAt: "2026-11-08T00:00:00.000Z",
    maxRedemptions: 100,
    stripeCouponEnv: null,
    enabled: false,
    stacksWithHumanPolish: false,
    stacksWithAffiliate: false,
  },
  {
    id: "candidate-annual-signup",
    planCodes: ["professional", "business"],
    intervals: ["year"],
    percentOff: 15,
    amountOffCents: null,
    duration: "once",
    startsAt: "2026-11-01T00:00:00.000Z",
    endsAt: "2026-11-15T00:00:00.000Z",
    maxRedemptions: 50,
    stripeCouponEnv: null,
    enabled: false,
    stacksWithHumanPolish: false,
    stacksWithAffiliate: false,
  },
]

export type PromoDecision = {
  eligible: boolean
  campaignId: string | null
  reason:
    | "ok"
    | "unknown"
    | "disabled"
    | "outside_window"
    | "plan_mismatch"
    | "interval_mismatch"
    | "redemption_limit"
    | "human_polish_stack"
    | "affiliate_stack"
    | "forever_blocked"
    | "missing_coupon"
}

export function findCampaign(id: string | null | undefined): PricingCampaign | null {
  if (!id || !/^[a-z0-9-]{3,40}$/.test(id)) return null
  return PRICING_CAMPAIGNS.find((campaign) => campaign.id === id) ?? null
}

export function decideCampaign(
  campaign: PricingCampaign,
  input: {
    plan: PlanCode
    interval: BillingInterval
    now: Date
    redeemedCount: number
    surface: "subscription" | "human_polish"
    hasAffiliate: boolean
    couponConfigured: boolean
  }
): PromoDecision {
  if (!campaign.enabled) return { eligible: false, campaignId: campaign.id, reason: "disabled" }
  if (campaign.duration === "forever") return { eligible: false, campaignId: campaign.id, reason: "forever_blocked" }
  if (input.surface === "human_polish" || campaign.stacksWithHumanPolish) {
    return { eligible: false, campaignId: campaign.id, reason: "human_polish_stack" }
  }
  if (input.hasAffiliate || campaign.stacksWithAffiliate) {
    return { eligible: false, campaignId: campaign.id, reason: "affiliate_stack" }
  }
  const start = Date.parse(campaign.startsAt)
  const end = Date.parse(campaign.endsAt)
  const now = input.now.getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || now < start || now >= end) {
    return { eligible: false, campaignId: campaign.id, reason: "outside_window" }
  }
  if (!campaign.planCodes.includes(input.plan)) {
    return { eligible: false, campaignId: campaign.id, reason: "plan_mismatch" }
  }
  if (!campaign.intervals.includes(input.interval)) {
    return { eligible: false, campaignId: campaign.id, reason: "interval_mismatch" }
  }
  if (campaign.maxRedemptions !== null && input.redeemedCount >= campaign.maxRedemptions) {
    return { eligible: false, campaignId: campaign.id, reason: "redemption_limit" }
  }
  if (!input.couponConfigured || !campaign.stripeCouponEnv) {
    return { eligible: false, campaignId: campaign.id, reason: "missing_coupon" }
  }
  return { eligible: true, campaignId: campaign.id, reason: "ok" }
}

export function evaluatePromotion(input: {
  campaignId: string | null | undefined
  plan: PlanCode
  interval: BillingInterval
  now: Date
  redeemedCount: number
  surface: "subscription" | "human_polish"
  hasAffiliate: boolean
  couponConfigured: boolean
}): PromoDecision {
  const campaign = findCampaign(input.campaignId)
  if (!campaign) return { eligible: false, campaignId: null, reason: "unknown" }
  return decideCampaign(campaign, input)
}

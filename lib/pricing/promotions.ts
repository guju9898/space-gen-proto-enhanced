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
 * Campaigns. Black Friday is enabled for checkout when its Stripe coupon env is set;
 * site advertising is gated separately by NEXT_PUBLIC_PROMO_BLACK_FRIDAY_2026=on.
 * Dates are real end times (America/Chicago end of Nov 30 = 2026-12-01T06:00:00Z).
 */
export const PRICING_CAMPAIGNS: readonly PricingCampaign[] = [
  {
    id: "black-friday-2026",
    planCodes: ["intro"],
    intervals: ["week"],
    percentOff: null,
    amountOffCents: 999,
    duration: "once",
    startsAt: "2026-11-12T06:00:00.000Z",
    endsAt: "2026-12-01T06:00:00.000Z",
    maxRedemptions: null,
    stripeCouponEnv: "STRIPE_COUPON_BLACK_FRIDAY_2026",
    enabled: true,
    stacksWithHumanPolish: false,
    stacksWithAffiliate: false,
  },
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

/** Public advertising switch for Black Friday (client + server). */
export function isBlackFridayAdvertisingOn(
  envValue = process.env.NEXT_PUBLIC_PROMO_BLACK_FRIDAY_2026
): boolean {
  return envValue === "on"
}

/**
 * `?promo_preview=1` may force the BF banner on preview/dev only.
 * Ignored when Vercel env is production (or NODE_ENV production without a preview env).
 */
export function canUsePromoPreview(env: {
  vercelEnv?: string | null
  nodeEnv?: string | null
} = {}): boolean {
  const vercel = env.vercelEnv ?? process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV
  if (vercel === "production") return false
  if (vercel === "preview" || vercel === "development") return true
  const node = env.nodeEnv ?? process.env.NODE_ENV
  return node !== "production"
}

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

/**
 * The one promotion the site may advertise for the Intro Plan right now, or null.
 * Black Friday also requires NEXT_PUBLIC_PROMO_BLACK_FRIDAY_2026=on.
 * Checkout still uses evaluatePromotion + the Stripe coupon env (separate gate).
 */
export function advertisedIntroCampaign(
  now: Date,
  campaigns: readonly PricingCampaign[] = PRICING_CAMPAIGNS,
  opts: { advertiseBlackFriday?: boolean } = {}
): PricingCampaign | null {
  const advertiseBf = opts.advertiseBlackFriday ?? isBlackFridayAdvertisingOn()
  const t = now.getTime()
  return (
    campaigns.find((c) => {
      const start = Date.parse(c.startsAt)
      const end = Date.parse(c.endsAt)
      if (c.id === "black-friday-2026" && !advertiseBf) return false
      return (
        c.enabled &&
        c.duration !== "forever" &&
        c.planCodes.includes("intro") &&
        c.stripeCouponEnv !== null &&
        (c.percentOff !== null || c.amountOffCents !== null) &&
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        t >= start &&
        t < end
      )
    }) ?? null
  )
}

/** Campaign used when `?promo_preview=1` is allowed (preview/dev only). */
export function previewIntroCampaign(
  campaigns: readonly PricingCampaign[] = PRICING_CAMPAIGNS
): PricingCampaign | null {
  return campaigns.find((c) => c.id === "black-friday-2026") ?? null
}

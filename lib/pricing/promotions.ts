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
 * Black Friday 2026: the Intro Plan's first week for $10 ($9.99 off $19.99), through
 * Nov 30, 2026 at 11:59pm Central (Dec 1 06:00 UTC). Advertised only when
 * NEXT_PUBLIC_PROMO_BLACK_FRIDAY_2026=on, and applied at checkout only when
 * STRIPE_COUPON_BLACK_FRIDAY_2026 holds the Stripe coupon id. Turn both on together.
 */
export const BLACK_FRIDAY_2026_ID = "black-friday-2026"
export const BLACK_FRIDAY_2026_FLAG = "NEXT_PUBLIC_PROMO_BLACK_FRIDAY_2026"

/** Read with a literal key so Next inlines it in the browser bundle. */
function blackFridayFlagOn(): boolean {
  return process.env.NEXT_PUBLIC_PROMO_BLACK_FRIDAY_2026 === "on"
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
  {
    id: BLACK_FRIDAY_2026_ID,
    planCodes: ["intro"],
    intervals: ["week"],
    percentOff: null,
    amountOffCents: 999,
    duration: "once",
    startsAt: "2026-11-12T06:00:00.000Z",
    endsAt: "2026-12-01T06:00:00.000Z",
    maxRedemptions: null,
    stripeCouponEnv: "STRIPE_COUPON_BLACK_FRIDAY_2026",
    enabled: blackFridayFlagOn(),
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

/**
 * The one promotion the site may advertise for the Intro Plan right now, or null.
 * Shown only when a campaign is enabled, covers the Intro Plan, names a Stripe
 * coupon, and `now` is inside its real start and end dates. No campaign → no banner.
 */
export function advertisedIntroCampaign(
  now: Date,
  campaigns: readonly PricingCampaign[] = PRICING_CAMPAIGNS
): PricingCampaign | null {
  const t = now.getTime()
  return (
    campaigns.find((c) => {
      const start = Date.parse(c.startsAt)
      const end = Date.parse(c.endsAt)
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

/**
 * Preview builds only (never production): `?promo_preview=1` shows a campaign's banner
 * as if it were switched on, so the page can be checked before the coupon exists.
 */
export function promoPreviewAllowed(search: string | null | undefined, vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV): boolean {
  return (vercelEnv === "preview" || vercelEnv === "development") && new URLSearchParams(search ?? "").get("promo_preview") === "1"
}

/** The Intro Plan campaign to show, honouring the preview switch on non-production builds. */
export function introCampaignToShow(now: Date, preview: boolean): PricingCampaign | null {
  if (!preview) return advertisedIntroCampaign(now)
  return advertisedIntroCampaign(now, PRICING_CAMPAIGNS.map((c) => ({ ...c, enabled: true })))
}

/** Price of the first charge after the campaign discount, in cents (never below zero). */
export function campaignFirstChargeCents(campaign: PricingCampaign, baseCents: number): number {
  if (campaign.amountOffCents !== null) return Math.max(0, baseCents - campaign.amountOffCents)
  if (campaign.percentOff !== null) return Math.max(0, Math.round(baseCents * (1 - campaign.percentOff / 100)))
  return baseCents
}

/** Stripe coupon ids are dashboard ids (e.g. "Z4OV52SU") or custom ids; never empty, no spaces. */
export function isStripeCouponId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{3,64}$/.test(value)
}

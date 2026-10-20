import {
  AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS,
  AI_RENDER_PACK_SUBSCRIBER_DISCOUNT_PERCENT,
} from "@/lib/human-polish/config"
import { CATALOG, moneyFromCents, type PlanCode } from "@/lib/pricing/catalog"
import { PRICING_CAMPAIGNS, decideCampaign, type PricingCampaign } from "@/lib/pricing/promotions"
import { LIFECYCLE_LIMITS } from "@/lib/offers/config"
import type { LifecycleState } from "@/lib/offers/state"

export type OfferTrigger = "generation" | "low_credits" | "repeat_usage" | "active_promotion"

export type LifecycleOffer = {
  id: string
  trigger: OfferTrigger
  headline: string
  body: string
  href: string
  cta: string
  promotionId: string | null
  plan: PlanCode | null
}

export type LifecycleFacts = {
  enabled: boolean
  workflowBusy: boolean
  plan: "none" | PlanCode
  subscriptionStatus: string | null
  successfulRenders: number
  creditsRemaining: number | null
  creditAllowance: number | null
  now: Date
  hasAffiliate: boolean
  redeemedCount: number
  /** Campaign ids whose server coupon env is a real coupon_ id. */
  couponsReady: readonly string[]
  state: LifecycleState
  /** Defaults to the live Group 3 catalog. Tests pass a copy. */
  campaigns?: readonly PricingCampaign[]
}

function usable(status: string | null): boolean {
  return status === "active" || status === "trialing"
}

function effectivePlan(facts: LifecycleFacts): "none" | PlanCode {
  if (facts.plan === "none") return "none"
  if (facts.subscriptionStatus === "past_due") return facts.plan
  if (!usable(facts.subscriptionStatus)) return "none"
  return facts.plan
}

function formatEnd(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
}

function suppressed(offer: LifecycleOffer, facts: LifecycleFacts): boolean {
  const seen = facts.state.impressions[offer.id] ?? 0
  if (seen >= LIFECYCLE_LIMITS.maxImpressions) return true
  const dismissed = facts.state.dismissedAt[offer.id]
  if (dismissed) {
    const at = Date.parse(dismissed)
    if (Number.isFinite(at) && facts.now.getTime() - at < LIFECYCLE_LIMITS.dismissCooldownMs) return true
  }
  if (
    facts.state.lastOfferId &&
    facts.state.lastOfferId !== offer.id &&
    facts.state.lastOfferAt
  ) {
    const at = Date.parse(facts.state.lastOfferAt)
    if (Number.isFinite(at) && facts.now.getTime() - at < LIFECYCLE_LIMITS.switchCooldownMs) return true
  }
  return false
}

function promotionOffer(facts: LifecycleFacts, plan: "none" | PlanCode): LifecycleOffer | null {
  if (plan === "business") return null
  for (const campaign of facts.campaigns ?? PRICING_CAMPAIGNS) {
    const target: PlanCode | null =
      plan === "professional"
        ? campaign.planCodes.includes("business")
          ? "business"
          : null
        : campaign.planCodes.includes("professional")
          ? "professional"
          : campaign.planCodes.includes("business")
            ? "business"
            : null
    if (!target) continue
    const interval = campaign.intervals[0]
    if (!interval) continue
    const decision = decideCampaign(campaign, {
      plan: target,
      interval,
      now: facts.now,
      redeemedCount: facts.redeemedCount,
      surface: "subscription",
      hasAffiliate: facts.hasAffiliate,
      couponConfigured: facts.couponsReady.includes(campaign.id),
    })
    if (!decision.eligible) continue
    const discount =
      campaign.percentOff !== null
        ? `${campaign.percentOff}% off`
        : campaign.amountOffCents !== null
          ? `${moneyFromCents(campaign.amountOffCents)} off`
          : null
    if (!discount) continue
    const params = new URLSearchParams({ plan: target, step: "3", promotion: campaign.id })
    if (interval === "year") params.set("interval", "year")
    return {
      id: `promo-${campaign.id}`,
      trigger: "active_promotion",
      headline: `${discount} ${CATALOG[target].name}`,
      body: `${discount} applies to the first ${interval === "year" ? "yearly" : "monthly"} invoice. The offer ends ${formatEnd(campaign.endsAt)}. Checkout confirms the discount.`,
      href: `/onboarding?${params.toString()}`,
      cta: `Continue with ${CATALOG[target].name}`,
      promotionId: campaign.id,
      plan: target,
    }
  }
  return null
}

function lowCreditOffer(facts: LifecycleFacts, plan: "none" | PlanCode): LifecycleOffer | null {
  if (plan !== "intro" && plan !== "professional") return null
  const allowance = facts.creditAllowance
  const remaining = facts.creditsRemaining
  if (allowance === null || allowance <= 0 || remaining === null) return null
  if (remaining / allowance > LIFECYCLE_LIMITS.lowCreditRemainingRatio) return null
  const target: PlanCode = plan === "intro" ? "professional" : "business"
  const current = CATALOG[plan]
  const next = CATALOG[target]
  return {
    id: `low-credits-${target}`,
    trigger: "low_credits",
    headline: `${remaining} credits left on ${current.name}`,
    body: `${current.name} includes ${current.credits.toLocaleString("en-US")} credits per ${current.interval}. ${next.name} includes ${next.credits.toLocaleString("en-US")} credits per ${next.interval} at ${moneyFromCents(next.amountCents)}.`,
    href: `/onboarding?plan=${target}&step=3`,
    cta: `See ${next.name}`,
    promotionId: null,
    plan: target,
  }
}

function generationOffer(facts: LifecycleFacts, plan: "none" | PlanCode): LifecycleOffer | null {
  if (plan !== "none" && plan !== "intro") return null
  if (facts.successfulRenders < LIFECYCLE_LIMITS.generationRenders) return null
  const next = CATALOG.professional
  return {
    id: "generation-subscription",
    trigger: "generation",
    headline: "Your next project is ready to visualize. Get more room to create.",
    body: `${next.name} is ${moneyFromCents(next.amountCents)} per month and includes ${next.credits.toLocaleString("en-US")} credits. No limited-time discount is active.`,
    href: "/onboarding?plan=professional&step=3",
    cta: `See ${next.name}`,
    promotionId: null,
    plan: "professional",
  }
}

function humanPolishOffer(facts: LifecycleFacts, plan: "none" | PlanCode): LifecycleOffer | null {
  if (plan !== "professional" && plan !== "business") return null
  if (facts.successfulRenders < LIFECYCLE_LIMITS.repeatRenders) return null
  const first = moneyFromCents(AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS)
  return {
    id: "repeat-human-polish",
    trigger: "repeat_usage",
    headline: "Need a client-ready presentation built around this concept?",
    body: `Human Polish is a separate service. Active ${CATALOG.professional.name} and ${CATALOG.business.name} plans can use the ${AI_RENDER_PACK_SUBSCRIBER_DISCOUNT_PERCENT}% subscriber price. It does not combine with the ${first} first-purchase 25-pack.`,
    href: "/human-polish",
    cta: "View Human Polish",
    promotionId: null,
    plan: null,
  }
}

/** Pick at most one offer. Financial discounts come only from Group 3 campaigns. */
export function selectLifecycleOffer(facts: LifecycleFacts): LifecycleOffer | null {
  if (!facts.enabled || facts.workflowBusy) return null
  if (facts.subscriptionStatus === "past_due") return null
  const plan = effectivePlan(facts)
  const candidates = [
    promotionOffer(facts, plan),
    lowCreditOffer(facts, plan),
    generationOffer(facts, plan),
    humanPolishOffer(facts, plan),
  ]
  for (const candidate of candidates) {
    if (candidate && !suppressed(candidate, facts)) return candidate
  }
  return null
}

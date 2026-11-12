import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  CATALOG,
  introDisclosure,
  proposedAnnualCents,
  savingsCents,
} from "./catalog"
import { recommendPlan } from "./recommend"
import { PRICING_CAMPAIGNS, advertisedIntroCampaign, decideCampaign, evaluatePromotion } from "./promotions"
import {
  planCodeForPriceId,
  resolveCheckoutPrice,
  shouldRefreshIntroCredits,
} from "@/lib/stripe/plans"

const env = {
  STRIPE_PRICE_INTRO_WEEKLY: "price_intro",
  STRIPE_PRICE_PRO_MONTHLY: "price_pro",
  STRIPE_PRICE_BUSINESS_MONTHLY: "price_biz",
}

describe("canonical prices", () => {
  it("matches the verified Stripe amounts", () => {
    assert.equal(CATALOG.intro.amountCents, 1999)
    assert.equal(CATALOG.intro.interval, "week")
    assert.equal(CATALOG.intro.credits, 40)
    assert.equal(CATALOG.professional.amountCents, 9800)
    assert.equal(CATALOG.professional.interval, "month")
    assert.equal(CATALOG.business.amountCents, 34900)
    assert.equal(CATALOG.business.credits, 6000)
  })

  it("proposes 20% annual amounts without treating them as live", () => {
    assert.equal(proposedAnnualCents(9800), 94080)
    assert.equal(proposedAnnualCents(34900), 335040)
    assert.equal(savingsCents(9800, 94080), 23520)
    assert.equal(proposedAnnualCents(9800, 101), 0)
  })

  it("describes the intro charge as a weekly renewal", () => {
    const copy = introDisclosure(false)
    assert.match(copy.renewal, /every week/)
    assert.match(copy.notOneTime, /not a one-time purchase/)
    assert.equal(copy.chargedTodayCents, 1999)
    assert.match(introDisclosure(true).renewal, /\$98 per month/)
  })
})

describe("checkout price routing", () => {
  it("keeps intro on the weekly price", () => {
    const resolved = resolveCheckoutPrice("intro", "year", env)
    assert.equal(resolved.ok && resolved.interval, "week")
    assert.equal(resolved.ok && resolved.priceId, "price_intro")
  })

  it("refuses annual checkout when the annual price is missing", () => {
    const resolved = resolveCheckoutPrice("professional", "year", env)
    assert.deepEqual(resolved, { ok: false, error: "annual_unconfigured" })
  })

  it("uses the annual price only when that env var is a price id", () => {
    const resolved = resolveCheckoutPrice("business", "year", {
      ...env,
      STRIPE_PRICE_BUSINESS_ANNUAL: "price_biz_year",
    })
    assert.equal(resolved.ok && resolved.priceId, "price_biz_year")
    assert.equal(resolved.ok && resolved.interval, "year")
  })

  it("maps annual price ids back to the same plan", () => {
    assert.equal(
      planCodeForPriceId("price_pro_year", { ...env, STRIPE_PRICE_PRO_ANNUAL: "price_pro_year" }),
      "professional"
    )
  })

  it("refreshes intro credits only on a later weekly invoice", () => {
    assert.equal(
      shouldRefreshIntroCredits({
        billingReason: "subscription_create",
        priceId: "price_intro",
        introPriceId: "price_intro",
      }),
      false
    )
    assert.equal(
      shouldRefreshIntroCredits({
        billingReason: "subscription_cycle",
        priceId: "price_intro",
        introPriceId: "price_intro",
      }),
      true
    )
    assert.equal(
      shouldRefreshIntroCredits({
        billingReason: "subscription_cycle",
        priceId: "price_pro",
        introPriceId: "price_intro",
      }),
      false
    )
  })
})

describe("plan recommendation", () => {
  it("uses the published credit quotas", () => {
    assert.equal(recommendPlan({ projectsPerMonth: 2, rendersPerProject: 10, team: false, wantsProfessionalServices: false }).plan, "intro")
    assert.equal(recommendPlan({ projectsPerMonth: 4, rendersPerProject: 20, team: false, wantsProfessionalServices: false }).plan, "professional")
    assert.equal(recommendPlan({ projectsPerMonth: 8, rendersPerProject: 80, team: false, wantsProfessionalServices: false }).plan, "business")
    const team = recommendPlan({ projectsPerMonth: 1, rendersPerProject: 1, team: true, wantsProfessionalServices: true })
    assert.equal(team.plan, "business")
    assert.match(team.serviceNote || "", /Human Polish/)
    assert.doesNotMatch(team.reason, /ROI|revenue|savings/i)
  })
})

describe("promotions", () => {
  const base = {
    plan: "professional" as const,
    interval: "month" as const,
    now: new Date("2026-11-03T00:00:00.000Z"),
    redeemedCount: 0,
    surface: "subscription" as const,
    hasAffiliate: false,
    couponConfigured: true,
  }

  it("includes Black Friday 2026 for Intro first week", () => {
    const bf = PRICING_CAMPAIGNS.find((c) => c.id === "black-friday-2026")
    assert.ok(bf)
    assert.equal(bf?.amountOffCents, 999)
    assert.equal(bf?.duration, "once")
    assert.equal(bf?.endsAt, "2026-12-01T06:00:00.000Z")
    assert.deepEqual(bf?.planCodes, ["intro"])
    assert.equal(bf?.stripeCouponEnv, "STRIPE_COUPON_BLACK_FRIDAY_2026")
  })

  it("keeps non-BF candidate campaigns disabled", () => {
    assert.ok(PRICING_CAMPAIGNS.filter((c) => c.id !== "black-friday-2026").every((c) => c.enabled === false))
  })

  it("rejects a disabled campaign inside its window", () => {
    const decision = evaluatePromotion({ ...base, campaignId: "candidate-initial-20" })
    assert.equal(decision.eligible, false)
    assert.equal(decision.reason, "disabled")
  })

  it("rejects expiry, stacking, forever duration, and a missing coupon", () => {
    const campaign = {
      ...PRICING_CAMPAIGNS.find((c) => c.id === "candidate-initial-20")!,
      enabled: true,
      stripeCouponEnv: "STRIPE_COUPON_TEST",
    }
    assert.equal(decideCampaign(campaign, { ...base, now: new Date("2026-11-08T00:00:00.000Z") }).reason, "outside_window")
    assert.equal(decideCampaign(campaign, { ...base, surface: "human_polish" }).reason, "human_polish_stack")
    assert.equal(decideCampaign(campaign, { ...base, hasAffiliate: true }).reason, "affiliate_stack")
    assert.equal(decideCampaign(campaign, { ...base, redeemedCount: 100 }).reason, "redemption_limit")
    assert.equal(decideCampaign({ ...campaign, duration: "forever" }, base).reason, "forever_blocked")
    assert.equal(decideCampaign(campaign, { ...base, couponConfigured: false }).reason, "missing_coupon")
    assert.equal(decideCampaign(campaign, base).reason, "ok")
  })

  it("applies Black Friday at checkout when the coupon is configured", () => {
    const decision = evaluatePromotion({
      campaignId: "black-friday-2026",
      plan: "intro",
      interval: "week",
      now: new Date("2026-11-20T12:00:00.000Z"),
      redeemedCount: 0,
      surface: "subscription",
      hasAffiliate: false,
      couponConfigured: true,
    })
    assert.equal(decision.eligible, true)
    assert.equal(decision.campaignId, "black-friday-2026")
  })
})

describe("advertised Intro Plan promotion", () => {
  const intro = {
    id: "intro-test",
    planCodes: ["intro"] as const,
    intervals: ["week"] as const,
    percentOff: 20,
    amountOffCents: null,
    duration: "once" as const,
    enabled: true,
    stripeCouponEnv: "STRIPE_COUPON_INTRO_TEST",
    startsAt: "2026-12-01T00:00:00.000Z",
    endsAt: "2026-12-08T00:00:00.000Z",
    maxRedemptions: null,
    stacksWithHumanPolish: false as const,
    stacksWithAffiliate: false as const,
  }

  it("hides Black Friday when the public advertising flag is off", () => {
    assert.equal(
      advertisedIntroCampaign(new Date("2026-11-20T12:00:00Z"), PRICING_CAMPAIGNS, {
        advertiseBlackFriday: false,
      }),
      null
    )
  })

  it("shows Black Friday inside its window when advertising is on", () => {
    assert.equal(
      advertisedIntroCampaign(new Date("2026-11-20T12:00:00Z"), PRICING_CAMPAIGNS, {
        advertiseBlackFriday: true,
      })?.id,
      "black-friday-2026"
    )
  })

  it("shows a real campaign only inside its dates", () => {
    assert.equal(advertisedIntroCampaign(new Date("2026-11-30T23:59:59Z"), [intro]), null)
    assert.equal(advertisedIntroCampaign(new Date("2026-12-03T12:00:00Z"), [intro])?.id, "intro-test")
    assert.equal(advertisedIntroCampaign(new Date("2026-12-08T00:00:00Z"), [intro]), null)
  })

  it("never shows a disabled campaign or one without a Stripe coupon", () => {
    const when = new Date("2026-12-03T12:00:00Z")
    assert.equal(advertisedIntroCampaign(when, [{ ...intro, enabled: false }]), null)
    assert.equal(advertisedIntroCampaign(when, [{ ...intro, stripeCouponEnv: null }]), null)
    assert.equal(advertisedIntroCampaign(when, [{ ...intro, planCodes: ["professional"] as const }]), null)
  })
})

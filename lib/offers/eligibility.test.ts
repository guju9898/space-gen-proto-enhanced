import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { PRICING_CAMPAIGNS } from "@/lib/pricing/promotions"
import { EMPTY_LIFECYCLE_STATE, parseLifecycleState, recordLifecycleEvent } from "@/lib/offers/state"
import { selectLifecycleOffer, type LifecycleFacts } from "@/lib/offers/eligibility"

const now = new Date("2026-11-03T12:00:00.000Z")

function facts(overrides: Partial<LifecycleFacts> = {}): LifecycleFacts {
  return {
    enabled: true,
    workflowBusy: false,
    plan: "none",
    subscriptionStatus: null,
    successfulRenders: 0,
    creditsRemaining: null,
    creditAllowance: null,
    now,
    hasAffiliate: false,
    redeemedCount: 0,
    couponsReady: [],
    state: { ...EMPTY_LIFECYCLE_STATE, impressions: {}, dismissedAt: {} },
    ...overrides,
  }
}

const livePromo = {
  ...PRICING_CAMPAIGNS[0],
  enabled: true,
  stripeCouponEnv: "STRIPE_COUPON_TEST",
}

describe("lifecycle eligibility", () => {
  it("stays quiet before the generation threshold", () => {
    assert.equal(selectLifecycleOffer(facts({ successfulRenders: 2 })), null)
  })

  it("offers Professional after enough successful renders without inventing a discount", () => {
    const offer = selectLifecycleOffer(facts({ successfulRenders: 3 }))
    assert.equal(offer?.trigger, "generation")
    assert.equal(offer?.href, "/onboarding?plan=professional&step=3")
    assert.equal(offer?.promotionId, null)
    assert.match(offer?.body || "", /No limited-time discount/)
  })

  it("hides offers while Studio work is in progress and when the flag is off", () => {
    assert.equal(selectLifecycleOffer(facts({ successfulRenders: 4, workflowBusy: true })), null)
    assert.equal(selectLifecycleOffer(facts({ successfulRenders: 4, enabled: false })), null)
  })

  it("upgrades intro and Professional users who are low on credits", () => {
    const intro = selectLifecycleOffer(
      facts({
        plan: "intro",
        subscriptionStatus: "active",
        successfulRenders: 4,
        creditsRemaining: 8,
        creditAllowance: 40,
      })
    )
    assert.equal(intro?.trigger, "low_credits")
    assert.equal(intro?.plan, "professional")
    assert.match(intro?.body || "", /40/)
    assert.match(intro?.body || "", /500/)

    const professional = selectLifecycleOffer(
      facts({
        plan: "professional",
        subscriptionStatus: "active",
        successfulRenders: 6,
        creditsRemaining: 50,
        creditAllowance: 500,
      })
    )
    assert.equal(professional?.plan, "business")
    assert.match(professional?.href || "", /plan=business/)
  })

  it("does not invent an extra credit pack for Business", () => {
    const offer = selectLifecycleOffer(
      facts({
        plan: "business",
        subscriptionStatus: "active",
        successfulRenders: 6,
        creditsRemaining: 100,
        creditAllowance: 6000,
      })
    )
    assert.equal(offer?.trigger, "repeat_usage")
    assert.match(offer?.body || "", /does not combine/)
  })

  it("introduces Human Polish only after repeated paid use", () => {
    assert.equal(
      selectLifecycleOffer(
        facts({ plan: "professional", subscriptionStatus: "active", successfulRenders: 4, creditsRemaining: 400, creditAllowance: 500 })
      ),
      null
    )
    const offer = selectLifecycleOffer(
      facts({ plan: "professional", subscriptionStatus: "active", successfulRenders: 5, creditsRemaining: 400, creditAllowance: 500 })
    )
    assert.equal(offer?.trigger, "repeat_usage")
    assert.equal(offer?.href, "/human-polish")
  })

  it("shows an active promotion only inside its server window", () => {
    const offer = selectLifecycleOffer(
      facts({
        successfulRenders: 4,
        campaigns: [livePromo],
        couponsReady: [livePromo.id],
      })
    )
    assert.equal(offer?.trigger, "active_promotion")
    assert.match(offer?.href || "", /promotion=candidate-initial-20/)
    assert.match(offer?.body || "", /Nov 8, 2026/)

    const expired = selectLifecycleOffer(
      facts({
        campaigns: [{ ...livePromo, endsAt: "2026-11-03T00:00:00.000Z" }],
        couponsReady: [livePromo.id],
      })
    )
    assert.notEqual(expired?.trigger, "active_promotion")
  })

  it("blocks a promotion that was already redeemed, stacks with an affiliate, or has no coupon", () => {
    assert.equal(
      selectLifecycleOffer(
        facts({ successfulRenders: 3, campaigns: [livePromo], couponsReady: [livePromo.id], redeemedCount: 100 })
      )?.trigger,
      "generation"
    )
    assert.notEqual(
      selectLifecycleOffer(
        facts({ successfulRenders: 3, campaigns: [livePromo], couponsReady: [livePromo.id], hasAffiliate: true })
      )?.trigger,
      "active_promotion"
    )
    assert.notEqual(
      selectLifecycleOffer(facts({ successfulRenders: 3, campaigns: [livePromo], couponsReady: [] }))?.trigger,
      "active_promotion"
    )
  })

  it("suppresses every offer when the subscription is past due", () => {
    assert.equal(
      selectLifecycleOffer(
        facts({
          plan: "professional",
          subscriptionStatus: "past_due",
          successfulRenders: 8,
          creditsRemaining: 10,
          creditAllowance: 500,
          campaigns: [livePromo],
          couponsReady: [livePromo.id],
        })
      ),
      null
    )
  })

  it("keeps the same offer on refresh and hides it after dismiss or the impression cap", () => {
    const base = facts({ successfulRenders: 3 })
    const offer = selectLifecycleOffer(base)
    assert.ok(offer)
    const seen = recordLifecycleEvent(base.state, "impression", offer.id, now)
    assert.equal(selectLifecycleOffer(facts({ successfulRenders: 3, state: seen }))?.id, offer.id)

    const dismissed = recordLifecycleEvent(seen, "dismiss", offer.id, now)
    assert.equal(selectLifecycleOffer(facts({ successfulRenders: 3, state: dismissed })), null)

    let capped = base.state
    for (let i = 0; i < 3; i += 1) capped = recordLifecycleEvent(capped, "impression", offer.id, now)
    assert.equal(selectLifecycleOffer(facts({ successfulRenders: 3, state: capped })), null)
  })

  it("does not switch to a second offer during the cooldown", () => {
    const first = selectLifecycleOffer(facts({ successfulRenders: 3 }))
    assert.ok(first)
    const state = recordLifecycleEvent(EMPTY_LIFECYCLE_STATE, "impression", first.id, now)
    const next = selectLifecycleOffer(
      facts({
        plan: "professional",
        subscriptionStatus: "active",
        successfulRenders: 6,
        creditsRemaining: 400,
        creditAllowance: 500,
        state,
      })
    )
    assert.equal(next, null)
  })

  it("ignores a tampered cookie", () => {
    const state = parseLifecycleState("{\"impressions\":{\"drop table\":4},\"dismissedAt\":{}}")
    assert.deepEqual(state.impressions, {})
  })
})

import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  BLACK_FRIDAY_2026_ID,
  PRICING_CAMPAIGNS,
  advertisedIntroCampaign,
  campaignFirstChargeCents,
  decideCampaign,
  introCampaignToShow,
  isStripeCouponId,
  promoPreviewAllowed,
} from "./promotions"
import { CATALOG, MOST_POPULAR_PLAN, moneyFromCents, perRenderLabel } from "./catalog"
import { quizRecommendation } from "./quiz"
import { remainingParts } from "../../components/marketing/Countdown"
import { presentingLabel } from "../projects/presenting"
import { meetingNudge } from "../studio/meeting"
import { likePattern, mapProjectRow } from "../projects/get-projects"

const bf = PRICING_CAMPAIGNS.find((c) => c.id === BLACK_FRIDAY_2026_ID)!

describe("Black Friday 2026", () => {
  it("is $10 for the Intro Plan's first week, through Nov 30 11:59pm CT", () => {
    assert.equal(moneyFromCents(campaignFirstChargeCents(bf, CATALOG.intro.amountCents)), "$10")
    assert.equal(bf.duration, "once")
    assert.deepEqual(bf.planCodes, ["intro"])
    assert.equal(bf.endsAt, "2026-12-01T06:00:00.000Z")
    assert.equal(new Date(Date.parse(bf.endsAt) - 60_000).toLocaleString("en-US", { timeZone: "America/Chicago" }), "11/30/2026, 11:59:00 PM")
  })
  it("is off unless the public switch is on (no switch in tests)", () => {
    assert.equal(bf.enabled, false)
    assert.equal(advertisedIntroCampaign(new Date("2026-11-20T12:00:00Z")), null)
  })
  it("shows in preview only inside its dates, and never after the end", () => {
    assert.equal(introCampaignToShow(new Date("2026-11-20T12:00:00Z"), true)?.id, BLACK_FRIDAY_2026_ID)
    assert.equal(introCampaignToShow(new Date("2026-12-01T06:00:01Z"), true), null)
  })
  it("checkout needs a coupon and the week interval", () => {
    const on = { ...bf, enabled: true }
    const base = { plan: "intro" as const, interval: "week" as const, now: new Date("2026-11-20T12:00:00Z"), redeemedCount: 0, surface: "subscription" as const, hasAffiliate: false }
    assert.equal(decideCampaign(on, { ...base, couponConfigured: false }).reason, "missing_coupon")
    assert.equal(decideCampaign(on, { ...base, couponConfigured: true }).eligible, true)
    assert.equal(decideCampaign(on, { ...base, plan: "professional", couponConfigured: true }).reason, "plan_mismatch")
  })
  it("preview switch is never honoured in production", () => {
    assert.equal(promoPreviewAllowed("promo_preview=1", "production"), false)
    assert.equal(promoPreviewAllowed("promo_preview=1", undefined), false)
    assert.equal(promoPreviewAllowed("promo_preview=1", "preview"), true)
  })
  it("accepts real Stripe coupon id shapes", () => {
    assert.equal(isStripeCouponId("Z4OV52SU"), true)
    assert.equal(isStripeCouponId("BF2026_INTRO"), true)
    assert.equal(isStripeCouponId(""), false)
    assert.equal(isStripeCouponId("has space"), false)
    assert.equal(isStripeCouponId(undefined), false)
  })
})

describe("countdown", () => {
  it("counts to the end and stops", () => {
    assert.deepEqual(remainingParts("2026-12-01T06:00:00.000Z", Date.parse("2026-11-30T05:58:30Z")), { d: 1, h: 0, m: 1, s: 30 })
    assert.equal(remainingParts("2026-12-01T06:00:00.000Z", Date.parse("2026-12-01T06:00:00Z")), null)
  })
})

describe("pricing", () => {
  it("Most popular is Professional and per-render costs are real", () => {
    assert.equal(MOST_POPULAR_PLAN, "professional")
    assert.equal(perRenderLabel(CATALOG.intro.amountCents, CATALOG.intro.credits), "about $0.50 per render")
    assert.equal(perRenderLabel(CATALOG.professional.amountCents, CATALOG.professional.credits), "about $0.20 per render")
    assert.equal(perRenderLabel(CATALOG.business.amountCents, CATALOG.business.credits), "about 6¢ per render")
  })
  it("quiz sizes plans to real credits", () => {
    assert.equal(quizRecommendation(2, 2).plan, "intro")
    assert.equal(quizRecommendation(7, 4).plan, "intro")
    assert.equal(quizRecommendation(18, 4).plan, "professional")
    assert.equal(quizRecommendation(35, 8).plan, "professional")
    assert.equal(quizRecommendation(350, 8).plan, "business")
    assert.deepEqual(quizRecommendation(18, 4).meter, { used: 72, of: 500, period: "month" })
  })
})

describe("projects", () => {
  it("presenting labels", () => {
    assert.equal(presentingLabel("2026-11-12", "2026-11-12"), "Presenting today")
    assert.equal(presentingLabel("2026-11-13", "2026-11-12"), "Presenting tomorrow")
    assert.equal(presentingLabel("2026-11-14", "2026-11-12"), "Presenting Sat, Nov 14")
    assert.equal(presentingLabel("2026-11-10", "2026-11-12"), "Presented Tue, Nov 10")
    assert.equal(presentingLabel(null, "2026-11-12"), null)
  })
  it("maps rows and escapes search", () => {
    const p = mapProjectRow({ id: "1", user_id: "u", name: " ", project_type: "x", cover_image: null, share_slug: null, is_shared: null, created_at: "2026-11-12T00:00:00Z", updated_at: null, project_renders: [{ count: 5 }], presenting_on: "2026-11-14" })
    assert.equal(p.name, "Untitled project")
    assert.equal(p.projectType, "exterior")
    assert.equal(p.renderCount, 5)
    assert.equal(p.updatedAt, "2026-11-12T00:00:00Z")
    assert.equal(p.presentingOn, "2026-11-14")
    assert.equal(likePattern("50%_off"), "%50\\%\\_off%")
  })
  it("meeting nudge only uses what the contractor said", () => {
    assert.match(meetingNudge("today"), /today/)
    assert.match(meetingNudge("this-week"), /this week/)
    assert.doesNotMatch(meetingNudge(null), /today|week|hours/)
  })
})

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { sanitizeHumanPolishAnalyticsParams } from "./analytics-params"
import { buildHumanPolishProjectSummary } from "./project-summary"
import { isHumanPolishPromotionType } from "./types"

describe("analytics param sanitization", () => {
  it("completed_checkout-like params contain no PII", () => {
    const safe = sanitizeHumanPolishAnalyticsParams({
      family: "ai-render-pack",
      package: "25",
      promotionType: "first_purchase_25",
      email: "leak@example.com",
      requestId: "uuid",
      sessionId: "cs_test",
      token: "raw",
    })
    assert.equal(safe.family, "ai-render-pack")
    assert.equal(safe.package, "25")
    assert.equal(safe.promotionType, "first_purchase_25")
    assert.equal(safe.email, undefined)
    assert.equal(safe.requestId, undefined)
    assert.equal(safe.sessionId, undefined)
    assert.equal(safe.token, undefined)
  })

  it("checkout_cancelled params strip token/requestId", () => {
    const safe = sanitizeHumanPolishAnalyticsParams({
      family: "build-ready",
      package: "essentials-2d",
      token: "payment-token",
      request_id: "uuid",
    })
    assert.deepEqual(safe, {
      family: "build-ready",
      package: "essentials-2d",
    })
  })

  it("promotion events only match authoritative enum values", () => {
    assert.equal(isHumanPolishPromotionType("first_purchase_25"), true)
    assert.equal(isHumanPolishPromotionType("subscriber_15"), true)
    assert.equal(isHumanPolishPromotionType("none"), true)
    assert.equal(isHumanPolishPromotionType("random"), false)
  })
})

describe("project summary", () => {
  it("omits tokens and contact details", () => {
    const text = buildHumanPolishProjectSummary({
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      family: "ai-render-pack",
      requested_package: "25",
      approved_package: null,
      approved_amount: null,
      currency: "usd",
      project_type: "residential",
      project_city: "Austin",
      project_state: "TX",
      status: "in_progress",
      payment_status: "paid",
      rush_requested: false,
      rush_approved: false,
      assigned_to: "designer-1",
      revision_count: 0,
      last_revision_note: null,
      brief_text: "Modern porch",
      design_objectives: "Warm lighting",
      must_have_elements: "Stone steps",
      fileCount: 3,
    })
    assert.match(text, /Request reference/)
    assert.match(text, /Austin, TX/)
    assert.doesNotMatch(text, /@/)
    assert.doesNotMatch(text, /token/i)
    assert.doesNotMatch(text, /stripe/i)
  })
})

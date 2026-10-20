// Run: pnpm exec tsx --test lib/conversion/contracts.test.ts lib/conversion/track.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MARKETING_PLAN_TO_CHECKOUT, onboardingPlanQuery } from "./contracts"

describe("plan id contract", () => {
  it("maps the marketing starter key onto the checkout intro code", () => {
    assert.equal(MARKETING_PLAN_TO_CHECKOUT.starter, "intro")
    assert.equal(onboardingPlanQuery("starter"), "intro")
  })

  it("leaves professional and business unchanged", () => {
    assert.equal(onboardingPlanQuery("professional"), "professional")
    assert.equal(onboardingPlanQuery("business"), "business")
  })
})

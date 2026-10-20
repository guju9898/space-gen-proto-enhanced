// Run: pnpm exec tsx --test lib/conversion/track.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isConversionEventName } from "./track"

describe("conversion event names", () => {
  it("accepts snake_case surface_action names", () => {
    assert.equal(isConversionEventName("pricing_plan_selected"), true)
    assert.equal(isConversionEventName("gallery_preset_opened"), true)
  })

  it("rejects empty, camelCase, spaces, and overlong names", () => {
    assert.equal(isConversionEventName(""), false)
    assert.equal(isConversionEventName("pricingPlan"), false)
    assert.equal(isConversionEventName("Pricing_plan"), false)
    assert.equal(isConversionEventName("pricing plan"), false)
    assert.equal(isConversionEventName("a".repeat(41)), false)
  })
})

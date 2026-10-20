import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { readPremiumAvailability } from "./availability"

describe("premium availability", () => {
  it("stays unknown when capacity is not configured", () => {
    const result = readPremiumAvailability("premium_onboarding", {})
    assert.equal(result.status, "unknown")
    assert.equal(result.slots, null)
    assert.equal(result.message, "Request the next available onboarding date.")
    assert.equal(result.showCapacityNote, false)
  })

  it("rejects a slot count without a real date", () => {
    const result = readPremiumAvailability("mailer", {
      PREMIUM_MAILER_SLOTS: "4",
      PREMIUM_MAILER_NEXT_DATE: "tomorrow",
    })
    assert.equal(result.status, "unknown")
    assert.equal(result.slots, null)
  })

  it("rejects an impossible calendar date", () => {
    const result = readPremiumAvailability("premium_onboarding", {
      PREMIUM_ONBOARDING_SLOTS: "2",
      PREMIUM_ONBOARDING_NEXT_DATE: "2026-02-31",
    })
    assert.equal(result.status, "unknown")
  })

  it("reports a verified opening and date", () => {
    const result = readPremiumAvailability("premium_onboarding", {
      PREMIUM_ONBOARDING_SLOTS: "2",
      PREMIUM_ONBOARDING_NEXT_DATE: "2026-11-12",
    })
    assert.equal(result.status, "available")
    assert.equal(result.slots, 2)
    assert.match(result.message, /2 openings/)
    assert.match(result.message, /November 12, 2026/)
    assert.equal(result.showCapacityNote, true)
  })

  it("does not describe a full date as open", () => {
    const result = readPremiumAvailability("human_polish", {
      PREMIUM_HUMAN_POLISH_SLOTS: "0",
      PREMIUM_HUMAN_POLISH_NEXT_DATE: "2026-11-12",
    })
    assert.equal(result.status, "waitlist")
    assert.equal(result.slots, 0)
    assert.equal(result.showCapacityNote, false)
    assert.match(result.message, /No openings remain/)
  })
})

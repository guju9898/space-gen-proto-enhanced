import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { isValidDateOnly, presentingLabel, toDateInputValue } from "./presenting"

// Thu Nov 12 2026, local midday (avoids timezone edge cases).
const now = new Date(2026, 10, 12, 12, 0, 0)

describe("presentingLabel", () => {
  it("returns null for empty or invalid input", () => {
    assert.equal(presentingLabel(null, now), null)
    assert.equal(presentingLabel("", now), null)
    assert.equal(presentingLabel("not-a-date", now), null)
    assert.equal(presentingLabel("2026-02-31", now), null)
  })

  it("labels today and tomorrow", () => {
    assert.equal(presentingLabel("2026-11-12", now), "Presenting today")
    assert.equal(presentingLabel("2026-11-13", now), "Presenting tomorrow")
  })

  it("labels later dates with month and day", () => {
    assert.equal(presentingLabel("2026-11-15", now), "Presenting Nov 15")
  })

  it("adds the year when it is not this year", () => {
    assert.equal(presentingLabel("2027-01-05", now), "Presenting Jan 5, 2027")
  })

  it("labels past dates as presented", () => {
    assert.equal(presentingLabel("2026-11-11", now), "Presented yesterday")
    assert.equal(presentingLabel("2026-11-01", now), "Presented Nov 1")
  })

  it("accepts a full ISO timestamp by its date part", () => {
    assert.equal(presentingLabel("2026-11-13T00:00:00.000Z", now), "Presenting tomorrow")
  })
})

describe("date helpers", () => {
  it("formats a local date for date inputs", () => {
    assert.equal(toDateInputValue(new Date(2026, 0, 5)), "2026-01-05")
  })

  it("validates date-only strings", () => {
    assert.equal(isValidDateOnly("2026-11-12"), true)
    assert.equal(isValidDateOnly("2026-13-01"), false)
    assert.equal(isValidDateOnly("2026-11-12T00:00:00Z"), false)
  })
})

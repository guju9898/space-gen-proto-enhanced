import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isCustomValue, resolveTypedValue } from "./customValue"

describe("typed Studio values", () => {
  const options = ["gravel", "pavers", "concrete", "stone", "wood deck"]

  it("keeps text that only partly matches an option", () => {
    assert.equal(resolveTypedValue("deck", options), "deck")
    assert.equal(resolveTypedValue("travertine pavers", options), "travertine pavers")
    assert.equal(resolveTypedValue("  Lueders   limestone coping ", options), "Lueders limestone coping")
  })

  it("uses the listed option for an exact match, any case", () => {
    assert.equal(resolveTypedValue("Pavers", options), "pavers")
  })

  it("ignores blank text", () => {
    assert.equal(resolveTypedValue("   ", options), "")
  })

  it("knows a custom value from a listed one", () => {
    assert.equal(isCustomValue("travertine pavers", options), true)
    assert.equal(isCustomValue("Stone", options), false)
    assert.equal(isCustomValue("", options), false)
  })
})

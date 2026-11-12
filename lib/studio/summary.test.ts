import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { shouldShowSummaryKey } from "./summary"

describe("shouldShowSummaryKey", () => {
  it("hides buildingType when exteriorType is set", () => {
    assert.equal(shouldShowSummaryKey("buildingType", { exteriorType: "farmhouse" }), false)
    assert.equal(shouldShowSummaryKey("buildingType", { exteriorType: "none" }), true)
    assert.equal(shouldShowSummaryKey("buildingType", {}), true)
  })

  it("hides style when architecturalStyle or themeStyle is set", () => {
    assert.equal(shouldShowSummaryKey("style", { architecturalStyle: "craftsman" }), false)
    assert.equal(shouldShowSummaryKey("style", { themeStyle: "Texas Hill Country" }), false)
    assert.equal(shouldShowSummaryKey("style", { style: "modern" }), true)
  })

  it("keeps preferred keys visible", () => {
    assert.equal(shouldShowSummaryKey("exteriorType", { exteriorType: "farmhouse", buildingType: "house" }), true)
    assert.equal(shouldShowSummaryKey("themeStyle", { themeStyle: "modern", style: "modern" }), true)
  })
})

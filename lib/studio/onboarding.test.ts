import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  TRADES,
  demoRendersLeftText,
  isTradeAnswered,
  meanBrightness,
  photoWarnings,
  renderCostText,
  tradeById,
} from "./onboarding"

describe("trade question", () => {
  it("maps every trade to a real Studio", () => {
    for (const t of TRADES) assert.ok(["landscape", "exterior", "interior"].includes(t.studio))
    assert.equal(tradeById("pools")?.studio, "landscape")
    assert.equal(tradeById("interiors")?.studio, "interior")
    assert.equal(tradeById("nope"), null)
  })
  it("treats a pick or a skip as answered", () => {
    assert.equal(isTradeAnswered(null), false)
    assert.equal(isTradeAnswered("skipped"), true)
    assert.equal(isTradeAnswered("exteriors"), true)
    assert.equal(isTradeAnswered("garbage"), false)
  })
})

describe("photo check", () => {
  it("flags small, dark and upright photos", () => {
    assert.deepEqual(photoWarnings({ width: 800, height: 1200, brightness: 40 }, "landscape"), ["small", "dark", "portrait"])
  })
  it("does not flag upright photos in Interior", () => {
    assert.deepEqual(photoWarnings({ width: 3000, height: 4000, brightness: 120 }, "interior"), [])
  })
  it("passes a good photo", () => {
    assert.deepEqual(photoWarnings({ width: 4032, height: 3024, brightness: 130 }, "exterior"), [])
  })
  it("measures brightness from RGBA data", () => {
    assert.equal(Math.round(meanBrightness([0, 0, 0, 255, 255, 255, 255, 255])), 128)
    assert.equal(meanBrightness([]), 255)
  })
})

describe("copy", () => {
  it("demo counter adds the carry-over line after the first render", () => {
    assert.deepEqual(demoRendersLeftText(5), { main: "You have 5 demo renders left.", carry: null })
    assert.equal(demoRendersLeftText(1).main, "You have 1 demo render left.")
    assert.ok(demoRendersLeftText(2).carry?.includes("move into your account"))
    assert.equal(demoRendersLeftText(0).main, "You've used all 5 demo renders.")
  })
  it("cost line", () => {
    assert.equal(renderCostText({ demo: true, demoRemaining: 3, credits: null, cost: 1 }), "Uses 1 of your 3 demo renders left.")
    assert.equal(
      renderCostText({ demo: false, demoRemaining: 0, credits: 39, cost: 1 }),
      "Uses 1 credit. You have 39. Credits are only used when a render succeeds."
    )
    assert.equal(
      renderCostText({ demo: false, demoRemaining: 0, credits: null, cost: 2 }),
      "Uses 2 credits. Credits are only used when a render succeeds."
    )
  })
})

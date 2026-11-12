import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { GALLERY_PRESETS, studioPresetHref } from "../gallery/presets"

describe("homepage Recreate cards", () => {
  it("every card has its own render and opens its own preset", () => {
    const cards = GALLERY_PRESETS.filter((p) => p.referenceImage)
    assert.ok(cards.length >= 5)
    const srcs = new Set(cards.map((p) => p.referenceImage!.src))
    assert.equal(srcs.size, cards.length, "no two cards share a photo")
    for (const p of cards) {
      assert.match(studioPresetHref(p, { demo: true }), new RegExp(`preset=${p.slug}`))
    }
  })
})

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { FIELD_ENTRIES, joinMulti, labelForKey, splitMulti } from "./fields"

describe("Studio v2 field guide", () => {
  it("every entry matches a real control label or placeholder in its Studio", () => {
    for (const entry of FIELD_ENTRIES) {
      const src = readFileSync(path.join(process.cwd(), "app/studio", entry.studio, "page.tsx"), "utf8")
      const found = src.includes(`label="${entry.match}"`) || src.includes(`placeholder="${entry.match}"`)
      assert.ok(found, `${entry.studio}: no control labelled "${entry.match}"`)
    }
  })

  it("level values stay inside the old 0-100 range", () => {
    for (const entry of FIELD_ENTRIES) {
      for (const level of entry.levels ?? []) {
        const n = Number(level.value)
        assert.ok(n >= 0 && n <= 100, `${entry.key}: ${level.value}`)
      }
    }
  })

  it("multi-value fields round-trip as one comma string", () => {
    assert.deepEqual(splitMulti("travertine pavers, stamped concrete,  , none"), ["travertine pavers", "stamped concrete"])
    assert.equal(joinMulti(["live oak", "Live Oak", " agave "]), "live oak, agave")
  })

  it("labels chips in contractor words", () => {
    assert.equal(labelForKey("landscape", "hardscaping"), "Paving and decking")
    assert.equal(labelForKey("exterior", "presetBrief"), "Design notes")
    assert.equal(labelForKey(null, "plantTypes"), "Plant Types")
  })
})

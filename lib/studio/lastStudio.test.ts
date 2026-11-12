import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { studioEntryHref, studioKindFromPath } from "./lastStudio"

describe("studio entry", () => {
  it("defaults new visitors to Landscape", () => {
    assert.equal(studioEntryHref(null, ""), "/studio/landscape")
    assert.equal(studioEntryHref("bogus", ""), "/studio/landscape")
  })

  it("reopens the last Studio used", () => {
    assert.equal(studioEntryHref("interior", ""), "/studio/interior")
    assert.equal(studioEntryHref("exterior", ""), "/studio/exterior")
  })

  it("keeps the query string (checkout success, demo mode)", () => {
    assert.equal(studioEntryHref(null, "billing=success"), "/studio/landscape?billing=success")
    assert.equal(studioEntryHref("interior", "?demo=true"), "/studio/interior?demo=true")
  })

  it("reads the Studio from a path", () => {
    assert.equal(studioKindFromPath("/studio/exterior"), "exterior")
    assert.equal(studioKindFromPath("/studio/projects/abc"), null)
    assert.equal(studioKindFromPath("/pricing"), null)
  })
})

// Run: pnpm tsx --test lib/content/describe.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseDescription, publicSlugFor } from "./describe"

describe("parseDescription", () => {
  it("reads fenced JSON", () => {
    const d = parseDescription('```json\n{"qc_score": 8, "qc_notes": "clean", "title": "Pool With Travertine Deck", "alt_text": "Rectangular pool with travertine deck", "description": "A rectangular pool sits in the middle of the yard.", "tags": ["Pool Deck", "travertine"]}\n```')
    assert.ok(d)
    assert.equal(d.qcScore, 8)
    assert.deepEqual(d.tags, ["pool deck", "travertine"])
  })
  it("rejects bad scores and missing fields", () => {
    assert.equal(parseDescription('{"qc_score": 14, "title": "a", "alt_text": "b", "description": "c"}'), null)
    assert.equal(parseDescription('{"qc_score": 7, "title": "", "alt_text": "b", "description": "c"}'), null)
    assert.equal(parseDescription("no json here"), null)
  })
})

describe("publicSlugFor", () => {
  it("is unique per job and url-safe", () => {
    const a = publicSlugFor({ id: "0a1b2c3d-0000-0000-0000-000000000000", slug: "pool-paver-patio-austin-concept-01", title: null })
    const b = publicSlugFor({ id: "ffeedd00-0000-0000-0000-000000000000", slug: "pool-paver-patio-austin-concept-01", title: null })
    assert.notEqual(a, b)
    assert.match(a, /^[a-z0-9-]+$/)
    assert.ok(a.length <= 90)
  })
})

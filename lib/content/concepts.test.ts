// Run: pnpm tsx --test lib/content/concepts.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  CONCEPTS,
  buildSeoText,
  chicagoDate,
  isAllowedStockUrl,
  planJobs,
  slugify,
  type SourceForPlan,
} from "./concepts"

const sources: SourceForPlan[] = [
  { id: "s1", kind: "stock", scene: "backyard", timesUsed: 0 },
  { id: "o1", kind: "own", scene: "pool", timesUsed: 5 },
  { id: "o2", kind: "own", scene: "front_yard", timesUsed: 1 },
]

describe("planJobs", () => {
  it("makes exactly the requested number of jobs", () => {
    assert.equal(planJobs({ date: "2026-10-15", count: 18, sources }).length, 18)
    assert.equal(planJobs({ date: "2026-10-15", count: 18, sources: [] }).length, 18)
  })

  it("is deterministic for the same date", () => {
    const a = planJobs({ date: "2026-10-15", count: 10, sources })
    const b = planJobs({ date: "2026-10-15", count: 10, sources })
    assert.deepEqual(a, b)
  })

  it("uses own photos before stock, least-used first", () => {
    const jobs = planJobs({ date: "2026-10-15", count: 10, sources, photoShare: 0.3 })
    assert.deepEqual(
      jobs.slice(0, 3).map((j) => j.sourceId),
      ["o2", "o1", "s1"]
    )
    assert.ok(jobs.slice(3).every((j) => j.sourceId === null))
  })

  it("is text-only when there are no photos", () => {
    const jobs = planJobs({ date: "2026-10-15", count: 6, sources: [] })
    assert.ok(jobs.every((j) => j.sourceId === null && j.prompt.includes("No text")))
  })

  it("matches concepts to the photo's scene", () => {
    const jobs = planJobs({ date: "2026-10-16", count: 2, sources: [sources[1]], photoShare: 1 })
    for (const job of jobs) {
      const concept = CONCEPTS.find((c) => c.key === job.conceptKey)!
      assert.ok(concept.scenes.includes("pool"), `${job.conceptKey} should fit a pool photo`)
    }
  })

  it("does not repeat a concept until all have been used", () => {
    const jobs = planJobs({ date: "2026-10-15", count: CONCEPTS.length, sources: [] })
    assert.equal(new Set(jobs.map((j) => j.conceptKey)).size, CONCEPTS.length)
  })

  it("respects avoid keys", () => {
    const avoid = CONCEPTS.filter((c) => c.key !== "xeriscape").map((c) => c.key)
    const jobs = planJobs({ date: "2026-10-15", count: 4, sources: [], avoidKeys: avoid })
    assert.ok(jobs.every((j) => j.conceptKey === "xeriscape"))
  })

  it("gives unique slugs across top-ups on the same day", () => {
    const first = planJobs({ date: "2026-10-15", count: 5, sources: [] })
    const second = planJobs({ date: "2026-10-15", count: 5, sources: [], startIndex: 5 })
    const slugs = [...first, ...second].map((j) => j.slug)
    assert.equal(new Set(slugs).size, slugs.length)
  })
})

describe("SEO text", () => {
  it("never calls a stock or text-only image a client project", () => {
    const concept = CONCEPTS[0]
    for (const mode of ["stock", "text"] as const) {
      const t = buildSeoText(concept, "Austin, TX", mode, "backyard", 0)
      assert.ok(!/client|customer|job-site/i.test(t.caption), t.caption)
    }
    assert.match(buildSeoText(concept, "Austin, TX", "own", "backyard", 0).caption, /Job-site photo/)
  })

  it("builds clean slugs", () => {
    assert.equal(slugify("Pool & Patio — Austin, TX!"), "pool-and-patio-austin-tx")
  })
})

describe("helpers", () => {
  it("only allows known stock hosts over https", () => {
    assert.ok(isAllowedStockUrl("https://images.pexels.com/photos/1/a.jpeg"))
    assert.ok(!isAllowedStockUrl("http://images.pexels.com/photos/1/a.jpeg"))
    assert.ok(!isAllowedStockUrl("https://evil.example.com/a.jpg"))
    assert.ok(!isAllowedStockUrl("not a url"))
  })

  it("formats the Chicago date", () => {
    assert.equal(chicagoDate(new Date("2026-10-15T03:00:00Z")), "2026-10-14")
    assert.equal(chicagoDate(new Date("2026-10-15T12:00:00Z")), "2026-10-15")
  })
})

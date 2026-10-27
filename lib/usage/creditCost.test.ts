// Run: pnpm exec tsx --test lib/usage/creditCost.test.ts lib/usage/introCredits.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { renderCreditCost } from "@/lib/usage/creditCost"
import { introUsageGrant } from "@/lib/usage/introGrant"
import { settleRenderCharge } from "@/lib/usage/settleRenderCharge"

describe("renderCreditCost", () => {
  it("returns 1 with and without a reference image", () => {
    assert.equal(renderCreditCost(), 1)
    assert.equal(renderCreditCost({ hasReferenceImage: false, renderType: "landscape" }), 1)
    assert.equal(renderCreditCost({ hasReferenceImage: true, renderType: "exterior" }), 1)
    assert.equal(renderCreditCost({ hasReferenceImage: true, renderType: "interior" }), 1)
  })
})

describe("settleRenderCharge", () => {
  it("returns the image and writes a credit_errors row when consumption fails", async () => {
    const rows: Array<{ stage: string; message: string; amount?: number | null }> = []
    const result = await settleRenderCharge({
      imageUrl: "https://cdn.example/render.png",
      userId: "11111111-1111-1111-1111-111111111111",
      planId: "intro",
      renderId: "22222222-2222-2222-2222-222222222222",
      amount: renderCreditCost({ hasReferenceImage: true }),
      creditsRemaining: 40,
      nearLimit: false,
      recordEvent: async () => "inserted",
      consume: async () => {
        throw new Error("bad period_start")
      },
      logError: async (row) => {
        rows.push(row)
      },
    })

    assert.equal(result.imageUrl, "https://cdn.example/render.png")
    assert.equal(result.usage.creditsRemaining, 39)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].stage, "consume")
    assert.match(rows[0].message, /period_start/)
    assert.equal(rows[0].amount, 1)
  })
})

describe("intro webhook grant", () => {
  it("includes plan_id intro", () => {
    const row = introUsageGrant({
      userId: "11111111-1111-1111-1111-111111111111",
      periodStart: "2026-10-26T23:13:53.000Z",
      periodEnd: "2026-11-02T23:13:53.000Z",
    })
    assert.equal(row.plan_id, "intro")
    assert.equal(row.plan_code, "intro")
    assert.equal(row.credits_allocated, 40)
  })
})

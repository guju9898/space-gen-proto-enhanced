// Run: pnpm exec tsx --test lib/usage/introCredits.test.ts
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { enforceCredits } from "@/lib/usage/enforceCredits"
import {
  USER_USAGE_CONFLICT,
  creditsAfterConsumption,
  grantIntroUsage,
  introUsageGrant,
  type IntroUsageGrant,
} from "@/lib/usage/introGrant"
import { getCreditErrorMessage } from "@/lib/usage/errorMessages"

const userId = "11111111-1111-1111-1111-111111111111"

function query(result: unknown) {
  const builder = {
    select() {
      return builder
    },
    eq() {
      return builder
    },
    gt() {
      return builder
    },
    lte() {
      return builder
    },
    limit() {
      return builder
    },
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }
  return builder
}

describe("intro credit grant", () => {
  it("includes plan_id intro and the catalog allowance", () => {
    const row = introUsageGrant({
      userId,
      periodStart: "2026-10-26T23:13:53.000Z",
      periodEnd: "2026-11-02T23:13:53.000Z",
      now: new Date("2026-10-26T23:13:53.000Z"),
    })
    assert.equal(row.plan_id, "intro")
    assert.equal(row.plan_code, "intro")
    assert.equal(row.credits_allocated, 40)
    assert.equal(row.credits_used, 0)
    assert.equal(row.period_start, "2026-10-26")
    assert.equal(USER_USAGE_CONFLICT, "user_id,period_start,plan_code")
  })

  it("does not grant a second row when the webhook is retried", async () => {
    const rows: IntroUsageGrant[] = []
    const db = {
      from() {
        return {
          select() {
            return {
              eq() {
                return this
              },
              maybeSingle: async () => ({
                data: rows[0] ? { user_id: rows[0].user_id } : null,
                error: null,
              }),
            }
          },
          insert: async (row: IntroUsageGrant) => {
            rows.push(row)
            return { error: null }
          },
        }
      },
    }
    const input = {
      userId,
      periodStart: "2026-10-26T23:13:53.000Z",
      periodEnd: "2026-11-02T23:13:53.000Z",
    }
    const first = await grantIntroUsage(db, input)
    const second = await grantIntroUsage(db, input)
    assert.deepEqual(first, { ok: true, granted: true })
    assert.deepEqual(second, { ok: true, granted: false })
    assert.equal(rows.length, 1)
    assert.equal(rows[0].plan_id, "intro")
    assert.equal(rows[0].credits_used, 0)
  })

  it("accepts a 1.5 credit render and refuses one that would pass 40", () => {
    assert.equal(creditsAfterConsumption(0, 1.5, 40), 1.5)
    assert.equal(creditsAfterConsumption(38.5, 1.5, 40), 40)
    assert.equal(creditsAfterConsumption(39, 1.5, 40), null)
  })
})

describe("enforceCredits intro allowance", () => {
  it("allows a fresh intro user with 40 credits", async () => {
    const now = new Date("2026-10-27T18:00:00.000Z")
    const db = {
      from(table: string) {
        if (table === "demo_access") return query({ data: [] })
        if (table === "profiles") {
          return query({
            data: { current_plan: "intro", subscription_status: "active" },
            error: null,
          })
        }
        if (table === "user_usage") {
          return query({
            data: [
              {
                period_start: "2026-10-26",
                period_end: "2026-11-02T23:13:53.000Z",
                credits_allocated: 40,
                credits_used: 0,
              },
            ],
          })
        }
        return query({ data: null, error: { message: `unexpected ${table}` } })
      },
    }
    const result = await enforceCredits(userId, { db: db as never, now })
    assert.equal(result.allow, true)
    assert.equal(result.planId, "intro")
    assert.equal(result.creditsRemaining, 40)
    assert.equal(result.monthlyLimit, 40)
    assert.equal(result.reason, undefined)
  })

  it("says the 7-day window has ended when Stripe's period is over", async () => {
    const now = new Date("2026-11-03T18:00:00.000Z")
    const db = {
      from(table: string) {
        if (table === "demo_access") return query({ data: [] })
        if (table === "profiles") {
          return query({
            data: {
              current_plan: "intro",
              subscription_status: "active",
              stripe_subscription_id: "sub_test",
            },
            error: null,
          })
        }
        if (table === "user_usage") return query({ data: [] })
        return query({ data: null, error: { message: `unexpected ${table}` } })
      },
    }
    const result = await enforceCredits(userId, {
      db: db as never,
      now,
      loadSubscription: async () => ({
        status: "active",
        current_period_start: Math.floor(Date.parse("2026-10-26T00:00:00.000Z") / 1000),
        current_period_end: Math.floor(Date.parse("2026-11-02T00:00:00.000Z") / 1000),
      }),
    })
    assert.equal(result.allow, false)
    assert.equal(result.reason, "intro_period_ended")
    assert.equal(getCreditErrorMessage(result.reason), "Your 7-day First Job Test window has ended.")
  })
})

describe("user_usage migration", () => {
  it("adds intro, fractional credits, and a plan_code key", () => {
    const sql = readFileSync(new URL("../../supabase/migrations/20261027180000_fix_user_usage.sql", import.meta.url), "utf8")
    assert.match(sql, /values \('intro', 40\)/)
    assert.match(sql, /credits_used type numeric\(10,2\)/)
    assert.match(sql, /primary key \(user_id, period_start, plan_code\)/)
    assert.match(sql, /credits_used \+ p_amount\) <= credits_allocated/)
    assert.match(sql, /stripe_subscription_id text/)
  })
})

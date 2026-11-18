// Run: pnpm exec tsx --test lib/stripe/subscriptionDeleted.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { applySubscriptionDeleted } from "@/lib/stripe/subscriptionDeleted"

type Call = { table: string; op: string; payload?: unknown; options?: unknown; eq?: [string, unknown] }

function fakeDb(errors: { profiles?: { message: string }; subscriptions?: { message: string } } = {}) {
  const calls: Call[] = []
  const db = {
    from(table: string) {
      return {
        upsert(payload: unknown, options: unknown) {
          calls.push({ table, op: "upsert", payload, options })
          return Promise.resolve({ error: errors[table as "subscriptions"] ?? null })
        },
        update(payload: unknown) {
          return {
            eq(column: string, value: unknown) {
              calls.push({ table, op: "update", payload, eq: [column, value] })
              return Promise.resolve({ error: errors[table as "profiles"] ?? null })
            },
          }
        },
      }
    },
  }
  return { db, calls }
}

const base = {
  profileId: "11111111-1111-1111-1111-111111111111",
  profileSubscriptionId: "sub_1",
  subscriptionId: "sub_1",
  customerId: "cus_1",
  planCode: "intro",
  periodStartIso: "2026-11-09T23:13:00.000Z",
  periodEndIso: "2026-11-16T23:13:00.000Z",
  nowIso: "2026-11-16T23:14:00.000Z",
}

describe("applySubscriptionDeleted", () => {
  it("marks the profile canceled without touching current_plan (NOT NULL column)", async () => {
    const { db, calls } = fakeDb()
    const result = await applySubscriptionDeleted(db, base)
    assert.deepEqual(result, { ok: true })
    const profileCall = calls.find((c) => c.table === "profiles")
    assert.ok(profileCall)
    assert.deepEqual(profileCall.payload, { subscription_status: "canceled" })
    assert.ok(!("current_plan" in (profileCall.payload as object)))
    assert.deepEqual(profileCall.eq, ["id", base.profileId])
  })

  it("upserts the subscriptions row so a missing row is created as canceled", async () => {
    const { db, calls } = fakeDb()
    await applySubscriptionDeleted(db, base)
    const subCall = calls.find((c) => c.table === "subscriptions")
    assert.ok(subCall)
    assert.equal(subCall.op, "upsert")
    assert.deepEqual(subCall.options, { onConflict: "user_id" })
    assert.deepEqual(subCall.payload, {
      user_id: base.profileId,
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      plan_code: "intro",
      status: "canceled",
      cancel_at_period_end: false,
      current_period_start: base.periodStartIso,
      current_period_end: base.periodEndIso,
      updated_at: base.nowIso,
    })
  })

  it("does not overwrite plan_code or period with nulls when Stripe omits them", async () => {
    const { db, calls } = fakeDb()
    await applySubscriptionDeleted(db, { ...base, planCode: null, periodStartIso: null, periodEndIso: null })
    const payload = calls.find((c) => c.table === "subscriptions")?.payload as Record<string, unknown>
    assert.ok(!("plan_code" in payload))
    assert.ok(!("current_period_start" in payload))
    assert.ok(!("current_period_end" in payload))
  })

  it("ignores deletion of an old subscription when the profile has a newer one", async () => {
    const { db, calls } = fakeDb()
    const result = await applySubscriptionDeleted(db, { ...base, profileSubscriptionId: "sub_new" })
    assert.deepEqual(result, { ok: true, skipped: "not_current_subscription" })
    assert.equal(calls.length, 0)
  })

  it("still cancels when the profile has no stored subscription id", async () => {
    const { db } = fakeDb()
    const result = await applySubscriptionDeleted(db, { ...base, profileSubscriptionId: null })
    assert.deepEqual(result, { ok: true })
  })

  it("reports a profile write failure so the webhook returns 500 and Stripe retries", async () => {
    const { db } = fakeDb({ profiles: { message: "null value in column current_plan" } })
    const result = await applySubscriptionDeleted(db, base)
    assert.equal(result.ok, false)
    assert.match((result as { error: string }).error, /profile update failed/)
  })

  it("reports a subscriptions write failure", async () => {
    const { db } = fakeDb({ subscriptions: { message: "duplicate key" } })
    const result = await applySubscriptionDeleted(db, base)
    assert.equal(result.ok, false)
    assert.match((result as { error: string }).error, /subscriptions upsert failed/)
  })
})

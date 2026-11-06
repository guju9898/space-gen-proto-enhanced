// Run: pnpm exec tsx --test lib/usage/userUsagePeriods.test.ts
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { CATALOG } from "@/lib/pricing/catalog"
import type { CreditErrorRow } from "@/lib/usage/creditErrors"
import {
  USER_USAGE_CONFLICT,
  grantIntroUsage,
  type IntroUsageGrant,
} from "@/lib/usage/introGrant"

const userId = "22222222-2222-2222-2222-222222222222"

type UsageRow = {
  user_id: string
  period_start: string
  plan_code: string
  credits_used: number
  credits_allocated: number | null
}

/**
 * Mirrors consume_user_credits insert path: update the live period row, else insert
 * a new (user_id, period_start, plan_code) row. uniqueUserIndex models the leftover
 * UNIQUE(user_id) index that blocked November rows in production.
 */
function consumePeriod(
  rows: UsageRow[],
  input: {
    userId: string
    periodStart: string
    planCode: string
    amount: number
    creditsAllocated: number | null
    uncapped?: boolean
  },
  uniqueUserIndex: boolean
): UsageRow {
  const existing = rows.find(
    (row) =>
      row.user_id === input.userId &&
      row.period_start === input.periodStart &&
      row.plan_code === input.planCode
  )
  if (existing) {
    const next = existing.credits_used + input.amount
    if (!input.uncapped && existing.credits_allocated != null && next > existing.credits_allocated) {
      throw new Error("Credits exhausted")
    }
    existing.credits_used = next
    return existing
  }

  if (uniqueUserIndex && rows.some((row) => row.user_id === input.userId)) {
    throw new Error('duplicate key value violates unique constraint "user_usage_unique_user"')
  }

  if (
    rows.some(
      (row) =>
        row.user_id === input.userId &&
        row.period_start === input.periodStart &&
        row.plan_code === input.planCode
    )
  ) {
    throw new Error(`duplicate key value violates unique constraint on (${USER_USAGE_CONFLICT})`)
  }

  if (!input.uncapped && (input.creditsAllocated == null || input.amount > input.creditsAllocated)) {
    throw new Error("Credits exhausted")
  }

  const created: UsageRow = {
    user_id: input.userId,
    period_start: input.periodStart,
    plan_code: input.planCode,
    credits_used: input.amount,
    credits_allocated: input.creditsAllocated,
  }
  rows.push(created)
  return created
}

/** Grant DB that tracks period_start from the eq chain. */
function periodAwareGrantDb(rows: IntroUsageGrant[]) {
  return {
    from() {
      const filters: Record<string, string> = {}
      const chain = {
        select() {
          return chain
        },
        eq(column: string, value: string) {
          filters[column] = value
          return chain
        },
        maybeSingle: async () => {
          const existing = rows.find(
            (row) =>
              row.user_id === filters.user_id &&
              row.plan_code === filters.plan_code &&
              row.period_start === filters.period_start
          )
          return {
            data: existing ? { user_id: existing.user_id } : null,
            error: null,
          }
        },
        insert: async (row: IntroUsageGrant) => {
          const clash = rows.find(
            (existing) =>
              existing.user_id === row.user_id &&
              existing.period_start === row.period_start &&
              existing.plan_code === row.plan_code
          )
          if (clash) return { error: { code: "23505", message: "duplicate key" } }
          rows.push(row)
          return { error: null }
        },
      }
      return chain
    },
  }
}

describe("user_usage period rows", () => {
  it("drops the leftover UNIQUE(user_id) index", () => {
    const sql = readFileSync(
      new URL("../../supabase/migrations/20261106000000_drop_user_usage_unique_user.sql", import.meta.url),
      "utf8"
    )
    assert.match(sql, /drop constraint user_usage_unique_user/)
    assert.match(sql, /drop index if exists public\.user_usage_unique_user/)
  })

  it("creates a November professional row when an October row already exists", () => {
    const rows: UsageRow[] = [
      {
        user_id: userId,
        period_start: "2026-10-01",
        plan_code: "professional",
        credits_used: 12,
        credits_allocated: 500,
      },
    ]

    assert.throws(
      () =>
        consumePeriod(
          rows,
          {
            userId,
            periodStart: "2026-11-01",
            planCode: "professional",
            amount: 1,
            creditsAllocated: 500,
          },
          true
        ),
      /user_usage_unique_user/
    )

    const november = consumePeriod(
      rows,
      {
        userId,
        periodStart: "2026-11-01",
        planCode: "professional",
        amount: 1,
        creditsAllocated: 500,
      },
      false
    )
    assert.equal(november.period_start, "2026-11-01")
    assert.equal(november.credits_used, 1)
    assert.equal(rows.length, 2)
    assert.equal(rows[0].period_start, "2026-10-01")
    assert.equal(rows[0].credits_used, 12)
  })

  it("creates a November business row the same way", () => {
    const rows: UsageRow[] = [
      {
        user_id: userId,
        period_start: "2026-10-01",
        plan_code: "business",
        credits_used: 80,
        credits_allocated: null,
      },
    ]
    const november = consumePeriod(
      rows,
      {
        userId,
        periodStart: "2026-11-01",
        planCode: "business",
        amount: 1,
        creditsAllocated: null,
        uncapped: true,
      },
      false
    )
    assert.equal(november.plan_code, "business")
    assert.equal(rows.length, 2)
  })

  it("grants a new intro week after the previous week expires", async () => {
    const rows: IntroUsageGrant[] = [
      {
        user_id: userId,
        plan_id: "intro",
        plan_code: "intro",
        period_start: "2026-10-26",
        period_end: "2026-11-02T23:13:53.000Z",
        credits_allocated: CATALOG.intro.credits,
        credits_used: 40,
        updated_at: "2026-10-26T23:13:53.000Z",
      },
    ]
    const logs: CreditErrorRow[] = []
    const result = await grantIntroUsage(
      periodAwareGrantDb(rows),
      {
        userId,
        periodStart: "2026-11-02T23:13:53.000Z",
        periodEnd: "2026-11-09T23:13:53.000Z",
      },
      {
        stage: "webhook_grant",
        logError: async (row) => {
          logs.push(row)
        },
      }
    )
    assert.deepEqual(result, { ok: true, granted: true })
    assert.equal(rows.length, 2)
    assert.equal(rows[1].period_start, "2026-11-02")
    assert.equal(rows[1].credits_used, 0)
    assert.equal(rows[1].credits_allocated, 40)
    assert.equal(logs.length, 0)
  })

  it("does not double-insert when a grant is retried", async () => {
    const rows: IntroUsageGrant[] = []
    const db = periodAwareGrantDb(rows)
    const input = {
      userId,
      periodStart: "2026-11-02T23:13:53.000Z",
      periodEnd: "2026-11-09T23:13:53.000Z",
    }
    const first = await grantIntroUsage(db, input, { stage: "webhook_grant", logError: async () => {} })
    const second = await grantIntroUsage(db, input, { stage: "webhook_grant", logError: async () => {} })
    assert.deepEqual(first, { ok: true, granted: true })
    assert.deepEqual(second, { ok: true, granted: false })
    assert.equal(rows.length, 1)
    assert.equal(rows[0].credits_used, 0)
  })

  it("logs credit_errors when an intro insert fails", async () => {
    const logs: CreditErrorRow[] = []
    const db = {
      from() {
        const chain = {
          select() {
            return chain
          },
          eq() {
            return chain
          },
          maybeSingle: async () => ({ data: null, error: null }),
          insert: async () => ({
            error: {
              code: "23514",
              message: 'duplicate key value violates unique constraint "user_usage_unique_user"',
            },
          }),
        }
        return chain
      },
    }
    const result = await grantIntroUsage(
      db,
      {
        userId,
        periodStart: "2026-11-02T00:00:00.000Z",
        periodEnd: "2026-11-09T00:00:00.000Z",
      },
      {
        stage: "grant",
        logError: async (row) => {
          logs.push(row)
        },
      }
    )
    assert.equal(result.ok, false)
    assert.equal(logs.length, 1)
    assert.equal(logs[0].stage, "grant")
    assert.match(logs[0].message, /user_usage_unique_user/)
  })
})

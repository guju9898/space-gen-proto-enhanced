import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildFirstPaidTransitionFields,
  computeAiPackExpiresAt,
  daysRemainingUntilPackExpiry,
  isPackExpirationReminderEligible,
} from "./pack-expiration"
import { AI_RENDER_PACK_EXPIRATION_DAYS } from "./config"

describe("AI pack paid transition fields", () => {
  it("AI paid transition calculates 90-day expiry", () => {
    const paidAtMs = Date.parse("2026-01-01T00:00:00.000Z")
    const fields = buildFirstPaidTransitionFields({
      family: "ai-render-pack",
      existingPaidAt: null,
      existingPackExpiresAt: null,
      paidAtMs,
    })
    assert.equal(fields.paid_at, "2026-01-01T00:00:00.000Z")
    assert.equal(
      fields.pack_expires_at,
      computeAiPackExpiresAt(paidAtMs).toISOString()
    )
    const days =
      (Date.parse(fields.pack_expires_at!) - paidAtMs) / (24 * 60 * 60 * 1000)
    assert.equal(days, AI_RENDER_PACK_EXPIRATION_DAYS)
  })

  it("duplicate paid event does not shift paid_at", () => {
    const fields = buildFirstPaidTransitionFields({
      family: "ai-render-pack",
      existingPaidAt: "2026-01-01T00:00:00.000Z",
      existingPackExpiresAt: "2026-04-01T00:00:00.000Z",
      paidAtMs: Date.parse("2026-02-01T00:00:00.000Z"),
    })
    assert.equal(fields.paid_at, undefined)
    assert.equal(fields.pack_expires_at, undefined)
  })

  it("duplicate paid event does not shift pack_expires_at", () => {
    const fields = buildFirstPaidTransitionFields({
      family: "ai-render-pack",
      existingPaidAt: "2026-01-01T00:00:00.000Z",
      existingPackExpiresAt: "2026-04-01T00:00:00.000Z",
      paidAtMs: Date.now(),
    })
    assert.ok(!("pack_expires_at" in fields) || fields.pack_expires_at === undefined)
  })

  it("Build-Ready gets paid_at but no pack_expires_at", () => {
    const fields = buildFirstPaidTransitionFields({
      family: "build-ready",
      existingPaidAt: null,
      existingPackExpiresAt: null,
      paidAtMs: Date.parse("2026-01-01T00:00:00.000Z"),
    })
    assert.equal(fields.paid_at, "2026-01-01T00:00:00.000Z")
    assert.equal(fields.pack_expires_at, undefined)
  })
})

describe("pack expiration reminder eligibility", () => {
  const now = Date.parse("2026-06-01T12:00:00.000Z")

  function row(overrides: Record<string, unknown> = {}) {
    return {
      id: "req-1",
      family: "ai-render-pack",
      payment_status: "paid",
      status: "in_progress",
      pack_expires_at: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
      expiration_reminder_sent_at: null,
      ...overrides,
    }
  }

  it("15 days remaining → not reminder eligible", () => {
    assert.equal(
      isPackExpirationReminderEligible(
        row({
          pack_expires_at: new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        now
      ),
      false
    )
  })

  it("14 days remaining → eligible", () => {
    assert.equal(
      isPackExpirationReminderEligible(
        row({
          pack_expires_at: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        now
      ),
      true
    )
  })

  it("expired → not reminder eligible", () => {
    assert.equal(
      isPackExpirationReminderEligible(
        row({
          pack_expires_at: new Date(now - 60_000).toISOString(),
        }),
        now
      ),
      false
    )
  })

  it("completed → not eligible", () => {
    assert.equal(isPackExpirationReminderEligible(row({ status: "completed" }), now), false)
  })

  it("delivered → not eligible", () => {
    assert.equal(isPackExpirationReminderEligible(row({ status: "delivered" }), now), false)
  })

  it("already reminded → not eligible", () => {
    assert.equal(
      isPackExpirationReminderEligible(
        row({ expiration_reminder_sent_at: new Date(now).toISOString() }),
        now
      ),
      false
    )
  })

  it("daysRemaining ceil math", () => {
    assert.equal(
      daysRemainingUntilPackExpiry(
        new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(),
        now
      ),
      14
    )
  })
})

describe("cron auth fail-closed contract", () => {
  function authorizeCron(secret: string | undefined, header: string | null): boolean {
    if (!secret || !secret.trim()) return false
    if (!header) return false
    return header === `Bearer ${secret}`
  }

  it("missing CRON_SECRET must fail closed", () => {
    assert.equal(authorizeCron("", "Bearer something"), false)
    assert.equal(authorizeCron(undefined, "Bearer something"), false)
  })

  it("wrong authorization → unauthorized", () => {
    assert.equal(authorizeCron("expected-secret", "Bearer wrong"), false)
  })

  it("correct authorization passes", () => {
    assert.equal(authorizeCron("expected-secret", "Bearer expected-secret"), true)
  })

  it("concurrent claim modeled as second null update", () => {
    let claimedAt: string | null = null
    function claim(nowIso: string): boolean {
      if (claimedAt !== null) return false
      claimedAt = nowIso
      return true
    }
    assert.equal(claim("t1"), true)
    assert.equal(claim("t2"), false)
  })
})

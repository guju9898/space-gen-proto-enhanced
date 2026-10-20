import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { decideAttribution } from "@/lib/affiliates/attribution"
import { normalizeAffiliateCode } from "@/lib/affiliates/codes"
import {
  basisFromInvoiceTotals,
  commissionEndsAt,
  decideCommission,
  reversalAmountCents,
} from "@/lib/affiliates/commission"
import { parseAffiliateCookie, serializeAffiliateCookie } from "@/lib/affiliates/cookie"
import { decideReferralDiscount } from "@/lib/affiliates/discount"
import { decidePayout } from "@/lib/affiliates/payout"
import { decideCampaign, evaluatePromotion, PRICING_CAMPAIGNS } from "@/lib/pricing/promotions"

const DAY = 24 * 60 * 60 * 1000
const start = new Date("2026-01-01T00:00:00.000Z")
const ends = commissionEndsAt(start, 365)

test("25 percent of collected subscription revenue excludes tax", () => {
  const totals = basisFromInvoiceTotals({
    amountPaidCents: 10_000,
    totalCents: 10_000,
    totalExcludingTaxCents: 9_200,
  })
  assert.equal(totals.basisCents, 9_200)
  const decision = decideCommission({
    programActive: true,
    selfReferral: false,
    hasAttribution: true,
    paidAt: start,
    commissionEndsAt: null,
    billingReason: "subscription_create",
    currency: "usd",
    amountPaidCents: 10_000,
    taxCents: 10_000 - totals.basisCents,
    commissionBps: 2500,
    maxBps: 2500,
    duplicateInvoice: false,
  })
  assert.equal(decision.action, "earn")
  assert.equal(decision.amountCents, 2_300)
})

test("renewals inside twelve months earn and the boundary does not", () => {
  const inside = decideCommission({
    programActive: true,
    selfReferral: false,
    hasAttribution: true,
    paidAt: new Date(ends.getTime() - 1000),
    commissionEndsAt: ends,
    billingReason: "subscription_cycle",
    currency: "usd",
    amountPaidCents: 9_800,
    taxCents: 0,
    commissionBps: 2500,
    maxBps: 2500,
    duplicateInvoice: false,
  })
  const outside = decideCommission({
    programActive: true,
    selfReferral: false,
    hasAttribution: true,
    paidAt: ends,
    commissionEndsAt: ends,
    billingReason: "subscription_cycle",
    currency: "usd",
    amountPaidCents: 9_800,
    taxCents: 0,
    commissionBps: 2500,
    maxBps: 2500,
    duplicateInvoice: false,
  })
  assert.equal(inside.action, "earn")
  assert.equal(inside.amountCents, 2_450)
  assert.equal(outside.reason, "outside_window")
})

test("unpaid, failed, duplicate, self, and over-max rates do not earn", () => {
  const base = {
    programActive: true,
    selfReferral: false,
    hasAttribution: true,
    paidAt: start,
    commissionEndsAt: ends,
    billingReason: "subscription_cycle",
    currency: "usd",
    amountPaidCents: 9_800,
    taxCents: 0,
    commissionBps: 2500,
    maxBps: 2500,
    duplicateInvoice: false,
  }
  assert.equal(decideCommission({ ...base, amountPaidCents: 0 }).reason, "unpaid")
  assert.equal(decideCommission({ ...base, billingReason: "manual" }).reason, "not_subscription")
  assert.equal(decideCommission({ ...base, duplicateInvoice: true }).reason, "duplicate")
  assert.equal(decideCommission({ ...base, selfReferral: true }).reason, "self_referral")
  assert.equal(decideCommission({ ...base, commissionBps: 2600 }).reason, "invalid_rate")
  assert.equal(decideCommission({ ...base, programActive: false }).reason, "program_inactive")
})

test("refunds and a second partial refund reverse without exceeding the original", () => {
  const first = reversalAmountCents({
    originalAmountCents: 2_500,
    alreadyReversedCents: 0,
    amountPaidCents: 10_000,
    amountRefundedCents: 4_000,
  })
  const second = reversalAmountCents({
    originalAmountCents: 2_500,
    alreadyReversedCents: first,
    amountPaidCents: 10_000,
    amountRefundedCents: 10_000,
  })
  assert.equal(first, 1_000)
  assert.equal(second, 1_500)
  assert.equal(first + second, 2_500)
})

test("attribution keeps the first code and rejects self, expired, and forged codes", () => {
  const approved = {
    programActive: true,
    cookieCode: "PARTNER1",
    affiliateStatus: "approved" as const,
    affiliateUserId: "aff",
    customerUserId: "cus",
    existingCode: null,
  }
  assert.equal(decideAttribution(approved).action, "bind")
  assert.equal(decideAttribution({ ...approved, customerUserId: "aff" }).reason, "self_referral")
  assert.equal(decideAttribution({ ...approved, cookieExpired: true, cookieCode: null }).reason, "expired")
  assert.equal(decideAttribution({ ...approved, bodyCode: "OTHER" }).reason, "cookie_mismatch")
  assert.equal(normalizeAffiliateCode("drop table"), null)
  assert.equal(
    decideAttribution({ ...approved, existingCode: "PARTNER1" }).reason,
    "already_attributed"
  )
  assert.equal(
    decideAttribution({ ...approved, existingCode: "KEPT" }).reason,
    "override_blocked"
  )
  const issued = new Date("2026-01-01T00:00:00.000Z")
  const cookie = serializeAffiliateCookie("PARTNER1", issued)
  assert.equal(parseAffiliateCookie(cookie, new Date(issued.getTime() + 29 * DAY), 30)?.code, "PARTNER1")
  assert.equal(parseAffiliateCookie(cookie, new Date(issued.getTime() + 30 * DAY), 30), null)
})

test("referral discounts do not stack with promotions or Human Polish", () => {
  const blocked = decideCampaign(
    { ...PRICING_CAMPAIGNS[0], enabled: true },
    {
      plan: "professional",
      interval: "month",
      now: new Date("2026-11-02T00:00:00.000Z"),
      redeemedCount: 0,
      surface: "subscription",
      hasAffiliate: true,
      couponConfigured: true,
    }
  )
  assert.equal(blocked.eligible, false)
  assert.equal(blocked.reason, "affiliate_stack")
  const promo = evaluatePromotion({
    campaignId: "candidate-initial-20",
    plan: "professional",
    interval: "month",
    now: new Date("2026-11-02T00:00:00.000Z"),
    redeemedCount: 0,
    surface: "subscription",
    hasAffiliate: true,
    couponConfigured: true,
  })
  assert.equal(promo.eligible, false)
  assert.equal(
    decideReferralDiscount({
      programActive: true,
      hasAttribution: true,
      selfReferral: false,
      surface: "subscription",
      customerDiscountPercent: 0,
      couponConfigured: false,
      promotion: promo,
    }).reason,
    "discount_not_approved"
  )
  assert.equal(
    decideReferralDiscount({
      programActive: true,
      hasAttribution: true,
      selfReferral: false,
      surface: "human_polish",
      customerDiscountPercent: 10,
      couponConfigured: true,
      promotion: null,
    }).reason,
    "human_polish"
  )
  assert.equal(
    decideReferralDiscount({
      programActive: true,
      hasAttribution: true,
      selfReferral: false,
      surface: "subscription",
      customerDiscountPercent: 10,
      couponConfigured: true,
      promotion: { eligible: true, campaignId: "candidate-initial-20", reason: "ok" },
    }).reason,
    "stacks_with_promotion"
  )
})

test("payouts wait for the hold and require a manual payment reference", () => {
  const available = new Date("2026-02-01T00:00:00.000Z")
  assert.equal(
    decidePayout({
      status: "requested",
      action: "approve",
      now: new Date("2026-01-15T00:00:00.000Z"),
      earliestAvailableAt: available,
      amountCents: 1000,
    }).reason,
    "hold_open"
  )
  assert.equal(
    decidePayout({
      status: "requested",
      action: "approve",
      now: available,
      earliestAvailableAt: available,
      amountCents: 1000,
    }).next,
    "approved"
  )
  assert.equal(
    decidePayout({
      status: "approved",
      action: "mark_paid",
      now: available,
      earliestAvailableAt: available,
      amountCents: 1000,
      externalReference: "ach-42",
    }).next,
    "paid"
  )
  assert.equal(
    decidePayout({
      status: "paid",
      action: "mark_paid",
      now: available,
      earliestAvailableAt: available,
      amountCents: 1000,
      externalReference: "ach-42",
    }).reason,
    "invalid_transition"
  )
})

test("migration locks financial writes to the service role", () => {
  const sql = fs.readFileSync(
    path.join(process.cwd(), "supabase/migrations/20261020190000_affiliate_program.sql"),
    "utf8"
  )
  assert.match(sql, /enable row level security/)
  assert.match(sql, /revoke all on public\.affiliate_commissions from anon, authenticated/)
  assert.match(sql, /grant select on public\.affiliate_commissions to authenticated/)
  assert.doesNotMatch(sql, /for insert[\s\S]*affiliate_commissions/i)
  assert.match(sql, /affiliate_commissions_one_earn_per_invoice/)
  assert.match(sql, /status text not null default 'draft'/)
})

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  evaluateBuildReadyApproval,
  evaluateBuildReadyPaymentAccess,
  evaluateBuildReadyPaymentRequest,
  evaluateBuildReadyRevision,
  evaluateBuildReadyWebhookPaid,
  parseUsdDollarsToCents,
} from "./build-ready-guards"
import {
  generateBuildReadyPaymentToken,
  hashBuildReadyPaymentToken,
  paymentHashesEqual,
} from "./payment-token"

function sanitize(raw: string, max: number): string {
  return raw.trim().slice(0, max)
}

describe("parseUsdDollarsToCents", () => {
  it("parses whole dollars", () => {
    const r = parseUsdDollarsToCents("599")
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.cents, 59900)
  })

  it("parses two decimals", () => {
    const r = parseUsdDollarsToCents("12.34")
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.cents, 1234)
  })

  it("rejects zero", () => {
    assert.equal(parseUsdDollarsToCents("0").ok, false)
    assert.equal(parseUsdDollarsToCents("0.00").ok, false)
  })

  it("rejects malformed", () => {
    assert.equal(parseUsdDollarsToCents("12.345").ok, false)
    assert.equal(parseUsdDollarsToCents("$12").ok, false)
    assert.equal(parseUsdDollarsToCents("abc").ok, false)
    assert.equal(parseUsdDollarsToCents("").ok, false)
  })
})

describe("evaluateBuildReadyApproval", () => {
  const base = {
    family: "build-ready",
    paymentStatus: "unpaid",
    status: "submitted",
    sanitize,
  }

  it("submitted 2D → fixed 59900", () => {
    const r = evaluateBuildReadyApproval({
      ...base,
      approvedPackage: "essentials-2d",
    })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.approvedPackage, "essentials-2d")
      assert.equal(r.approvedAmountCents, 59900)
    }
  })

  it("submitted 3D → fixed 89900", () => {
    const r = evaluateBuildReadyApproval({
      ...base,
      approvedPackage: "essentials-3d",
    })
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.approvedAmountCents, 89900)
  })

  it("custom valid cents → accepted", () => {
    const r = evaluateBuildReadyApproval({
      ...base,
      approvedPackage: "custom",
      customAmountDollars: "1250.00",
    })
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.approvedAmountCents, 125000)
  })

  it("custom 0 → rejected", () => {
    assert.equal(
      evaluateBuildReadyApproval({
        ...base,
        approvedPackage: "custom",
        customAmountDollars: "0",
      }).ok,
      false
    )
  })

  it("malformed custom → rejected", () => {
    assert.equal(
      evaluateBuildReadyApproval({
        ...base,
        approvedPackage: "custom",
        customAmountDollars: "12.999",
      }).ok,
      false
    )
  })

  it("paid request approval → rejected", () => {
    assert.equal(
      evaluateBuildReadyApproval({
        ...base,
        paymentStatus: "paid",
        approvedPackage: "essentials-2d",
      }).ok,
      false
    )
  })

  it("AI request → rejected", () => {
    assert.equal(
      evaluateBuildReadyApproval({
        ...base,
        family: "ai-render-pack",
        approvedPackage: "essentials-2d",
      }).ok,
      false
    )
  })
})

describe("Build-Ready payment token access", () => {
  const raw = generateBuildReadyPaymentToken()
  const hash = hashBuildReadyPaymentToken(raw)
  const baseRow = {
    id: "22222222-2222-2222-2222-222222222222",
    family: "build-ready",
    payment_status: "unpaid",
    status: "ready_for_payment",
    approved_package: "essentials-2d",
    approved_amount: 59900,
    payment_request_id: "33333333-3333-3333-3333-333333333333",
    build_ready_payment_token_hash: hash,
    build_ready_payment_expires_at: new Date(Date.now() + 60_000).toISOString(),
  }

  it("correct token → valid", () => {
    assert.equal(
      evaluateBuildReadyPaymentAccess({
        row: baseRow,
        providedHash: hashBuildReadyPaymentToken(raw),
        hashesEqual: paymentHashesEqual,
      }).ok,
      true
    )
  })

  it("wrong token → rejected", () => {
    assert.equal(
      evaluateBuildReadyPaymentAccess({
        row: baseRow,
        providedHash: hashBuildReadyPaymentToken("wrong"),
        hashesEqual: paymentHashesEqual,
      }).ok,
      false
    )
  })

  it("expired → rejected", () => {
    const r = evaluateBuildReadyPaymentAccess({
      row: {
        ...baseRow,
        build_ready_payment_expires_at: new Date(Date.now() - 1000).toISOString(),
      },
      providedHash: hash,
      hashesEqual: paymentHashesEqual,
    })
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.code, "payment_expired")
  })

  it("wrong request (null row) → rejected", () => {
    assert.equal(
      evaluateBuildReadyPaymentAccess({
        row: null,
        providedHash: hash,
        hashesEqual: paymentHashesEqual,
      }).ok,
      false
    )
  })

  it("paid → rejected", () => {
    assert.equal(
      evaluateBuildReadyPaymentAccess({
        row: { ...baseRow, payment_status: "paid" },
        providedHash: hash,
        hashesEqual: paymentHashesEqual,
      }).ok,
      false
    )
  })

  it("missing approved amount → rejected", () => {
    assert.equal(
      evaluateBuildReadyPaymentAccess({
        row: { ...baseRow, approved_amount: null },
        providedHash: hash,
        hashesEqual: paymentHashesEqual,
      }).ok,
      false
    )
  })

  it("submitted unreviewed status → rejected", () => {
    assert.equal(
      evaluateBuildReadyPaymentAccess({
        row: { ...baseRow, status: "submitted" },
        providedHash: hash,
        hashesEqual: paymentHashesEqual,
      }).ok,
      false
    )
  })
})

describe("evaluateBuildReadyPaymentRequest", () => {
  it("ready_for_payment + valid approval → eligible", () => {
    assert.equal(
      evaluateBuildReadyPaymentRequest({
        family: "build-ready",
        paymentStatus: "unpaid",
        status: "ready_for_payment",
        approvedPackage: "essentials-2d",
        approvedAmount: 59900,
        scopeReviewedAt: new Date().toISOString(),
      }).ok,
      true
    )
  })

  it("submitted → rejected", () => {
    assert.equal(
      evaluateBuildReadyPaymentRequest({
        family: "build-ready",
        paymentStatus: "unpaid",
        status: "submitted",
        approvedPackage: "essentials-2d",
        approvedAmount: 59900,
        scopeReviewedAt: new Date().toISOString(),
      }).ok,
      false
    )
  })
})

describe("evaluateBuildReadyWebhookPaid", () => {
  const base = {
    family: "build-ready",
    paymentStatus: "pending",
    status: "awaiting_payment",
    approvedPackage: "essentials-2d",
    approvedAmountCents: 59900,
    paymentRequestId: "pr-1",
    storedCheckoutSessionId: "cs_1",
    metadata: {
      productType: "human_polish",
      family: "build-ready",
      requestId: "req-1",
      paymentRequestId: "pr-1",
      approvedPackage: "essentials-2d",
    },
    eventRequestId: "req-1",
    eventCheckoutSessionId: "cs_1",
    amountTotalCents: 59900,
    currency: "usd",
    stripePaid: true,
  }

  it("correct approved amount → allowed", () => {
    assert.equal(evaluateBuildReadyWebhookPaid(base).ok, true)
  })

  it("wrong amount → rejected", () => {
    assert.equal(
      evaluateBuildReadyWebhookPaid({ ...base, amountTotalCents: 1 }).ok,
      false
    )
  })

  it("wrong paymentRequestId → rejected", () => {
    assert.equal(
      evaluateBuildReadyWebhookPaid({
        ...base,
        metadata: { ...base.metadata, paymentRequestId: "other" },
      }).ok,
      false
    )
  })

  it("wrong approved package → rejected", () => {
    assert.equal(
      evaluateBuildReadyWebhookPaid({
        ...base,
        metadata: { ...base.metadata, approvedPackage: "custom" },
      }).ok,
      false
    )
  })

  it("stale session → rejected", () => {
    assert.equal(
      evaluateBuildReadyWebhookPaid({
        ...base,
        eventCheckoutSessionId: "cs_old",
      }).ok,
      false
    )
  })

  it("wrong currency → rejected", () => {
    assert.equal(
      evaluateBuildReadyWebhookPaid({ ...base, currency: "eur" }).ok,
      false
    )
  })
})

describe("evaluateBuildReadyRevision", () => {
  const base = {
    family: "build-ready",
    paymentStatus: "paid",
    status: "delivered",
    approvedPackage: "essentials-2d",
    revisionCount: 0,
    note: "Adjust planting labels",
    sanitize,
  }

  it("2D round 0 → 1", () => {
    const r = evaluateBuildReadyRevision({ ...base, revisionCount: 0 })
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.nextCount, 1)
  })

  it("2D round 1 → 2", () => {
    const r = evaluateBuildReadyRevision({ ...base, revisionCount: 1 })
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.nextCount, 2)
  })

  it("2D round 2 → blocked", () => {
    assert.equal(
      evaluateBuildReadyRevision({ ...base, revisionCount: 2 }).ok,
      false
    )
  })

  it("3D allows through round 3", () => {
    const r = evaluateBuildReadyRevision({
      ...base,
      approvedPackage: "essentials-3d",
      revisionCount: 2,
    })
    assert.equal(r.ok, true)
    if (r.ok) assert.equal(r.nextCount, 3)
    assert.equal(
      evaluateBuildReadyRevision({
        ...base,
        approvedPackage: "essentials-3d",
        revisionCount: 3,
      }).ok,
      false
    )
  })

  it("AI → blocked", () => {
    assert.equal(
      evaluateBuildReadyRevision({ ...base, family: "ai-render-pack" }).ok,
      false
    )
  })

  it("unpaid → blocked", () => {
    assert.equal(
      evaluateBuildReadyRevision({ ...base, paymentStatus: "unpaid" }).ok,
      false
    )
  })

  it("wrong status → blocked", () => {
    assert.equal(
      evaluateBuildReadyRevision({ ...base, status: "in_progress" }).ok,
      false
    )
  })
})

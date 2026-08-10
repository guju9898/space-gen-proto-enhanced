import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  canMarkCompletedFromStatus,
  evaluateBriefMatchCorrection,
  evaluateReplacementUploadAccess,
  evaluateRushApprove,
  isFixedRushApproveAvailable,
} from "./ops-guards"
import {
  generateReplacementUploadToken,
  hashReplacementUploadToken,
  replacementHashesEqual,
  replacementUploadExpiresAt,
} from "./replacement-token"

function sanitize(raw: string, max: number): string {
  return raw.trim().slice(0, max)
}

describe("replacement upload token crypto", () => {
  it("valid hash verifies", () => {
    const raw = generateReplacementUploadToken()
    const hash = hashReplacementUploadToken(raw)
    assert.equal(replacementHashesEqual(hash, hashReplacementUploadToken(raw)), true)
  })

  it("wrong token rejected", () => {
    const a = hashReplacementUploadToken(generateReplacementUploadToken())
    const b = hashReplacementUploadToken(generateReplacementUploadToken())
    assert.equal(replacementHashesEqual(a, b), false)
  })
})

describe("evaluateReplacementUploadAccess", () => {
  const baseRow = {
    id: "11111111-1111-1111-1111-111111111111",
    family: "ai-render-pack",
    payment_status: "paid",
    status: "needs_information",
    replacement_upload_token_hash: hashReplacementUploadToken("good-token"),
    replacement_upload_expires_at: replacementUploadExpiresAt().toISOString(),
  }

  it("accepts valid paid needs_information token", () => {
    const decision = evaluateReplacementUploadAccess({
      row: baseRow,
      providedHash: hashReplacementUploadToken("good-token"),
      hashesEqual: replacementHashesEqual,
    })
    assert.equal(decision.ok, true)
  })

  it("rejects wrong token", () => {
    const decision = evaluateReplacementUploadAccess({
      row: baseRow,
      providedHash: hashReplacementUploadToken("bad-token"),
      hashesEqual: replacementHashesEqual,
    })
    assert.equal(decision.ok, false)
    if (!decision.ok) assert.equal(decision.status, 403)
  })

  it("rejects expired token", () => {
    const decision = evaluateReplacementUploadAccess({
      row: {
        ...baseRow,
        replacement_upload_expires_at: new Date(Date.now() - 1000).toISOString(),
      },
      providedHash: hashReplacementUploadToken("good-token"),
      hashesEqual: replacementHashesEqual,
      nowMs: Date.now(),
    })
    assert.equal(decision.ok, false)
    if (!decision.ok) {
      assert.equal(decision.status, 410)
      assert.equal(decision.code, "replacement_expired")
    }
  })

  it("rejects wrong status", () => {
    const decision = evaluateReplacementUploadAccess({
      row: { ...baseRow, status: "files_accepted" },
      providedHash: hashReplacementUploadToken("good-token"),
      hashesEqual: replacementHashesEqual,
    })
    assert.equal(decision.ok, false)
  })

  it("rejects missing request", () => {
    const decision = evaluateReplacementUploadAccess({
      row: null,
      providedHash: hashReplacementUploadToken("good-token"),
      hashesEqual: replacementHashesEqual,
    })
    assert.equal(decision.ok, false)
  })

  it("accepted files invalidate access when token cleared", () => {
    const decision = evaluateReplacementUploadAccess({
      row: {
        ...baseRow,
        status: "files_accepted",
        replacement_upload_token_hash: null,
        replacement_upload_expires_at: null,
      },
      providedHash: hashReplacementUploadToken("good-token"),
      hashesEqual: replacementHashesEqual,
    })
    assert.equal(decision.ok, false)
  })
})

describe("rush approve guards", () => {
  it("unpaid 25 may approve", () => {
    assert.equal(
      evaluateRushApprove({
        paymentStatus: "pending",
        requestedPackage: "25",
        rushRequested: true,
        rushApproved: false,
      }).ok,
      true
    )
  })

  it("unpaid 50 may approve", () => {
    assert.equal(
      evaluateRushApprove({
        paymentStatus: "pending",
        requestedPackage: "50",
        rushRequested: true,
        rushApproved: false,
      }).ok,
      true
    )
  })

  it("paid 25 cannot approve", () => {
    const d = evaluateRushApprove({
      paymentStatus: "paid",
      requestedPackage: "25",
      rushRequested: true,
      rushApproved: false,
    })
    assert.equal(d.ok, false)
    if (!d.ok) assert.match(d.error, /before payment/i)
  })

  it("paid 50 cannot approve", () => {
    const d = evaluateRushApprove({
      paymentStatus: "paid",
      requestedPackage: "50",
      rushRequested: true,
      rushApproved: false,
    })
    assert.equal(d.ok, false)
  })

  it("100 normal approve blocked", () => {
    const d = evaluateRushApprove({
      paymentStatus: "pending",
      requestedPackage: "100",
      rushRequested: true,
      rushApproved: false,
    })
    assert.equal(d.ok, false)
    if (!d.ok) assert.match(d.error, /manual custom review/i)
  })

  it("reject remains valid independently of approve UI helper", () => {
    assert.equal(
      isFixedRushApproveAvailable({
        paymentStatus: "paid",
        requestedPackage: "25",
        rushRequested: true,
        rushApproved: false,
      }),
      false
    )
    assert.equal(
      isFixedRushApproveAvailable({
        paymentStatus: "pending",
        requestedPackage: "100",
        rushRequested: true,
        rushApproved: false,
      }),
      false
    )
  })
})

describe("brief-match correction guards", () => {
  it("paid first_batch_delivered + revision_count=0 allowed", () => {
    const d = evaluateBriefMatchCorrection(
      {
        family: "ai-render-pack",
        paymentStatus: "paid",
        status: "first_batch_delivered",
        revisionCount: 0,
        note: "Missing must-have terrace seating",
      },
      sanitize
    )
    assert.equal(d.ok, true)
  })

  it("wrong status blocked", () => {
    const d = evaluateBriefMatchCorrection(
      {
        family: "ai-render-pack",
        paymentStatus: "paid",
        status: "in_progress",
        revisionCount: 0,
        note: "note",
      },
      sanitize
    )
    assert.equal(d.ok, false)
  })

  it("unpaid blocked", () => {
    const d = evaluateBriefMatchCorrection(
      {
        family: "ai-render-pack",
        paymentStatus: "pending",
        status: "first_batch_delivered",
        revisionCount: 0,
        note: "note",
      },
      sanitize
    )
    assert.equal(d.ok, false)
  })

  it("Build-Ready blocked", () => {
    const d = evaluateBriefMatchCorrection(
      {
        family: "build-ready",
        paymentStatus: "paid",
        status: "first_batch_delivered",
        revisionCount: 0,
        note: "note",
      },
      sanitize
    )
    assert.equal(d.ok, false)
  })

  it("revision_count >= 1 blocked", () => {
    const d = evaluateBriefMatchCorrection(
      {
        family: "ai-render-pack",
        paymentStatus: "paid",
        status: "first_batch_delivered",
        revisionCount: 1,
        note: "note",
      },
      sanitize
    )
    assert.equal(d.ok, false)
    if (!d.ok) assert.match(d.error, /already been used/i)
  })
})

describe("completion guard", () => {
  it("delivered → completed allowed", () => {
    assert.equal(canMarkCompletedFromStatus("delivered"), true)
  })

  it("first_batch_delivered → blocked", () => {
    assert.equal(canMarkCompletedFromStatus("first_batch_delivered"), false)
  })

  it("in_progress → blocked", () => {
    assert.equal(canMarkCompletedFromStatus("in_progress"), false)
  })
})

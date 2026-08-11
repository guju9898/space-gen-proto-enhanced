import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  evaluateRightsPermissionAccess,
  evaluateRightsPermissionDecision,
  evaluateRightsPermissionIssue,
} from "./rights-guards"
import {
  generateRightsPermissionToken,
  hashRightsPermissionToken,
  rightsHashesEqual,
  rightsPermissionExpiresAt,
} from "./rights-token"

function baseRow(overrides: Record<string, unknown> = {}) {
  const token = generateRightsPermissionToken()
  const hash = hashRightsPermissionToken(token)
  return {
    token,
    hash,
    row: {
      id: "11111111-1111-4111-8111-111111111111",
      payment_status: "paid",
      status: "completed",
      rights_permission_status: "requested",
      rights_permission_token_hash: hash,
      rights_permission_expires_at: rightsPermissionExpiresAt().toISOString(),
      ...overrides,
    },
  }
}

describe("rights permission access", () => {
  it("correct token validates", () => {
    const { token, row } = baseRow()
    const decision = evaluateRightsPermissionAccess({
      row,
      providedHash: hashRightsPermissionToken(token),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, true)
  })

  it("wrong token rejected", () => {
    const { row } = baseRow()
    const decision = evaluateRightsPermissionAccess({
      row,
      providedHash: hashRightsPermissionToken("wrong-token-value-xxxxxxxxxxxx"),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, false)
  })

  it("expired token rejected", () => {
    const { token, row } = baseRow({
      rights_permission_expires_at: new Date(Date.now() - 60_000).toISOString(),
    })
    const decision = evaluateRightsPermissionAccess({
      row,
      providedHash: hashRightsPermissionToken(token),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, false)
    if (!decision.ok) assert.equal(decision.code, "rights_expired")
  })

  it("wrong request / missing row rejected", () => {
    const decision = evaluateRightsPermissionAccess({
      row: null,
      providedHash: hashRightsPermissionToken("x"),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, false)
  })

  it("unpaid rejected", () => {
    const { token, row } = baseRow({ payment_status: "unpaid" })
    const decision = evaluateRightsPermissionAccess({
      row,
      providedHash: hashRightsPermissionToken(token),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, false)
  })

  it("non-completed rejected", () => {
    const { token, row } = baseRow({ status: "delivered" })
    const decision = evaluateRightsPermissionAccess({
      row,
      providedHash: hashRightsPermissionToken(token),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, false)
  })

  it("requested status required", () => {
    const { token, row } = baseRow({ rights_permission_status: "not_requested" })
    const decision = evaluateRightsPermissionAccess({
      row,
      providedHash: hashRightsPermissionToken(token),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, false)
  })
})

describe("rights permission decisions", () => {
  it("Allow → granted", () => {
    const d = evaluateRightsPermissionDecision("allow")
    assert.equal(d.ok, true)
    if (d.ok) {
      assert.equal(d.nextStatus, "granted")
      assert.equal(d.rightsPermissionGranted, true)
    }
  })

  it("Decline → declined", () => {
    const d = evaluateRightsPermissionDecision("decline")
    assert.equal(d.ok, true)
    if (d.ok) {
      assert.equal(d.nextStatus, "declined")
      assert.equal(d.rightsPermissionGranted, false)
    }
  })
})

describe("rights permission issue / reissue", () => {
  it("granted cannot reissue", () => {
    const d = evaluateRightsPermissionIssue({
      paymentStatus: "paid",
      status: "completed",
      rightsPermissionStatus: "granted",
      rightsPermissionExpiresAt: null,
    })
    assert.equal(d.ok, false)
  })

  it("declined cannot reissue", () => {
    const d = evaluateRightsPermissionIssue({
      paymentStatus: "paid",
      status: "completed",
      rightsPermissionStatus: "declined",
      rightsPermissionExpiresAt: null,
    })
    assert.equal(d.ok, false)
  })

  it("expired requested token may be reissued", () => {
    const d = evaluateRightsPermissionIssue({
      paymentStatus: "paid",
      status: "completed",
      rightsPermissionStatus: "requested",
      rightsPermissionExpiresAt: new Date(Date.now() - 1000).toISOString(),
    })
    assert.equal(d.ok, true)
    if (d.ok) assert.equal(d.mode, "reissue")
  })

  it("active requested token cannot spam resend", () => {
    const d = evaluateRightsPermissionIssue({
      paymentStatus: "paid",
      status: "completed",
      rightsPermissionStatus: "requested",
      rightsPermissionExpiresAt: rightsPermissionExpiresAt().toISOString(),
    })
    assert.equal(d.ok, false)
  })

  it("not_requested may issue", () => {
    const d = evaluateRightsPermissionIssue({
      paymentStatus: "paid",
      status: "completed",
      rightsPermissionStatus: "not_requested",
      rightsPermissionExpiresAt: null,
    })
    assert.equal(d.ok, true)
    if (d.ok) assert.equal(d.mode, "issue")
  })

  it("token cleared after final decision is modeled by access failure", () => {
    const { token, row } = baseRow({
      rights_permission_status: "granted",
      rights_permission_token_hash: null,
      rights_permission_expires_at: null,
    })
    const decision = evaluateRightsPermissionAccess({
      row,
      providedHash: hashRightsPermissionToken(token),
      hashesEqual: rightsHashesEqual,
    })
    assert.equal(decision.ok, false)
  })
})

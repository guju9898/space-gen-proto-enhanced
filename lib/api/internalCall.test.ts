import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { INTERNAL_CALL_HEADER, internalCallToken, isInternalCall } from "./internalCall"

describe("internal call guard", () => {
  it("accepts only the derived token", () => {
    const token = internalCallToken("s3cret")!
    assert.equal(isInternalCall(new Request("https://x", { headers: { [INTERNAL_CALL_HEADER]: token } }), "s3cret"), true)
    assert.equal(isInternalCall(new Request("https://x", { headers: { [INTERNAL_CALL_HEADER]: "nope" } }), "s3cret"), false)
    assert.equal(isInternalCall(new Request("https://x"), "s3cret"), false)
    assert.equal(isInternalCall(new Request("https://x", { headers: { [INTERNAL_CALL_HEADER]: token } }), undefined), false)
  })
  it("does not reveal the secret", () => {
    assert.ok(!internalCallToken("s3cret")!.includes("s3cret"))
  })
})

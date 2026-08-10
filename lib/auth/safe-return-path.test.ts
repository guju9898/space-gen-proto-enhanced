import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  SAFE_LOCAL_RETURN_PATH_FALLBACK,
  buildLoginRedirectHref,
  safeLocalReturnPath,
  trySafeLocalReturnPath,
} from "./safe-return-path"

describe("trySafeLocalReturnPath / safeLocalReturnPath", () => {
  it("accepts valid local paths", () => {
    assert.equal(trySafeLocalReturnPath("/admin/human-polish"), "/admin/human-polish")
    assert.equal(
      trySafeLocalReturnPath("/admin/human-polish/abc"),
      "/admin/human-polish/abc"
    )
    assert.equal(trySafeLocalReturnPath("/studio/projects"), "/studio/projects")
    assert.equal(trySafeLocalReturnPath("/?example=1"), "/?example=1")
  })

  it("accepts URI-encoded valid paths", () => {
    assert.equal(
      trySafeLocalReturnPath("%2Fadmin%2Fhuman-polish"),
      "/admin/human-polish"
    )
  })

  it("rejects open redirects and malformed values", () => {
    const invalid = [
      "https://evil.example",
      "http://evil.example",
      "//evil.example",
      "javascript:alert(1)",
      "admin/human-polish",
      "",
      "   ",
      "%E0%A4%A", // malformed encoding
      "/%2F%2Fevil.example", // decodes to //evil.example
    ]
    for (const value of invalid) {
      assert.equal(
        trySafeLocalReturnPath(value),
        null,
        `expected invalid: ${JSON.stringify(value)}`
      )
      assert.equal(
        safeLocalReturnPath(value),
        SAFE_LOCAL_RETURN_PATH_FALLBACK,
        `expected fallback for: ${JSON.stringify(value)}`
      )
    }
  })

  it("falls back for null/undefined", () => {
    assert.equal(safeLocalReturnPath(null), SAFE_LOCAL_RETURN_PATH_FALLBACK)
    assert.equal(safeLocalReturnPath(undefined), SAFE_LOCAL_RETURN_PATH_FALLBACK)
  })
})

describe("buildLoginRedirectHref", () => {
  it("builds login redirect with encoded next for admin list", () => {
    assert.equal(
      buildLoginRedirectHref("/admin/human-polish"),
      "/?login=1&next=%2Fadmin%2Fhuman-polish"
    )
  })

  it("builds login redirect with encoded next for admin detail", () => {
    assert.equal(
      buildLoginRedirectHref("/admin/human-polish/abc"),
      "/?login=1&next=%2Fadmin%2Fhuman-polish%2Fabc"
    )
  })

  it("falls back when return path is unsafe", () => {
    assert.equal(
      buildLoginRedirectHref("//evil.example"),
      "/?login=1&next=%2Fadmin%2Fhuman-polish"
    )
  })
})

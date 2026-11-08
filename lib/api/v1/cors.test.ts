// Run: pnpm exec tsx --test lib/api/v1/cors.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildCorsHeaders,
  corsPreflight,
  getCorsMode,
  resolveAllowOrigin,
  withCors,
} from "@/lib/api/v1/cors"

function req(headers: Record<string, string> = {}) {
  return new Request("https://www.renderspace.ai/api/v1/credits", { headers })
}

describe("public API CORS", () => {
  it("defaults to wildcard when env unset", () => {
    assert.deepEqual(getCorsMode(undefined), { kind: "wildcard" })
    assert.deepEqual(getCorsMode(""), { kind: "wildcard" })
    assert.deepEqual(getCorsMode("*"), { kind: "wildcard" })
  })

  it("parses allowlist origins", () => {
    const mode = getCorsMode("https://a.example, https://b.example")
    assert.equal(mode.kind, "allowlist")
    if (mode.kind === "allowlist") {
      assert.equal(mode.origins.has("https://a.example"), true)
      assert.equal(mode.origins.has("https://b.example"), true)
    }
  })

  it("reflects allowlisted Origin and rejects others", () => {
    const mode = getCorsMode("https://sandbox.example.com")
    assert.equal(
      resolveAllowOrigin(req({ Origin: "https://sandbox.example.com" }), mode),
      "https://sandbox.example.com"
    )
    assert.equal(resolveAllowOrigin(req({ Origin: "https://evil.example" }), mode), null)
    // S2S (no Origin) works without ACAO in allowlist mode
    assert.equal(resolveAllowOrigin(req(), mode), null)
  })

  it("uses * in wildcard mode without credentials", () => {
    const headers = buildCorsHeaders(req({ Origin: "https://sandbox.example.com" }), {}, {
      kind: "wildcard",
    })
    assert.equal(headers.get("Access-Control-Allow-Origin"), "*")
    assert.equal(headers.get("Access-Control-Allow-Credentials"), null)
    assert.equal(
      headers.get("Access-Control-Allow-Headers"),
      "Authorization, Content-Type, X-API-Key"
    )
    assert.match(headers.get("Access-Control-Expose-Headers") || "", /X-Credits-Remaining/)
  })

  it("handles OPTIONS preflight", () => {
    const res = corsPreflight(req({ Origin: "https://sandbox.example.com" }), ["GET", "OPTIONS"], {
      kind: "wildcard",
    })
    assert.equal(res.status, 204)
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*")
    assert.equal(res.headers.get("Access-Control-Allow-Methods"), "GET, OPTIONS")
  })

  it("returns 403 for disallowed preflight Origin", () => {
    const res = corsPreflight(req({ Origin: "https://evil.example" }), ["GET", "OPTIONS"], {
      kind: "allowlist",
      origins: new Set(["https://sandbox.example.com"]),
    })
    assert.equal(res.status, 403)
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), null)
  })

  it("withCors merges onto existing responses", () => {
    const response = withCors(
      req({ Origin: "https://sandbox.example.com" }),
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", "X-RateLimit-Limit": "60" },
      })
    )
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*")
    assert.equal(response.headers.get("X-RateLimit-Limit"), "60")
  })
})

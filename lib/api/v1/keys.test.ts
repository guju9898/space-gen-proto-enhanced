// Run: pnpm exec tsx --test lib/api/v1/keys.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { API_ELIGIBLE_PLANS } from "@/lib/api/v1/access"
import {
  generateApiKeyPlaintext,
  hashApiKey,
  looksLikeApiKey,
} from "@/lib/api/v1/keys"

describe("public API keys", () => {
  it("generates rs_live_ keys that hash stably", () => {
    const first = generateApiKeyPlaintext()
    assert.equal(looksLikeApiKey(first.plaintext), true)
    assert.match(first.plaintext, /^rs_live_/)
    assert.equal(first.prefix, first.plaintext.slice(0, 16))
    assert.equal(hashApiKey(first.plaintext), first.hash)
    assert.notEqual(hashApiKey(first.plaintext + "x"), first.hash)
  })

  it("limits API access to professional and business", () => {
    assert.equal(API_ELIGIBLE_PLANS.has("professional"), true)
    assert.equal(API_ELIGIBLE_PLANS.has("business"), true)
    assert.equal(API_ELIGIBLE_PLANS.has("intro"), false)
    assert.equal(API_ELIGIBLE_PLANS.has("demo"), false)
  })
})

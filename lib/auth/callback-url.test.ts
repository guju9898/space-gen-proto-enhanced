import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { resolveAuthCallbackUrl } from "./callback-url"

describe("resolveAuthCallbackUrl", () => {
  it("uses canonical www for production apex and www hosts", () => {
    assert.equal(
      resolveAuthCallbackUrl("https://renderspace.ai", null, "production"),
      "https://www.renderspace.ai/auth/callback"
    )
    assert.equal(
      resolveAuthCallbackUrl("https://www.renderspace.ai", null, "production"),
      "https://www.renderspace.ai/auth/callback"
    )
  })

  it("preserves Preview origin and does not force production", () => {
    assert.equal(
      resolveAuthCallbackUrl(
        "https://space-gen-git-preview.vercel.app",
        "https://www.renderspace.ai",
        "production"
      ),
      "https://space-gen-git-preview.vercel.app/auth/callback"
    )
  })

  it("uses localhost origin in local development", () => {
    assert.equal(
      resolveAuthCallbackUrl("http://localhost:3000", null, "development"),
      "http://localhost:3000/auth/callback"
    )
  })

  it("falls back to NEXT_PUBLIC_APP_URL when browser origin is absent", () => {
    assert.equal(
      resolveAuthCallbackUrl(null, "https://www.renderspace.ai", "production"),
      "https://www.renderspace.ai/auth/callback"
    )
  })
})

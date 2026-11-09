// Run: pnpm exec tsx --test lib/api/v1/webhooks.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildWebhookPayload,
  decryptWebhookSecret,
  encryptWebhookSecret,
  generateWebhookSecretPlaintext,
  isPrivateOrMetadataIp,
  signWebhookBody,
  validateWebhookUrl,
  webhookEventFor,
} from "@/lib/api/v1/webhooks"

describe("public API webhooks", () => {
  it("accepts https URLs and rejects http / private / metadata targets", () => {
    assert.equal(validateWebhookUrl("https://hooks.example.com/rs").ok, true)
    assert.equal(validateWebhookUrl("http://hooks.example.com/rs").ok, false)
    assert.equal(validateWebhookUrl("https://localhost/hook").ok, false)
    assert.equal(validateWebhookUrl("https://127.0.0.1/hook").ok, false)
    assert.equal(validateWebhookUrl("https://10.0.0.8/hook").ok, false)
    assert.equal(validateWebhookUrl("https://192.168.1.1/hook").ok, false)
    assert.equal(validateWebhookUrl("https://169.254.169.254/latest").ok, false)
    assert.equal(validateWebhookUrl("https://metadata.google.internal/").ok, false)
    assert.equal(validateWebhookUrl("https://user:pass@example.com/h").ok, false)
    assert.equal(validateWebhookUrl("https://[::1]/hook").ok, false)
    assert.equal(validateWebhookUrl("https://[::ffff:127.0.0.1]/hook").ok, false)
    assert.equal(validateWebhookUrl("https://[fd00::1]/hook").ok, false)
    assert.equal(validateWebhookUrl("https://2130706433/hook").ok, false)
  })

  it("does not mistake ordinary hostnames for IPv6 ranges", () => {
    assert.equal(validateWebhookUrl("https://fdhooks.example.com/rs").ok, true)
    assert.equal(validateWebhookUrl("https://fcbarcelona.example/rs").ok, true)
    assert.equal(validateWebhookUrl("https://fe80.example.com/rs").ok, true)
    assert.equal(isPrivateOrMetadataIp("::ffff:a00:1"), true)
    assert.equal(isPrivateOrMetadataIp("2606:4700::1111"), false)
  })

  it("round-trips encrypted signing secrets and HMAC signatures", () => {
    process.env.API_KEY_PEPPER = "test-pepper-for-webhooks"
    const secret = generateWebhookSecretPlaintext()
    assert.match(secret, /^whsec_/)
    const enc = encryptWebhookSecret(secret)
    assert.notEqual(enc, secret)
    assert.equal(decryptWebhookSecret(enc), secret)

    const body = JSON.stringify({ id: "abc", status: "completed" })
    const ts = "1794182400"
    const sig = signWebhookBody(secret, body, ts)
    assert.match(sig, /^sha256=[a-f0-9]{64}$/)
    assert.equal(signWebhookBody(secret, body, ts), sig)
    assert.notEqual(signWebhookBody(secret, body + "x", ts), sig)
    // A replayed body with a new timestamp needs a new signature.
    assert.notEqual(signWebhookBody(secret, body, "1794182401"), sig)
  })

  it("builds the public webhook payload shape", () => {
    const payload = buildWebhookPayload({
      id: "11111111-1111-1111-1111-111111111111",
      status: "completed",
      result_image_url: "https://cdn.example.com/r.png",
      credits_charged: 2,
      error_message: null,
      created_at: "2026-11-08T12:00:00.000Z",
      completed_at: "2026-11-08T12:00:05.000Z",
    })
    assert.deepEqual(payload, {
      event: "render.completed",
      id: "11111111-1111-1111-1111-111111111111",
      status: "completed",
      image_url: "https://cdn.example.com/r.png",
      credits: { charged: 2 },
      error: null,
      created_at: "2026-11-08T12:00:00.000Z",
      completed_at: "2026-11-08T12:00:05.000Z",
    })
  })

  it("maps only terminal statuses to events", () => {
    assert.equal(webhookEventFor("completed"), "render.completed")
    assert.equal(webhookEventFor("failed"), "render.failed")
    assert.equal(webhookEventFor("running"), null)
  })
})

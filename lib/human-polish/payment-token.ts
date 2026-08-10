/**
 * Build-Ready payment-request tokens — separate from draft recovery and
 * replacement-upload tokens. Same entropy / hashing conventions.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto"
import { HUMAN_POLISH_BUILD_READY_PAYMENT_TTL_MS } from "./config"

const TOKEN_BYTES = 32

export function generateBuildReadyPaymentToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url")
}

export function hashBuildReadyPaymentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

/** Absolute expiry for a Build-Ready payment window starting at `fromMs`. */
export function buildReadyPaymentExpiresAt(fromMs: number = Date.now()): Date {
  return new Date(fromMs + HUMAN_POLISH_BUILD_READY_PAYMENT_TTL_MS)
}

/** Constant-time compare of two hex hashes. */
export function paymentHashesEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex")
    const bb = Buffer.from(b, "hex")
    if (ba.length !== bb.length || ba.length === 0) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

/**
 * Relative customer payment path. Caller joins with trusted origin.
 * Does not log or persist the raw token.
 */
export function buildBuildReadyPaymentPath(requestId: string, rawToken: string): string {
  const params = new URLSearchParams({ token: rawToken })
  return `/human-polish/pay/${encodeURIComponent(requestId)}?${params.toString()}`
}

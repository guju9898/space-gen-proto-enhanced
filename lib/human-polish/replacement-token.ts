/**
 * Paid replacement-upload tokens — separate from draft recovery.
 * Same entropy / hashing conventions as draft tokens.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto"
import { HUMAN_POLISH_REPLACEMENT_UPLOAD_TTL_MS } from "./config"

const TOKEN_BYTES = 32

export function generateReplacementUploadToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url")
}

export function hashReplacementUploadToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

/** Absolute expiry for a replacement-upload window starting at `fromMs`. */
export function replacementUploadExpiresAt(fromMs: number = Date.now()): Date {
  return new Date(fromMs + HUMAN_POLISH_REPLACEMENT_UPLOAD_TTL_MS)
}

/** Constant-time compare of two hex hashes. */
export function replacementHashesEqual(a: string, b: string): boolean {
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
 * Build the customer re-upload path (relative). Caller joins with trusted origin.
 * Does not log or persist the raw token.
 */
export function buildReplacementUploadPath(requestId: string, rawToken: string): string {
  const params = new URLSearchParams({ token: rawToken })
  return `/human-polish/reupload/${encodeURIComponent(requestId)}?${params.toString()}`
}

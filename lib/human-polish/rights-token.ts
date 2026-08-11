/**
 * Portfolio / case-study rights permission tokens — separate from draft,
 * replacement-upload, and Build-Ready payment tokens.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto"
import { HUMAN_POLISH_RIGHTS_PERMISSION_TTL_MS } from "./config"

const TOKEN_BYTES = 32

export function generateRightsPermissionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url")
}

export function hashRightsPermissionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

/** Absolute expiry for a rights permission window starting at `fromMs`. */
export function rightsPermissionExpiresAt(fromMs: number = Date.now()): Date {
  return new Date(fromMs + HUMAN_POLISH_RIGHTS_PERMISSION_TTL_MS)
}

/** Constant-time compare of two hex hashes. */
export function rightsHashesEqual(a: string, b: string): boolean {
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
 * Relative customer rights path. Caller joins with trusted origin.
 * Does not log or persist the raw token.
 */
export function buildRightsPermissionPath(requestId: string, rawToken: string): string {
  const params = new URLSearchParams({ token: rawToken })
  return `/human-polish/rights/${encodeURIComponent(requestId)}?${params.toString()}`
}

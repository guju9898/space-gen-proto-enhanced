/**
 * Draft recovery token helpers — random unguessable token, stored as SHA-256 hash.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto"
import { HUMAN_POLISH_DRAFT_TTL_MS } from "./config"

const TOKEN_BYTES = 32

export function generateDraftToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url")
}

export function hashDraftToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

/** Absolute expiry for an inactivity window starting at `fromMs` (default: now). */
export function draftExpiresAt(fromMs: number = Date.now()): Date {
  return new Date(fromMs + HUMAN_POLISH_DRAFT_TTL_MS)
}

/** Constant-time compare of two hex hashes. */
export function hashesEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex")
    const bb = Buffer.from(b, "hex")
    if (ba.length !== bb.length || ba.length === 0) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

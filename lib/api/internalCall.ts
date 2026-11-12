import { createHash, timingSafeEqual } from "node:crypto"

/**
 * Header that marks a server-to-server call inside this app (for example
 * /api/demo-render → /api/generate-interior). The value is derived from the service
 * role key, so it exists only on the server and changes when that key rotates.
 */
export const INTERNAL_CALL_HEADER = "x-renderspace-internal"

export function internalCallToken(secret = process.env.SUPABASE_SERVICE_ROLE_KEY): string | null {
  if (!secret) return null
  return createHash("sha256").update(`renderspace-internal:${secret}`).digest("hex")
}

export function isInternalCall(request: Request, secret = process.env.SUPABASE_SERVICE_ROLE_KEY): boolean {
  const expected = internalCallToken(secret)
  const got = request.headers.get(INTERNAL_CALL_HEADER)
  if (!expected || !got || got.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}

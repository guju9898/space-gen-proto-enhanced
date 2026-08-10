/**
 * Local return-path validation for post-login redirects.
 * Safe for client and server. Prevents open redirects.
 */

export const SAFE_LOCAL_RETURN_PATH_FALLBACK = "/admin/human-polish"

/**
 * Returns a validated same-origin path, or null if invalid.
 * Cookie/query values may be URI-encoded; decode before validating.
 */
export function trySafeLocalReturnPath(
  raw: string | null | undefined
): string | null {
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let decoded: string
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    return null
  }

  const path = decoded.trim()
  if (!path) return null

  // Exactly one leading slash; reject protocol-relative (//host) and abs URLs.
  if (!path.startsWith("/")) return null
  if (path.startsWith("//")) return null
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return null
  if (path.includes("://")) return null
  if (/[\u0000-\u001F\u007F]/.test(path)) return null

  return path
}

/** Validated local path, or fallback when invalid/missing. */
export function safeLocalReturnPath(
  raw: string | null | undefined,
  fallback: string = SAFE_LOCAL_RETURN_PATH_FALLBACK
): string {
  return trySafeLocalReturnPath(raw) ?? fallback
}

/**
 * Login modal entry with encoded local `next` (no cookie write).
 * Example: /?login=1&next=%2Fadmin%2Fhuman-polish
 */
export function buildLoginRedirectHref(returnPath: string): string {
  const safe = safeLocalReturnPath(returnPath)
  return `/?login=1&next=${encodeURIComponent(safe)}`
}

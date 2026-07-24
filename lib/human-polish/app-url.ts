/**
 * Server-safe application URL resolution for Human Polish.
 *
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL
 *   2. NEXT_PUBLIC_DOMAIN
 *   3. Trusted request Origin (browser same-origin requests)
 *   4. Local development fallback only when NODE_ENV !== "production"
 *
 * Does not trust X-Forwarded-Host / X-Forwarded-Proto. Does not accept
 * client-supplied redirect targets — callers must append fixed relative paths.
 */

const LOCAL_DEV_FALLBACK = "http://localhost:3000"

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "")
}

/**
 * Normalize an env-configured base URL.
 * Accepts a full URL or a bare hostname (prefixed with https://).
 * In production, HTTPS is required — http env values are rejected.
 */
function normalizeConfiguredBaseUrl(raw: string | undefined | null): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null

  let candidate = raw.trim()
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`
  }

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    console.error("[human-polish] Application URL must use HTTPS in production.")
    return null
  }

  // Origin only — no path, query, or trailing slash (prevents open-redirect footguns).
  return stripTrailingSlashes(`${url.protocol}//${url.host}`)
}

/**
 * Accept a browser Origin header only when it parses as a clean origin
 * (scheme + host, no credentials, no path other than "/").
 */
function normalizeTrustedOrigin(originHeader: string | null): string | null {
  if (!originHeader || !originHeader.trim()) return null

  let url: URL
  try {
    url = new URL(originHeader.trim())
  } catch {
    return null
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  if (url.username || url.password) return null
  if (url.pathname !== "/" || url.search || url.hash) {
    // Origin headers are scheme+host only; reject anything else.
    return null
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    return null
  }

  return stripTrailingSlashes(`${url.protocol}//${url.host}`)
}

export type ResolveAppUrlOptions = {
  /** Incoming request — Origin is used only after env vars are absent. */
  request?: Request
}

/**
 * Resolve the public application origin (no trailing slash).
 * Throws in production when no safe URL can be determined.
 */
export function resolveHumanPolishAppUrl(options: ResolveAppUrlOptions = {}): string {
  const fromAppUrl = normalizeConfiguredBaseUrl(process.env.NEXT_PUBLIC_APP_URL)
  if (fromAppUrl) return fromAppUrl

  const fromDomain = normalizeConfiguredBaseUrl(process.env.NEXT_PUBLIC_DOMAIN)
  if (fromDomain) return fromDomain

  if (options.request) {
    const fromOrigin = normalizeTrustedOrigin(options.request.headers.get("origin"))
    if (fromOrigin) return fromOrigin
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_DEV_FALLBACK
  }

  throw new Error(
    "Application URL is not configured. Set NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_DOMAIN."
  )
}

/**
 * Join a resolved origin with a fixed relative application path.
 * Rejects absolute URLs and protocol-relative paths to prevent open redirects.
 */
export function humanPolishAbsoluteUrl(origin: string, pathWithQuery: string): string {
  const base = stripTrailingSlashes(origin.trim())
  if (!pathWithQuery.startsWith("/") || pathWithQuery.startsWith("//")) {
    throw new Error("Human Polish absolute URLs must use a root-relative path.")
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(pathWithQuery)) {
    throw new Error("Human Polish absolute URLs must not include a scheme.")
  }
  return `${base}${pathWithQuery}`
}

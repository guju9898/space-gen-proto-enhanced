/**
 * Trusted auth callback URL for OAuth / browser-initiated auth redirects.
 *
 * Client priority:
 *   1. Active browser origin when it is not the production apex/www host
 *      (Preview, localhost, staging) — preserves Preview OAuth testing
 *   2. Canonical www for renderspace.ai / www.renderspace.ai
 *   3. NEXT_PUBLIC_APP_URL (normalized)
 *   4. localhost in development
 *   5. https://www.renderspace.ai
 *
 * Does not accept arbitrary user-supplied redirect origins.
 */

const CANONICAL_PRODUCTION_ORIGIN = "https://www.renderspace.ai"
const PRODUCTION_HOSTS = new Set(["www.renderspace.ai", "renderspace.ai"])
const AUTH_CALLBACK_PATH = "/auth/callback"
const LOCAL_DEV_ORIGIN = "http://localhost:3000"

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "")
}

function normalizeOrigin(raw: string | null | undefined): string | null {
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

  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  if (url.username || url.password) return null

  return stripTrailingSlashes(`${url.protocol}//${url.host}`)
}

function originToCallbackUrl(origin: string): string {
  const host = new URL(origin).hostname
  if (PRODUCTION_HOSTS.has(host)) {
    return `${CANONICAL_PRODUCTION_ORIGIN}${AUTH_CALLBACK_PATH}`
  }
  return `${origin}${AUTH_CALLBACK_PATH}`
}

/**
 * Resolve callback URL from an optional browser origin and env.
 * Exported for unit tests; prefer getAuthCallbackUrl() in app code.
 */
export function resolveAuthCallbackUrl(
  browserOrigin: string | null | undefined,
  appUrlEnv: string | null | undefined = process.env.NEXT_PUBLIC_APP_URL,
  nodeEnv: string | undefined = process.env.NODE_ENV
): string {
  const fromBrowser = normalizeOrigin(browserOrigin)
  if (fromBrowser) {
    return originToCallbackUrl(fromBrowser)
  }

  const fromEnv = normalizeOrigin(appUrlEnv)
  if (fromEnv) {
    return originToCallbackUrl(fromEnv)
  }

  if (nodeEnv !== "production") {
    return `${LOCAL_DEV_ORIGIN}${AUTH_CALLBACK_PATH}`
  }

  return `${CANONICAL_PRODUCTION_ORIGIN}${AUTH_CALLBACK_PATH}`
}

/**
 * Absolute `/auth/callback` URL for signInWithOAuth / similar browser flows.
 * Safe to call from client components.
 */
export function getAuthCallbackUrl(): string {
  const browserOrigin =
    typeof window !== "undefined" ? window.location?.origin : null
  return resolveAuthCallbackUrl(browserOrigin)
}

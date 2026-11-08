/**
 * CORS for public Bearer-key `/api/v1/*` routes (browser clients + marketplace sandboxes).
 *
 * Policy:
 * - Prefer `PUBLIC_API_CORS_ORIGINS` (comma-separated allowlist) and reflect a matching Origin.
 * - If unset (or set to `*`), allow `Access-Control-Allow-Origin: *` for simple API-key use.
 * - Requests with no Origin (server-to-server) always succeed; CORS headers are optional.
 * - Never set `Access-Control-Allow-Credentials` (unsafe with `*`, unnecessary for Bearer keys).
 */

const ALLOW_HEADERS = "Authorization, Content-Type, X-API-Key"
const EXPOSE_HEADERS = "X-RateLimit-Limit, X-RateLimit-Remaining, X-Credits-Remaining"
const DEFAULT_MAX_AGE = "86400"

export type CorsMode = { kind: "wildcard" } | { kind: "allowlist"; origins: Set<string> }

/** Parse PUBLIC_API_CORS_ORIGINS. Empty / unset / lone `*` → wildcard mode. */
export function getCorsMode(envValue = process.env.PUBLIC_API_CORS_ORIGINS): CorsMode {
  const raw = envValue?.trim()
  if (!raw || raw === "*") return { kind: "wildcard" }
  const origins = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  )
  if (origins.size === 0 || (origins.size === 1 && origins.has("*"))) {
    return { kind: "wildcard" }
  }
  return { kind: "allowlist", origins }
}

/**
 * Resolve Access-Control-Allow-Origin for this request.
 * Returns null when the Origin is present but not allowed (omit ACAO).
 * Returns "*" or a reflected origin when allowed.
 * When there is no Origin (S2S), returns "*" in wildcard mode and null in allowlist mode.
 */
export function resolveAllowOrigin(
  request: Request,
  mode: CorsMode = getCorsMode()
): string | null {
  const origin = request.headers.get("Origin")?.trim() || null

  if (mode.kind === "wildcard") {
    return "*"
  }

  if (!origin) return null
  return mode.origins.has(origin) ? origin : null
}

export type CorsBuildOptions = {
  /** Allowed methods for preflight (Access-Control-Allow-Methods). */
  methods?: string[]
  /** Access-Control-Max-Age seconds for preflight. */
  maxAge?: string
}

/** Build CORS response headers for a request. Omits ACAO when Origin is disallowed. */
export function buildCorsHeaders(
  request: Request,
  options: CorsBuildOptions = {},
  mode: CorsMode = getCorsMode()
): Headers {
  const headers = new Headers()
  const allowOrigin = resolveAllowOrigin(request, mode)

  if (allowOrigin) {
    headers.set("Access-Control-Allow-Origin", allowOrigin)
    if (allowOrigin !== "*") {
      headers.set("Vary", "Origin")
    }
  } else if (mode.kind === "allowlist" && request.headers.get("Origin")) {
    // Disallowed browser Origin: still Vary so caches don't leak a prior ACAO.
    headers.set("Vary", "Origin")
  }

  headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS)
  headers.set("Access-Control-Expose-Headers", EXPOSE_HEADERS)

  if (options.methods?.length) {
    headers.set("Access-Control-Allow-Methods", options.methods.join(", "))
  }
  if (options.maxAge) {
    headers.set("Access-Control-Max-Age", options.maxAge)
  }

  // Intentionally no Access-Control-Allow-Credentials.
  return headers
}

function mergeCorsInto(response: Response, cors: Headers): Response {
  const headers = new Headers(response.headers)
  cors.forEach((value, key) => {
    if (key.toLowerCase() === "vary") {
      const existing = headers.get("Vary")
      if (existing) {
        const parts = new Set(
          existing
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
        parts.add(value)
        headers.set("Vary", [...parts].join(", "))
      } else {
        headers.set("Vary", value)
      }
      return
    }
    headers.set(key, value)
  })
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/** Attach CORS headers to an API response (including auth errors). */
export function withCors(request: Request, response: Response): Response {
  return mergeCorsInto(response, buildCorsHeaders(request))
}

/** OPTIONS preflight for Bearer-key public routes. */
export function corsPreflight(
  request: Request,
  methods: string[],
  mode: CorsMode = getCorsMode()
): Response {
  const allowOrigin = resolveAllowOrigin(request, mode)
  const origin = request.headers.get("Origin")?.trim()

  // Browser preflight with a disallowed Origin → 403 without ACAO.
  if (mode.kind === "allowlist" && origin && !allowOrigin) {
    return new Response(null, {
      status: 403,
      headers: { Vary: "Origin" },
    })
  }

  const headers = buildCorsHeaders(
    request,
    { methods, maxAge: DEFAULT_MAX_AGE },
    mode
  )
  return new Response(null, { status: 204, headers })
}

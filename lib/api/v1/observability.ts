import { createHash } from "crypto"

export type PublicApiLogLevel = "info" | "warn" | "error"

export type PublicApiLogEvent = {
  level: PublicApiLogLevel
  route: string
  status: number
  /** Stable API error code when known (e.g. internal_error, rate_limited). */
  code?: string
  /** Opaque hash of the caller user id — never the raw UUID. */
  userIdHash?: string
  /** Short safe message; must not include API keys, tokens, or peppers. */
  message?: string
}

/** Hash a user id for log correlation without storing the raw UUID. */
export function hashUserIdForLogs(userId: string): string {
  return createHash("sha256").update(userId, "utf8").digest("hex").slice(0, 16)
}

/**
 * Emit one JSON line for Vercel / platform log drains.
 * Shape: { source: "public_api", level, route, status, userIdHash?, code?, message? }
 * Never pass API keys, Authorization headers, or peppers into `message`.
 */
export function logPublicApiEvent(event: PublicApiLogEvent): void {
  const line = {
    source: "public_api" as const,
    level: event.level,
    route: event.route,
    status: event.status,
    ...(event.code ? { code: event.code } : {}),
    ...(event.userIdHash ? { userIdHash: event.userIdHash } : {}),
    ...(event.message ? { message: event.message.slice(0, 200) } : {}),
  }
  const payload = JSON.stringify(line)
  if (event.level === "error") console.error(payload)
  else if (event.level === "warn") console.warn(payload)
  else console.log(payload)
}

/** Convenience for 5xx responses from public API routes. */
export function logPublicApi5xx(input: {
  route: string
  status: number
  code?: string
  userId?: string | null
  message?: string
}): void {
  logPublicApiEvent({
    level: "error",
    route: input.route,
    status: input.status,
    code: input.code,
    userIdHash: input.userId ? hashUserIdForLogs(input.userId) : undefined,
    message: input.message,
  })
}

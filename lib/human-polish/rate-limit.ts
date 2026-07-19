/**
 * Rate limiting for Human Polish guest endpoints.
 *
 * Production: Upstash Redis sliding-window limiter (distributed, works across
 * serverless instances). Requires UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN.
 *
 * Local development (Upstash env vars absent): a controlled in-memory fallback
 * is used. It is NOT distributed and must not be relied on in production —
 * it resets per process and is per-instance only.
 *
 * Failure policy: if Upstash is configured but the request errors, we FAIL
 * CLOSED (deny with a short retry) so an outage cannot silently disable limits.
 *
 * Never log tokens or submitted PII.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const upstashConfigured = Boolean(REDIS_URL && REDIS_TOKEN)

let redis: Redis | null = null
if (upstashConfigured) {
  redis = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string })
}

/** One Ratelimit instance per (limit, windowMs) pair, created lazily. */
const limiterCache = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const cacheKey = `${limit}:${windowMs}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "hp-rl",
      analytics: false,
    })
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

// --- In-memory fallback (local dev only; non-distributed) ------------------

type Bucket = { timestamps: number[] }
const buckets = new Map<string, Bucket>()

function checkInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }
  const cutoff = now - windowMs
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff)

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket)
    const oldest = bucket.timestamps[0] ?? now
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { ok: false, remaining: 0, retryAfterSeconds }
  }

  bucket.timestamps.push(now)
  buckets.set(key, bucket)
  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    retryAfterSeconds: 0,
  }
}

// --- Public API ------------------------------------------------------------

/**
 * Check and consume one unit against a sliding-window rate limit.
 *
 * @param key Stable key (e.g. `hp-draft-create:${ip}`)
 * @param limit Max events allowed in the window
 * @param windowMs Window length in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs)

  // Local dev / unconfigured: controlled in-memory fallback (non-distributed).
  if (!limiter) {
    return checkInMemory(key, limit, windowMs)
  }

  try {
    const res = await limiter.limit(key)
    const retryAfterSeconds = res.success
      ? 0
      : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000))
    return { ok: res.success, remaining: res.remaining, retryAfterSeconds }
  } catch {
    // Fail closed: Upstash is configured but errored — do not silently allow.
    console.error("[human-polish] rate limiter unavailable; failing closed")
    return { ok: false, remaining: 0, retryAfterSeconds: 5 }
  }
}

/** Best-effort client IP from common proxy headers. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "unknown"
}

/** Default limits for Human Polish routes (checkout may consume this later). */
export const HP_RATE_LIMITS = {
  draftCreate: { limit: 10, windowMs: 15 * 60 * 1000 },
  draftRecover: { limit: 30, windowMs: 15 * 60 * 1000 },
  uploadSign: { limit: 60, windowMs: 15 * 60 * 1000 },
  uploadComplete: { limit: 60, windowMs: 15 * 60 * 1000 },
  checkout: { limit: 20, windowMs: 15 * 60 * 1000 },
} as const

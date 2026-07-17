/**
 * In-memory sliding-window rate limiter for Human Polish guest endpoints.
 * Suitable for single-instance / foundation V1. Flag: replace with Redis/Upstash
 * before multi-instance production scale.
 */

type Bucket = {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * @param key Stable key (e.g. `hp-draft:${ip}`)
 * @param limit Max events allowed in the window
 * @param windowMs Window length in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
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

/** Default limits for Human Polish foundation routes. */
export const HP_RATE_LIMITS = {
  draftCreate: { limit: 10, windowMs: 15 * 60 * 1000 },
  draftRecover: { limit: 30, windowMs: 15 * 60 * 1000 },
  uploadSign: { limit: 60, windowMs: 15 * 60 * 1000 },
  uploadComplete: { limit: 60, windowMs: 15 * 60 * 1000 },
} as const

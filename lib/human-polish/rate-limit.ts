/**
 * Rate limiting for Human Polish guest endpoints.
 *
 * One Upstash Redis database is intentionally shared across Production,
 * Preview, and local Development. Environments are isolated by key prefix
 * (`UPSTASH_RATELIMIT_PREFIX`, e.g. `hp:production`).
 *
 * Production: Upstash is required. Missing credentials or prefix → controlled
 * configuration error (no in-memory fallback).
 *
 * Preview: Upstash when configured; otherwise a documented in-memory fallback
 * (non-distributed). Prefix defaults to `hp:preview` when
 * `VERCEL_ENV === "preview"` and `UPSTASH_RATELIMIT_PREFIX` is unset.
 *
 * Development: in-memory fallback when Upstash is not configured. Prefix
 * defaults to `hp:development`.
 *
 * Failure policy: if Upstash is configured but a request errors, we FAIL
 * CLOSED (deny with a short retry) so an outage cannot silently disable limits.
 *
 * Identifiers that may contain IPs (or other potentially identifying data) are
 * hashed before use. Never log the raw identifier.
 */

import { createHash } from "crypto"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
  /** True when production (or required config) cannot rate-limit safely. */
  configurationError?: boolean
}

/** Stable endpoint suffixes — limits remain independent per feature. */
export type HpRateLimitFeature =
  | "draft-create"
  | "draft-recover"
  | "draft-submit"
  | "upload-sign"
  | "upload-complete"
  | "checkout"

export type DeployEnvironment = "production" | "preview" | "development"

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const upstashConfigured = Boolean(REDIS_URL && REDIS_TOKEN)

let redis: Redis | null = null
if (upstashConfigured) {
  redis = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string })
}

/** Resolve deploy environment without trusting request headers. */
export function resolveDeployEnvironment(): DeployEnvironment {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    // Vercel Preview sets NODE_ENV=production but VERCEL_ENV=preview.
    if (process.env.VERCEL_ENV === "preview") return "preview"
    if (process.env.VERCEL_ENV === "development") return "development"
    return "production"
  }
  if (process.env.VERCEL_ENV === "preview") return "preview"
  return "development"
}

/**
 * Resolve the Redis key namespace prefix.
 * Production must set UPSTASH_RATELIMIT_PREFIX explicitly (never inferred from headers).
 */
export function resolveRateLimitPrefix():
  | { ok: true; prefix: string }
  | { ok: false; error: string } {
  const configured = process.env.UPSTASH_RATELIMIT_PREFIX?.trim()
  if (configured) {
    return { ok: true, prefix: configured.replace(/:+$/, "") }
  }

  const env = resolveDeployEnvironment()
  if (env === "production") {
    return {
      ok: false,
      error:
        "UPSTASH_RATELIMIT_PREFIX is required in production (expected e.g. hp:production).",
    }
  }
  if (env === "preview") {
    return { ok: true, prefix: "hp:preview" }
  }
  return { ok: true, prefix: "hp:development" }
}

/** Hash a potentially identifying identifier (IP, etc.) — never log the raw value. */
export function hashRateLimitIdentifier(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex").slice(0, 32)
}

/** One Ratelimit instance per (prefix, feature, limit, windowMs), created lazily. */
const limiterCache = new Map<string, Ratelimit>()

function getLimiter(
  prefix: string,
  feature: HpRateLimitFeature,
  limit: number,
  windowMs: number
): Ratelimit | null {
  if (!redis) return null
  const fullPrefix = `${prefix}:human-polish:${feature}`
  const cacheKey = `${fullPrefix}:${limit}:${windowMs}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: fullPrefix,
      analytics: false,
    })
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

// --- In-memory fallback (preview/dev only; non-distributed) ----------------

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

function configurationErrorResult(message: string): RateLimitResult {
  console.error(`[human-polish] rate limiter configuration error: ${message}`)
  return {
    ok: false,
    remaining: 0,
    retryAfterSeconds: 0,
    configurationError: true,
  }
}

// --- Public API ------------------------------------------------------------

/**
 * Check and consume one unit against a sliding-window rate limit for a
 * Human Polish feature. The identifier (e.g. client IP) is hashed server-side
 * before it is used as a Redis key component.
 */
export async function checkRateLimit(
  feature: HpRateLimitFeature,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const env = resolveDeployEnvironment()
  const prefixResult = resolveRateLimitPrefix()
  if (!prefixResult.ok) {
    return configurationErrorResult(prefixResult.error)
  }

  if (env === "production" && !upstashConfigured) {
    return configurationErrorResult(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production."
    )
  }

  const hashedId = hashRateLimitIdentifier(identifier)
  const limiter = getLimiter(prefixResult.prefix, feature, limit, windowMs)

  // Preview / development: controlled in-memory fallback when Upstash is absent.
  if (!limiter) {
    const memoryKey = `${prefixResult.prefix}:human-polish:${feature}:${hashedId}`
    return checkInMemory(memoryKey, limit, windowMs)
  }

  try {
    // Identifier is the hashed value only — feature/env live in the Ratelimit prefix.
    const res = await limiter.limit(hashedId)
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

/** Best-effort client IP from common proxy headers. Never log the returned value. */
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

/** Default limits for Human Polish routes (thresholds unchanged). */
export const HP_RATE_LIMITS = {
  draftCreate: { limit: 10, windowMs: 15 * 60 * 1000 },
  draftRecover: { limit: 30, windowMs: 15 * 60 * 1000 },
  draftSubmit: { limit: 10, windowMs: 15 * 60 * 1000 },
  uploadSign: { limit: 60, windowMs: 15 * 60 * 1000 },
  uploadComplete: { limit: 60, windowMs: 15 * 60 * 1000 },
  checkout: { limit: 20, windowMs: 15 * 60 * 1000 },
} as const

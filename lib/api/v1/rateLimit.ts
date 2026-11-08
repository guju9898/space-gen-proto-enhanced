/**
 * Rate limiting for public `/api/v1/*` routes (60 req/min per API key).
 *
 * Production is fail-closed:
 * - Missing Upstash URL/token → configurationError (auth maps to 503)
 * - Missing UPSTASH_RATELIMIT_PREFIX in production → configurationError
 * - Upstash request errors → deny with short Retry-After (no in-memory bypass)
 *
 * Preview/development may fall back to in-memory limits when Upstash is unset.
 * Identifiers are hashed before Redis/memory keys; never log raw API keys.
 */

import { createHash } from "crypto"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import {
  resolveDeployEnvironment,
  resolveRateLimitPrefix,
  type RateLimitResult,
} from "@/lib/human-polish/rate-limit"
import { logPublicApiEvent } from "@/lib/api/v1/observability"

export const PUBLIC_API_RATE_LIMIT = 60
export const PUBLIC_API_RATE_WINDOW_MS = 60_000

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const upstashConfigured = Boolean(REDIS_URL && REDIS_TOKEN)

let redis: Redis | null = null
if (upstashConfigured) {
  redis = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string })
}

const limiters = new Map<string, Ratelimit>()

function limiterFor(prefix: string, feature: string, limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const key = `${prefix}:${feature}:${limit}:${windowMs}`
  let existing = limiters.get(key)
  if (!existing) {
    existing = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      prefix: `${prefix}:public-api:${feature}`,
    })
    limiters.set(key, existing)
  }
  return existing
}

const memoryHits = new Map<string, number[]>()

function memoryLimit(id: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (memoryHits.get(id) || []).filter((t) => t > windowStart)
  if (hits.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000))
    return { ok: false, remaining: 0, retryAfterSeconds }
  }
  hits.push(now)
  memoryHits.set(id, hits)
  return { ok: true, remaining: Math.max(0, limit - hits.length), retryAfterSeconds: 0 }
}

/** 60 requests / minute per API key (generate counts too). Production: fail-closed without Upstash. */
export async function checkPublicApiRateLimit(apiKeyId: string): Promise<RateLimitResult> {
  const hashed = createHash("sha256").update(apiKeyId, "utf8").digest("hex").slice(0, 32)
  const prefixResult = resolveRateLimitPrefix()
  const env = resolveDeployEnvironment()

  if (!prefixResult.ok) {
    // Production must set UPSTASH_RATELIMIT_PREFIX explicitly — no inferred fallback.
    if (env === "production") {
      return { ok: false, remaining: 0, retryAfterSeconds: 60, configurationError: true }
    }
  }

  const prefix = prefixResult.ok ? prefixResult.prefix : `api:${env}`
  const limit = PUBLIC_API_RATE_LIMIT
  const windowMs = PUBLIC_API_RATE_WINDOW_MS

  if (!upstashConfigured) {
    // Fail closed in production: never serve unlimited traffic without Redis.
    if (env === "production") {
      return { ok: false, remaining: 0, retryAfterSeconds: 60, configurationError: true }
    }
    return memoryLimit(`${prefix}:${hashed}`, limit, windowMs)
  }

  const limiter = limiterFor(prefix, "v1", limit, windowMs)
  if (!limiter) {
    return { ok: false, remaining: 0, retryAfterSeconds: 60, configurationError: true }
  }

  try {
    const result = await limiter.limit(hashed)
    const limited = !result.success
    const retryAfterSeconds = limited
      ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
      : 0
    if (limited) {
      logPublicApiEvent({
        level: "warn",
        route: "/api/v1/*",
        status: 429,
        code: "rate_limited",
        message: "public api rate limit exceeded",
      })
    }
    return {
      ok: result.success,
      remaining: result.remaining,
      retryAfterSeconds,
    }
  } catch {
    // Upstash outage: fail closed (deny) so limits cannot be bypassed.
    logPublicApiEvent({
      level: "error",
      route: "/api/v1/*",
      status: 429,
      code: "rate_limited",
      message: "upstash rate limit check failed; denying request",
    })
    return { ok: false, remaining: 0, retryAfterSeconds: 30 }
  }
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  // When allowed, approximate window end; when limited, use Retry-After seconds.
  const secondsUntilReset = result.ok
    ? Math.ceil(PUBLIC_API_RATE_WINDOW_MS / 1000)
    : Math.max(1, result.retryAfterSeconds || 60)
  const resetUnix = Math.floor(Date.now() / 1000) + secondsUntilReset
  return {
    "X-RateLimit-Limit": String(PUBLIC_API_RATE_LIMIT),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(resetUnix),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfterSeconds || 60) }),
  }
}

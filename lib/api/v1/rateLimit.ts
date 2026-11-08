import { createHash } from "crypto"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import {
  resolveDeployEnvironment,
  resolveRateLimitPrefix,
  type RateLimitResult,
} from "@/lib/human-polish/rate-limit"

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

/** 60 requests / minute per API key (generate counts too). */
export async function checkPublicApiRateLimit(apiKeyId: string): Promise<RateLimitResult> {
  const hashed = createHash("sha256").update(apiKeyId, "utf8").digest("hex").slice(0, 32)
  const prefixResult = resolveRateLimitPrefix()
  const env = resolveDeployEnvironment()

  if (!prefixResult.ok) {
    if (env === "production") {
      return { ok: false, remaining: 0, retryAfterSeconds: 60, configurationError: true }
    }
  }

  const prefix = prefixResult.ok ? prefixResult.prefix : `api:${env}`
  const limit = 60
  const windowMs = 60_000

  if (!upstashConfigured) {
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
    return {
      ok: result.success,
      remaining: result.remaining,
      retryAfterSeconds: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    }
  } catch {
    return { ok: false, remaining: 0, retryAfterSeconds: 30 }
  }
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": "60",
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfterSeconds || 60) }),
  }
}

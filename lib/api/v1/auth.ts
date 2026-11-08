import type { SupabaseClient } from "@supabase/supabase-js"
import { assertApiPlanAccess, type ApiAccessResult } from "@/lib/api/v1/access"
import { apiError } from "@/lib/api/v1/errors"
import {
  extractBearerToken,
  lookupApiKey,
  serviceDb,
  touchApiKey,
  type ApiKeyRow,
} from "@/lib/api/v1/keys"
import { checkPublicApiRateLimit, rateLimitHeaders } from "@/lib/api/v1/rateLimit"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ApiAuthContext = {
  db: SupabaseClient
  userId: string
  apiKey: ApiKeyRow | null
  access: Extract<ApiAccessResult, { ok: true }>
  rateLimitHeaders: HeadersInit
}

/**
 * Resolve the caller for public /api/v1 routes.
 * Prefer Authorization: Bearer rs_live_… (or X-API-Key).
 * Cookie session is allowed only for key-management endpoints when allowSession is true.
 */
export async function requireApiKeyAuth(request: Request): Promise<
  | { ok: true; ctx: ApiAuthContext }
  | { ok: false; response: Response }
> {
  const db = serviceDb()
  if (!db) {
    return { ok: false, response: apiError("configuration_error", "API is not configured.") }
  }

  const token = extractBearerToken(request)
  if (!token) {
    return {
      ok: false,
      response: apiError("unauthorized", "Missing API key. Use Authorization: Bearer rs_live_…"),
    }
  }

  const apiKey = await lookupApiKey(db, token)
  if (!apiKey) {
    return { ok: false, response: apiError("unauthorized", "Invalid or revoked API key.") }
  }

  const rl = await checkPublicApiRateLimit(apiKey.id)
  const headers = rateLimitHeaders(rl)
  if (rl.configurationError) {
    return {
      ok: false,
      response: apiError("configuration_error", "Rate limiting is not configured.", undefined, headers),
    }
  }
  if (!rl.ok) {
    return {
      ok: false,
      response: apiError("rate_limited", "Rate limit exceeded. Try again shortly.", undefined, headers),
    }
  }

  const access = await assertApiPlanAccess(db, apiKey.user_id)
  if (!access.ok) {
    return {
      ok: false,
      response: apiError(access.code, access.message, undefined, {
        ...headers,
        ...(access.credits?.creditsRemaining != null
          ? { "X-Credits-Remaining": String(access.credits.creditsRemaining) }
          : {}),
      }),
    }
  }

  void touchApiKey(db, apiKey.id)

  return {
    ok: true,
    ctx: {
      db,
      userId: apiKey.user_id,
      apiKey,
      access,
      rateLimitHeaders: {
        ...headers,
        ...(access.credits.creditsRemaining != null
          ? { "X-Credits-Remaining": String(access.credits.creditsRemaining) }
          : {}),
      },
    },
  }
}

/** Cookie session + Professional/Business for dashboard key create/list/revoke. */
export async function requireSessionApiManager(): Promise<
  | { ok: true; db: SupabaseClient; userId: string; access: Extract<ApiAccessResult, { ok: true }> }
  | { ok: false; response: Response }
> {
  const db = serviceDb()
  if (!db) {
    return { ok: false, response: apiError("configuration_error", "API is not configured.") }
  }
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return { ok: false, response: apiError("unauthorized", "Sign in to manage API keys.") }
  }
  const access = await assertApiPlanAccess(db, user.id)
  if (!access.ok) {
    return { ok: false, response: apiError(access.code, access.message) }
  }
  return { ok: true, db, userId: user.id, access }
}

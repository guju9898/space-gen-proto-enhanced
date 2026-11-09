import { requireSessionApiManager } from "@/lib/api/v1/auth"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import { checkPublicApiRateLimit, rateLimitHeaders } from "@/lib/api/v1/rateLimit"
import { sendTestWebhookForUser } from "@/lib/api/v1/webhooks"

export const runtime = "nodejs"

/**
 * POST /api/v1/webhooks/test?id=… — send one signed `webhook.test` delivery now.
 * Session auth only. Returns what the receiver answered so users can debug n8n/Make setups.
 */
export async function POST(request: Request) {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return apiError("validation_error", "Query param id is required.")

  // Own bucket (60/min per user) so the test button can't be used to flood a receiver.
  const rl = await checkPublicApiRateLimit(`webhook-test:${auth.userId}`)
  if (!rl.ok) {
    return rl.configurationError || rl.unavailable
      ? apiError("configuration_error", "Rate limiting is unavailable. Retry shortly.", undefined, rateLimitHeaders(rl), {
          route: "/api/v1/webhooks/test",
          userId: auth.userId,
        })
      : apiError("rate_limited", "Too many test deliveries. Try again shortly.", undefined, rateLimitHeaders(rl))
  }

  try {
    const result = await sendTestWebhookForUser(auth.db, auth.userId, id)
    if (!result) return apiError("not_found", "Webhook not found.")
    return apiJson({
      delivered: result.ok,
      receiver_status: result.status,
      ...(result.reason ? { reason: result.reason } : {}),
    })
  } catch {
    return apiError("internal_error", "Could not send test delivery.", undefined, undefined, {
      route: "/api/v1/webhooks/test",
      userId: auth.userId,
    })
  }
}

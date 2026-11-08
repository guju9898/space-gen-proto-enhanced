import { requireApiKeyAuth } from "@/lib/api/v1/auth"
import { corsPreflight, withCors } from "@/lib/api/v1/cors"
import { apiJson } from "@/lib/api/v1/errors"

export const runtime = "nodejs"

export async function OPTIONS(request: Request) {
  return corsPreflight(request, ["GET", "OPTIONS"])
}

/** GET /api/v1/credits — remaining credits for the API key owner. */
export async function GET(request: Request) {
  const auth = await requireApiKeyAuth(request)
  if (!auth.ok) return withCors(request, auth.response)

  const { access, rateLimitHeaders } = auth.ctx
  return withCors(
    request,
    apiJson(
      {
        plan_id: access.planId,
        credits_remaining: access.credits.creditsRemaining,
        monthly_limit: access.credits.monthlyLimit,
        period_start: access.credits.periodStart,
        near_limit: access.credits.nearLimit,
      },
      { headers: rateLimitHeaders }
    )
  )
}

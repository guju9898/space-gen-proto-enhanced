import { requireApiKeyAuth } from "@/lib/api/v1/auth"
import { corsPreflight, withCors } from "@/lib/api/v1/cors"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import { getRenderForUser, toPublicRender } from "@/lib/api/v1/renders"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  return corsPreflight(request, ["GET", "OPTIONS"])
}

/** GET /api/v1/renders/{id} */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireApiKeyAuth(request)
  if (!auth.ok) return withCors(request, auth.response)

  const { id } = await params
  if (!id) return withCors(request, apiError("validation_error", "Render id is required."))

  const row = await getRenderForUser(auth.ctx.db, auth.ctx.userId, id)
  if (!row) return withCors(request, apiError("not_found", "Render not found."))

  return withCors(request, apiJson(toPublicRender(row), { headers: auth.ctx.rateLimitHeaders }))
}

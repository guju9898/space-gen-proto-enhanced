import { requireApiKeyAuth } from "@/lib/api/v1/auth"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import { getRenderForUser, toPublicRender } from "@/lib/api/v1/renders"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

/** GET /api/v1/renders/{id} */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireApiKeyAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!id) return apiError("validation_error", "Render id is required.")

  const row = await getRenderForUser(auth.ctx.db, auth.ctx.userId, id)
  if (!row) return apiError("not_found", "Render not found.")

  return apiJson(toPublicRender(row), { headers: auth.ctx.rateLimitHeaders })
}

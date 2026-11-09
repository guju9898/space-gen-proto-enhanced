import { requireSessionApiManager } from "@/lib/api/v1/auth"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import {
  createWebhookForUser,
  deleteWebhookForUser,
  listWebhooksForUser,
  setWebhookActiveForUser,
  toPublicWebhook,
  validateWebhookUrl,
  WebhookInputError,
} from "@/lib/api/v1/webhooks"

export const runtime = "nodejs"

const ROUTE = "/api/v1/webhooks"

/** GET /api/v1/webhooks — list webhooks for the signed-in Professional/Business user. */
export async function GET() {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response
  try {
    const rows = await listWebhooksForUser(auth.db, auth.userId)
    return apiJson({ data: rows.map(toPublicWebhook) })
  } catch {
    return apiError("internal_error", "Could not list webhooks.", undefined, undefined, {
      route: ROUTE,
      userId: auth.userId,
    })
  }
}

/** POST /api/v1/webhooks — register a webhook URL (signing secret returned once). */
export async function POST(request: Request) {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response

  let url: string | null = null
  try {
    const body = (await request.json()) as { url?: unknown }
    if (typeof body.url === "string") url = body.url
  } catch {
    return apiError("validation_error", "JSON body with url is required.")
  }
  if (!url) return apiError("validation_error", "url is required.")

  const validated = validateWebhookUrl(url)
  if (!validated.ok) return apiError("validation_error", validated.message)

  try {
    const created = await createWebhookForUser(auth.db, auth.userId, validated.url)
    return apiJson(
      {
        ...toPublicWebhook(created.row),
        secret: created.secret,
        warning:
          "Store this signing secret now. It is used to verify X-Renderspace-Signature and will not be shown again.",
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof WebhookInputError) return apiError("validation_error", error.message)
    return apiError("internal_error", "Could not create webhook.", undefined, undefined, {
      route: ROUTE,
      userId: auth.userId,
    })
  }
}

/** PATCH /api/v1/webhooks?id=… with {"active": true|false} — pause or resume deliveries. */
export async function PATCH(request: Request) {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return apiError("validation_error", "Query param id is required.")

  let active: boolean | null = null
  try {
    const body = (await request.json()) as { active?: unknown }
    if (typeof body.active === "boolean") active = body.active
  } catch {
    return apiError("validation_error", 'JSON body {"active": true|false} is required.')
  }
  if (active === null) return apiError("validation_error", "active must be true or false.")

  try {
    const row = await setWebhookActiveForUser(auth.db, auth.userId, id, active)
    if (!row) return apiError("not_found", "Webhook not found.")
    return apiJson(toPublicWebhook(row))
  } catch {
    return apiError("internal_error", "Could not update webhook.", undefined, undefined, {
      route: ROUTE,
      userId: auth.userId,
    })
  }
}

/** DELETE /api/v1/webhooks?id=… — delete a webhook. */
export async function DELETE(request: Request) {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return apiError("validation_error", "Query param id is required.")

  try {
    const deleted = await deleteWebhookForUser(auth.db, auth.userId, id)
    if (!deleted) return apiError("not_found", "Webhook not found.")
    return apiJson({ deleted: true, id })
  } catch {
    return apiError("internal_error", "Could not delete webhook.", undefined, undefined, {
      route: ROUTE,
      userId: auth.userId,
    })
  }
}

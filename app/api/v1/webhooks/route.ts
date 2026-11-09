import { requireSessionApiManager } from "@/lib/api/v1/auth"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import {
  createWebhookForUser,
  deleteWebhookForUser,
  listWebhooksForUser,
  toPublicWebhook,
  validateWebhookUrl,
} from "@/lib/api/v1/webhooks"

export const runtime = "nodejs"

/** GET /api/v1/webhooks — list webhooks for the signed-in Professional/Business user. */
export async function GET() {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response
  try {
    const rows = await listWebhooksForUser(auth.db, auth.userId)
    return apiJson({ data: rows.map(toPublicWebhook) })
  } catch {
    return apiError("internal_error", "Could not list webhooks.", undefined, undefined, {
      route: "/api/v1/webhooks",
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
    const message = error instanceof Error ? error.message : "Could not create webhook."
    if (message.startsWith("Limit of") || message.includes("https") || message.includes("not allowed")) {
      return apiError("validation_error", message)
    }
    return apiError("internal_error", "Could not create webhook.", undefined, undefined, {
      route: "/api/v1/webhooks",
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
      route: "/api/v1/webhooks",
      userId: auth.userId,
    })
  }
}

import { requireSessionApiManager } from "@/lib/api/v1/auth"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import { createApiKeyForUser, listApiKeysForUser, revokeApiKeyForUser } from "@/lib/api/v1/keys"

export const runtime = "nodejs"

function publicKey(row: {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}) {
  return {
    id: row.id,
    name: row.name,
    key_prefix: row.key_prefix,
    last_used_at: row.last_used_at,
    revoked_at: row.revoked_at,
    created_at: row.created_at,
  }
}

/** GET /api/v1/keys — list keys for the signed-in Professional/Business user. */
export async function GET() {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response
  const rows = await listApiKeysForUser(auth.db, auth.userId)
  return apiJson({ data: rows.map(publicKey) })
}

/** POST /api/v1/keys — create a key (plaintext returned once). */
export async function POST(request: Request) {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response

  let name = "Default"
  try {
    const body = (await request.json()) as { name?: unknown }
    if (typeof body.name === "string" && body.name.trim()) name = body.name.trim().slice(0, 80)
  } catch {
    // empty body is fine
  }

  try {
    const created = await createApiKeyForUser(auth.db, auth.userId, name)
    return apiJson(
      {
        ...publicKey(created.row),
        api_key: created.plaintext,
        warning: "Store this API key now. It will not be shown again.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[api/v1/keys] create failed", error)
    return apiError("internal_error", "Could not create API key.")
  }
}

/** DELETE /api/v1/keys?id=… — revoke a key. */
export async function DELETE(request: Request) {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return apiError("validation_error", "Query param id is required.")

  try {
    const revoked = await revokeApiKeyForUser(auth.db, auth.userId, id)
    if (!revoked) return apiError("not_found", "API key not found or already revoked.")
    return apiJson({ revoked: true, id })
  } catch (error) {
    console.error("[api/v1/keys] revoke failed", error)
    return apiError("internal_error", "Could not revoke API key.")
  }
}

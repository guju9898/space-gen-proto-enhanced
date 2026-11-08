import { requireSessionApiManager } from "@/lib/api/v1/auth"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import { listRendersForUser, toUsageItem } from "@/lib/api/v1/renders"

export const runtime = "nodejs"

const DEFAULT_LIMIT = 20

function parseLimit(raw: string | null): number {
  if (raw == null || raw === "") return DEFAULT_LIMIT
  const n = Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(n), 1), 100)
}

/** GET /api/v1/usage — recent API renders for the signed-in Professional/Business user. */
export async function GET(request: Request) {
  const auth = await requireSessionApiManager()
  if (!auth.ok) return auth.response

  const limit = parseLimit(new URL(request.url).searchParams.get("limit"))

  try {
    const rows = await listRendersForUser(auth.db, auth.userId, limit)
    return apiJson({ data: rows.map(toUsageItem) })
  } catch (error) {
    console.error("[api/v1/usage] list failed", error)
    return apiError("internal_error", "Could not load API usage.")
  }
}

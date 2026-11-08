import { randomUUID } from "crypto"
import { uploadBase64ToSupabase } from "@/lib/api/uploadBase64ToSupabase"
import { requireApiKeyAuth } from "@/lib/api/v1/auth"
import { apiError, apiJson } from "@/lib/api/v1/errors"
import type { SpaceType } from "@/lib/api/v1/prompt"
import { createAndRunRender, listRendersForUser, toPublicRender } from "@/lib/api/v1/renders"

export const runtime = "nodejs"
export const maxDuration = 120

const SPACE_TYPES = new Set(["landscape", "exterior", "interior"])

async function uploadReferenceFile(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new ValidationError("image must be JPEG, PNG, or WEBP.")
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new ValidationError("image must be 10MB or smaller.")
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`
  const path = `api/uploads/${randomUUID()}.${file.type === "image/png" ? "png" : "jpg"}`
  const uploaded = await uploadBase64ToSupabase({ base64DataUrl: dataUrl, filePath: path })
  if (!uploaded) throw new Error("Failed to store uploaded image.")
  return uploaded
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

/** GET /api/v1/renders */
export async function GET(request: Request) {
  const auth = await requireApiKeyAuth(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const limit = Number(url.searchParams.get("limit") || "20")
  const rows = await listRendersForUser(auth.ctx.db, auth.ctx.userId, Number.isFinite(limit) ? limit : 20)
  return apiJson({ data: rows.map(toPublicRender) }, { headers: auth.ctx.rateLimitHeaders })
}

/** POST /api/v1/renders — synchronous generation */
export async function POST(request: Request) {
  const auth = await requireApiKeyAuth(request)
  if (!auth.ok) return auth.response

  const contentType = request.headers.get("content-type") || ""
  let body: Record<string, unknown> = {}
  let imageUrl = ""

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      body = {
        space_type: form.get("space_type"),
        instruction: form.get("instruction"),
        prompt: form.get("prompt"),
        idempotency_key: form.get("idempotency_key"),
        realism: form.get("realism"),
        options: form.get("options"),
      }
      if (typeof body.options === "string" && body.options.trim()) {
        body.options = JSON.parse(body.options)
      }
      const file = form.get("image")
      if (!(file instanceof File)) {
        return apiError("validation_error", "multipart field `image` is required.")
      }
      imageUrl = await uploadReferenceFile(file)
    } else {
      body = (await request.json()) as Record<string, unknown>
      const url = typeof body.image_url === "string" ? body.image_url.trim() : ""
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return apiError("validation_error", "Provide image_url (https) or multipart image.")
      }
      imageUrl = url
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return apiError("validation_error", error.message)
    }
    if (error instanceof SyntaxError) {
      return apiError("validation_error", "Invalid JSON in request body or options field.")
    }
    console.error("[api/v1/renders] parse failed", error)
    return apiError("internal_error", "Could not read request.")
  }

  const spaceType = typeof body.space_type === "string" ? body.space_type.trim() : ""
  if (!SPACE_TYPES.has(spaceType)) {
    return apiError("validation_error", "space_type must be landscape, exterior, or interior.")
  }

  const instruction = typeof body.instruction === "string" ? body.instruction : null
  const promptOverride = typeof body.prompt === "string" ? body.prompt : null
  const hasOptions = body.options && typeof body.options === "object"
  if (!instruction?.trim() && !promptOverride?.trim() && !hasOptions) {
    return apiError("validation_error", "Provide instruction (natural language), options, or prompt.")
  }

  const realismRaw = body.realism
  const realism =
    typeof realismRaw === "number"
      ? realismRaw
      : typeof realismRaw === "string" && realismRaw.trim()
        ? Number(realismRaw)
        : undefined

  try {
    const row = await createAndRunRender({
      db: auth.ctx.db,
      userId: auth.ctx.userId,
      apiKeyId: auth.ctx.apiKey!.id,
      spaceType: spaceType as SpaceType,
      imageUrl,
      instruction,
      options: hasOptions ? (body.options as Record<string, unknown>) : undefined,
      promptOverride,
      realism: Number.isFinite(realism) ? realism : undefined,
      idempotencyKey: typeof body.idempotency_key === "string" ? body.idempotency_key : null,
      planId: auth.ctx.access.planId,
      creditsRemaining: auth.ctx.access.credits.creditsRemaining,
      periodStart: auth.ctx.access.credits.periodStart,
    })

    if (row.status === "failed") {
      return apiJson(toPublicRender(row), { status: 500, headers: auth.ctx.rateLimitHeaders })
    }

    return apiJson(toPublicRender(row), { status: 201, headers: auth.ctx.rateLimitHeaders })
  } catch (error) {
    console.error("[api/v1/renders] create failed", error)
    return apiError("internal_error", "Render failed.")
  }
}

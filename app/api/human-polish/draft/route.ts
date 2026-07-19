/**
 * POST /api/human-polish/draft
 * Create a draft Human Polish request with a 15-minute recovery token.
 *
 * Body: { family, package, leadSource? }
 * Returns: { requestId, draftToken, expiresAt, family, package, standardAmountCents }
 *
 * The plaintext draftToken is returned once. Only its SHA-256 hash is stored.
 */

import { NextResponse } from "next/server"
import {
  getDeliveryTarget,
  getFirstBatchSize,
  getStandardAmountCents,
  HUMAN_POLISH_CURRENCY,
  HUMAN_POLISH_DRAFT_TTL_MINUTES,
} from "@/lib/human-polish/config"
import { draftExpiresAt, generateDraftToken, hashDraftToken } from "@/lib/human-polish/draft-token"
import { checkRateLimit, getClientIp, HP_RATE_LIMITS } from "@/lib/human-polish/rate-limit"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  isHumanPolishServiceFamily,
  isPackageForFamily,
  type AiRenderPackPackage,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { isObject } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

type CreateDraftBody = {
  family?: unknown
  package?: unknown
  leadSource?: unknown
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(
    `hp-draft-create:${ip}`,
    HP_RATE_LIMITS.draftCreate.limit,
    HP_RATE_LIMITS.draftCreate.windowMs
  )
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many draft requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    )
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json(
      { error: "Human Polish is not configured." },
      { status: 503 }
    )
  }

  let body: CreateDraftBody
  try {
    const parsed: unknown = await request.json()
    if (!isObject(parsed)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }
    body = parsed as CreateDraftBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!isHumanPolishServiceFamily(body.family)) {
    return NextResponse.json(
      { error: "family must be 'ai-render-pack' or 'build-ready'." },
      { status: 400 }
    )
  }
  const family: HumanPolishServiceFamily = body.family

  if (!isPackageForFamily(family, body.package)) {
    return NextResponse.json(
      { error: "package does not match the selected service family." },
      { status: 400 }
    )
  }
  const requestedPackage: HumanPolishPackage = body.package

  const leadSource =
    typeof body.leadSource === "string" && body.leadSource.trim()
      ? body.leadSource.trim().slice(0, 200)
      : null

  const draftToken = generateDraftToken()
  const draftTokenHash = hashDraftToken(draftToken)
  const expiresAt = draftExpiresAt()
  const standardAmountCents = getStandardAmountCents(family, requestedPackage)

  const { data, error } = await supabase
    .from("human_polish_requests")
    .insert({
      family,
      requested_package: requestedPackage,
      status: "draft",
      draft_token_hash: draftTokenHash,
      draft_expires_at: expiresAt.toISOString(),
      standard_amount: standardAmountCents,
      currency: HUMAN_POLISH_CURRENCY,
      promotion_type: "none",
      intake_method: "wizard",
      lead_source: leadSource,
      manual_quote_required: requestedPackage === "custom",
    })
    .select("id, family, requested_package, draft_expires_at, standard_amount")
    .single()

  if (error || !data) {
    console.error("[human-polish] draft create failed")
    return NextResponse.json({ error: "Failed to create draft request." }, { status: 500 })
  }

  const response: Record<string, unknown> = {
    requestId: data.id,
    draftToken,
    expiresAt: data.draft_expires_at,
    draftTtlMinutes: HUMAN_POLISH_DRAFT_TTL_MINUTES,
    family: data.family,
    package: data.requested_package,
    standardAmountCents: data.standard_amount,
    currency: HUMAN_POLISH_CURRENCY,
  }

  if (family === "ai-render-pack") {
    response.firstBatchSize = getFirstBatchSize(requestedPackage as AiRenderPackPackage)
  }
  response.deliveryTarget = getDeliveryTarget(family, requestedPackage)

  return NextResponse.json(response, { status: 201 })
}

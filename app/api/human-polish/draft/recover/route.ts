/**
 * POST /api/human-polish/draft/recover
 * Recover a draft within the 15-minute window using requestId + draftToken.
 *
 * Does not expose draft_token_hash. No public table reads.
 */

import { NextResponse } from "next/server"
import {
  getDeliveryTarget,
  getFirstBatchSize,
  HUMAN_POLISH_CURRENCY,
} from "@/lib/human-polish/config"
import { authenticateDraftRequest } from "@/lib/human-polish/draft-auth"
import { checkRateLimit, getClientIp, HP_RATE_LIMITS } from "@/lib/human-polish/rate-limit"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import type { AiRenderPackPackage, HumanPolishPackage, HumanPolishServiceFamily } from "@/lib/human-polish/types"
import { isObject } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(
    `hp-draft-recover:${ip}`,
    HP_RATE_LIMITS.draftRecover.limit,
    HP_RATE_LIMITS.draftRecover.windowMs
  )
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many recovery attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    )
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Human Polish is not configured." }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!isObject(parsed)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }
    body = parsed
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const auth = await authenticateDraftRequest(supabase, body.requestId, body.draftToken)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const row = auth.request
  const family = row.family as HumanPolishServiceFamily
  const pkg = row.requested_package as HumanPolishPackage

  const safe = {
    requestId: row.id,
    status: row.status,
    family,
    package: pkg,
    expiresAt: row.draft_expires_at,
    contactName: row.contact_name ?? null,
    contactEmail: row.contact_email ?? null,
    contactPhone: row.contact_phone ?? null,
    companyName: row.company_name ?? null,
    customerRole: row.customer_role ?? null,
    preferredContactMethod: row.preferred_contact_method ?? null,
    projectType: row.project_type ?? null,
    projectName: row.project_name ?? null,
    projectAddress: row.project_address ?? null,
    projectCity: row.project_city ?? null,
    projectState: row.project_state ?? null,
    briefText: row.brief_text ?? null,
    designObjectives: row.design_objectives ?? null,
    mustHaveElements: row.must_have_elements ?? null,
    avoidElements: row.avoid_elements ?? null,
    materialPreferences: row.material_preferences ?? null,
    clientWords: row.client_words ?? null,
    successDefinition: row.success_definition ?? null,
    deadlineDate: row.deadline_date ?? null,
    budgetBand: row.budget_band ?? null,
    hasApprovedConcept: row.has_approved_concept ?? false,
    hasPropertySurvey: row.has_property_survey ?? false,
    secondPropertyRequested: row.second_property_requested ?? false,
    brandingRequested: row.branding_requested ?? false,
    brandPhone: row.brand_phone ?? null,
    brandWebsite: row.brand_website ?? null,
    brandNotes: row.brand_notes ?? null,
    rushRequested: row.rush_requested ?? false,
    marketingPermission: row.marketing_permission ?? false,
    standardAmountCents: row.standard_amount ?? null,
    currency: (row.currency as string) ?? HUMAN_POLISH_CURRENCY,
    promotionType: row.promotion_type ?? "none",
    deliveryTarget: getDeliveryTarget(family, pkg),
    firstBatchSize:
      family === "ai-render-pack" ? getFirstBatchSize(pkg as AiRenderPackPackage) : null,
  }

  return NextResponse.json(safe)
}

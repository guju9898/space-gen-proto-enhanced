/**
 * POST /api/human-polish/draft/submit
 *
 * Persist the completed intake wizard onto an existing draft request and move it
 * out of the "draft" state. This is the integration bridge between the intake UI
 * (which collects the guided-interview form) and the checkout / scope-review
 * workstreams (which read the server-authoritative request row).
 *
 * Security / trust model:
 *   - Authenticated by requestId + draftToken (same contract as recover/checkout).
 *   - The phone number is normalized to E.164 SERVER-SIDE (lib/human-polish/phone)
 *     — the browser value is never trusted as the eligibility key.
 *   - Pricing, promotion, rush approval, and tax are NOT set here; those remain
 *     server-authoritative in the checkout route (spec §2.1 / §5).
 *
 * Body (application/json):
 *   {
 *     "requestId":  string,
 *     "draftToken": string,
 *     "intake":     IntakeFormData  // the wizard form (see components/human-polish/intake)
 *   }
 *
 * Success 200: { ok: true, requestId, status, family, package }
 * Errors: 400 invalid body / missing required fields · 403 invalid token ·
 *         404 not found · 410 expired · 429 rate limited · 503 not configured · 500
 */

import { NextResponse } from "next/server"
import { authenticateDraftRequest } from "@/lib/human-polish/draft-auth"
import { getDeliveryTarget, HUMAN_POLISH_DRAFT_TTL_MINUTES } from "@/lib/human-polish/config"
import { normalizePhone } from "@/lib/human-polish/phone"
import { checkRateLimit, getClientIp, HP_RATE_LIMITS } from "@/lib/human-polish/rate-limit"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  isHumanPolishServiceFamily,
  isPackageForFamily,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { isObject } from "@/lib/types/typeGuards"
import {
  sendDraftReceivedEmail,
  sendInternalTeamAlertEmail,
} from "@/lib/human-polish/email"

export const runtime = "nodejs"

type SubmitBody = {
  requestId?: unknown
  draftToken?: unknown
  intake?: unknown
}

/** Read a trimmed string from an unknown record field, capped in length. */
function s(record: Record<string, unknown>, key: string, max = 2000): string | null {
  const v = record[key]
  if (typeof v !== "string") return null
  const trimmed = v.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function b(record: Record<string, unknown>, key: string): boolean {
  return record[key] === true
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(
    `hp-draft-submit:${ip}`,
    HP_RATE_LIMITS.draftCreate.limit,
    HP_RATE_LIMITS.draftCreate.windowMs
  )
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    )
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Human Polish is not configured." }, { status: 503 })
  }

  let body: SubmitBody
  try {
    const parsed: unknown = await request.json()
    if (!isObject(parsed)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }
    body = parsed as SubmitBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!isObject(body.intake)) {
    return NextResponse.json({ error: "intake payload is required." }, { status: 400 })
  }
  const intake = body.intake as Record<string, unknown>

  // Authenticate against the stored draft (requestId + draftToken).
  const auth = await authenticateDraftRequest(supabase, body.requestId, body.draftToken)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const req = auth.request

  if (!isHumanPolishServiceFamily(req.family)) {
    return NextResponse.json({ error: "Request has an invalid service family." }, { status: 409 })
  }
  const family: HumanPolishServiceFamily = req.family
  if (!isPackageForFamily(family, req.requested_package)) {
    return NextResponse.json({ error: "Request has an invalid package." }, { status: 409 })
  }
  const pkg: HumanPolishPackage = req.requested_package as HumanPolishPackage

  // --- Required contact fields (server-side validation) --------------------
  const contactName = s(intake, "contactName", 200)
  const contactEmail = s(intake, "contactEmail", 320)
  const contactPhoneRaw = s(intake, "contactPhone", 40)
  const companyName = s(intake, "companyName", 200)

  const missing: string[] = []
  if (!contactName) missing.push("contactName")
  if (!contactEmail) missing.push("contactEmail")
  if (!contactPhoneRaw) missing.push("contactPhone")
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required contact fields: ${missing.join(", ")}.` },
      { status: 400 }
    )
  }

  // Normalize the phone SERVER-SIDE — this is the eligibility key for the
  // first-purchase promo. A bad number is not fatal to intake; we store the raw
  // value and leave phone_normalized null (promo simply cannot be granted).
  const phoneResult = normalizePhone(contactPhoneRaw)
  const phoneNormalized = phoneResult.ok ? phoneResult.normalized : null

  // --- Required acknowledgments (mirror validation.ts, enforced server-side)-
  const ackPermission = b(intake, "ackPermission")
  const ackConceptual = b(intake, "ackConceptual")
  const ackDeliveryClock = b(intake, "ackDeliveryClock")
  const ackTerms = b(intake, "ackTerms")
  const ackGuaranteeScope = b(intake, "ackGuaranteeScope")
  const ackExpiration = b(intake, "ackExpiration")
  const ackScopeReview = b(intake, "ackScopeReview")

  const baseAcksOk = ackPermission && ackConceptual && ackDeliveryClock && ackTerms
  const familyAcksOk =
    family === "ai-render-pack" ? ackGuaranteeScope && ackExpiration : ackScopeReview
  if (!baseAcksOk || !familyAcksOk) {
    return NextResponse.json(
      { error: "All required acknowledgments must be accepted before submitting." },
      { status: 400 }
    )
  }

  const nowIso = new Date().toISOString()
  const deadline = s(intake, "deadlineDate", 40)

  // Build-Ready goes to human scope review; AI Render Packs proceed to checkout.
  const nextStatus = "submitted"

  const update: Record<string, unknown> = {
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhoneRaw,
    phone_normalized: phoneNormalized,
    company_name: companyName,
    customer_role: s(intake, "customerRole", 40),
    preferred_contact_method: s(intake, "preferredContactMethod", 40),
    project_type: s(intake, "projectType", 60),
    project_name: s(intake, "projectName", 300),
    project_address: s(intake, "projectAddress", 400),
    project_city: s(intake, "projectCity", 200),
    project_state: s(intake, "projectState", 100),
    brief_text: s(intake, "briefText", 8000),
    design_objectives: s(intake, "designObjectives", 8000),
    must_have_elements: s(intake, "mustHaveElements", 8000),
    avoid_elements: s(intake, "avoidElements", 8000),
    material_preferences: s(intake, "materialPreferences", 8000),
    client_words: s(intake, "clientWords", 8000),
    success_definition: s(intake, "successDefinition", 8000),
    deadline_date: deadline,
    budget_band: s(intake, "budgetBand", 40),
    has_approved_concept: b(intake, "hasApprovedConcept"),
    has_property_survey: b(intake, "hasPropertySurvey"),
    second_property_requested: b(intake, "secondPropertyRequested"),
    rush_requested: b(intake, "rushRequested"),
    branding_requested: b(intake, "brandingRequested"),
    brand_phone: s(intake, "brandPhone", 40),
    brand_website: s(intake, "brandWebsite", 400),
    brand_notes: s(intake, "brandNotes", 4000),
    marketing_permission: b(intake, "marketingPermission"),
    scope_confirmed: true,
    scope_confirmed_at: nowIso,
    terms_accepted_at: nowIso,
    manual_quote_required: pkg === "custom",
    status: nextStatus,
  }

  const { error: updateError } = await supabase
    .from("human_polish_requests")
    .update(update)
    .eq("id", req.id)
  if (updateError) {
    console.error("[human-polish] submit: failed to persist intake")
    return NextResponse.json({ error: "Failed to save your request." }, { status: 500 })
  }

  // --- Launch-critical notifications (best-effort; never block the response) -
  // Emails are safe no-ops until LOOPS_API_KEY + template ids are provisioned.
  const origin =
    request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || ""
  const recoveryUrl = origin
    ? `${origin}/human-polish/intake?family=${family}&package=${pkg}`
    : undefined
  const packageLabel = HUMAN_POLISH_PACKAGE_LABELS[pkg]

  await Promise.allSettled([
    sendDraftReceivedEmail({
      to: contactEmail as string,
      contactName: contactName ?? undefined,
      requestId: req.id,
      family,
      packageLabel,
      recoveryUrl,
      draftExpiresMinutes: HUMAN_POLISH_DRAFT_TTL_MINUTES,
    }),
    sendInternalTeamAlertEmail({
      subject:
        family === "build-ready"
          ? `New Build-Ready intake needs scope review (${packageLabel})`
          : `New AI Render Pack intake (${packageLabel})`,
      requestId: req.id,
      // No PII in the internal summary — role/city context only.
      summary: `family=${family} package=${pkg} role=${s(intake, "customerRole", 40) ?? "n/a"}`,
    }),
  ])

  return NextResponse.json({
    ok: true,
    requestId: req.id,
    status: nextStatus,
    family,
    package: pkg,
    deliveryTarget: getDeliveryTarget(family, pkg),
  })
}

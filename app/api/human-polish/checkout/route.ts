/**
 * POST /api/human-polish/checkout
 *
 * Initiate a Human Polish one-time-payment Stripe Checkout Session
 * (mode: "payment") for an authenticated draft request. This is completely
 * separate from the Renderspace subscription checkout — it never reads or writes
 * subscription state.
 *
 * ---------------------------------------------------------------------------
 * REQUEST/RESPONSE CONTRACT (consumed by the intake UI, built by another agent)
 * ---------------------------------------------------------------------------
 * Method:  POST
 * Body (application/json):
 *   {
 *     "requestId":  string,   // human_polish_requests.id (from POST /draft)
 *     "draftToken": string    // plaintext recovery token (from POST /draft)
 *   }
 *
 * Success 200 (application/json):
 *   {
 *     "url":       string,    // Stripe Checkout URL — redirect the browser here
 *     "sessionId": string,    // Stripe Checkout Session id
 *     "amount": {
 *       "currency":                  "usd",
 *       "standardAmountCents":       number,
 *       "totalBeforeTaxCents":       number,   // excludes Stripe Tax
 *       "discountAmountCents":       number,
 *       "rushAmountCents":           number,
 *       "promotionType":             "none" | "first_purchase_25" | "subscriber_15",
 *       "subscriberDiscountApplied": boolean,
 *       "rushApplied":               boolean,
 *       "lineItems": [{ "label": string, "amountCents": number, "kind": "package" | "rush" }]
 *     }
 *   }
 *
 * Errors (application/json { "error": string }):
 *   400 invalid body / package        401 (reserved; guest checkout is allowed)
 *   403 invalid draft token           404 request not found
 *   409 not eligible for checkout      410 draft expired
 *   429 rate limited (Retry-After)    503 not configured   500 internal
 *
 * PRICING is always server-authoritative (lib/human-polish/config.ts). The
 * browser cannot influence price, discount, rush approval, or tax. Subscriber
 * discounts require an authenticated active Professional/Business session; the
 * first-purchase promo is verified against paid history for the normalized phone.
 */

import { NextResponse } from "next/server"
import {
  humanPolishAbsoluteUrl,
  resolveHumanPolishAppUrl,
} from "@/lib/human-polish/app-url"
import { authenticateDraftRequest } from "@/lib/human-polish/draft-auth"
import { checkRateLimit, getClientIp, HP_RATE_LIMITS } from "@/lib/human-polish/rate-limit"
import {
  buildHumanPolishMetadata,
  computeHumanPolishAmount,
  getHumanPolishStripe,
  toStripeLineItems,
} from "@/lib/human-polish/stripe"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  isHumanPolishServiceFamily,
  isPackageForFamily,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isObject } from "@/lib/types/typeGuards"
import Stripe from "stripe"

export const runtime = "nodejs"

/** Build-Ready checkout is only permitted once a human has approved the scope. */
const BUILD_READY_CHECKOUT_STATUSES = new Set(["ready_for_payment", "awaiting_payment"])

type CheckoutBody = {
  requestId?: unknown
  draftToken?: unknown
}

export async function POST(request: Request) {
  // 1) Rate limit checkout initiation by client IP (spec §7.3).
  const ip = getClientIp(request)
  const rl = await checkRateLimit(
    "checkout",
    ip,
    HP_RATE_LIMITS.checkout.limit,
    HP_RATE_LIMITS.checkout.windowMs
  )
  if (rl.configurationError) {
    return NextResponse.json(
      { error: "Human Polish rate limiting is not configured." },
      { status: 503 }
    )
  }
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    )
  }

  const stripe = getHumanPolishStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Checkout is not configured (missing STRIPE_SECRET_KEY)." },
      { status: 503 }
    )
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: "Human Polish is not configured." }, { status: 503 })
  }

  // 2) Parse body.
  let body: CheckoutBody
  try {
    const parsed: unknown = await request.json()
    if (!isObject(parsed)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }
    body = parsed as CheckoutBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  // 3) Authenticate the draft request (requestId + draftToken).
  // Successful auth extends the inactivity-based draft expiration.
  const auth = await authenticateDraftRequest(supabase, body.requestId, body.draftToken)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, ...(auth.code ? { code: auth.code } : {}) },
      { status: auth.status }
    )
  }
  const req = auth.request

  // 4) Validate family/package from the SERVER row (never the browser).
  if (!isHumanPolishServiceFamily(req.family)) {
    return NextResponse.json({ error: "Request has an invalid service family." }, { status: 409 })
  }
  const family: HumanPolishServiceFamily = req.family
  if (!isPackageForFamily(family, req.requested_package)) {
    return NextResponse.json({ error: "Request has an invalid package." }, { status: 409 })
  }
  const pkg: HumanPolishPackage = req.requested_package as HumanPolishPackage

  // 5) Family-specific eligibility to reach a self-serve checkout.
  if (family === "build-ready") {
    // Build-Ready is review-first: it cannot self-checkout before human approval.
    if (!BUILD_READY_CHECKOUT_STATUSES.has(req.status)) {
      return NextResponse.json(
        { error: "This package requires scope review and approval before payment." },
        { status: 409 }
      )
    }
  }

  const requestId = req.id
  const phoneNormalized = typeof req.phone_normalized === "string" ? req.phone_normalized : null
  const leadSource = typeof req.lead_source === "string" ? req.lead_source : null
  const rushApproved = req.rush_approved === true
  const approvedAmountCents =
    typeof req.quoted_amount === "number" && Number.isFinite(req.quoted_amount)
      ? req.quoted_amount
      : null

  // 6) First-purchase promo eligibility — 25-pack only, verified by paid history
  //    for the normalized phone (spec §2.1). Requires a normalized phone; without
  //    one we cannot verify eligibility, so the promo is not granted.
  let firstPurchaseEligible = false
  if (family === "ai-render-pack" && pkg === "25" && phoneNormalized) {
    const { data: priorPaid, error: priorErr } = await supabase
      .from("human_polish_requests")
      .select("id")
      .eq("family", "ai-render-pack")
      .eq("phone_normalized", phoneNormalized)
      .eq("payment_status", "paid")
      .neq("id", requestId)
      .limit(1)
    if (priorErr) {
      console.error("[human-polish] first-purchase eligibility lookup failed")
      return NextResponse.json({ error: "Failed to verify checkout eligibility." }, { status: 500 })
    }
    firstPurchaseEligible = !priorPaid || priorPaid.length === 0
  }

  // 7) Subscriber discount — authenticated, active Professional/Business only
  //    (spec §2.1). A typed email is never trusted; we read the signed-in session.
  let subscriberEligible = false
  let authedUserId: string | null = null
  try {
    const authedSupabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await authedSupabase.auth.getUser()
    if (user) {
      authedUserId = user.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_plan, subscription_status")
        .eq("id", user.id)
        .maybeSingle()
      if (
        profile &&
        (profile.current_plan === "professional" || profile.current_plan === "business") &&
        profile.subscription_status === "active"
      ) {
        subscriberEligible = true
      }
    }
  } catch (err) {
    // Auth is optional (guest checkout). Never fail checkout because the session
    // could not be read — the customer simply does not receive the discount.
    console.error("[human-polish] subscriber lookup skipped:", err instanceof Error ? err.message : "unknown")
  }

  // 8) Compute the authoritative amount (all numbers from config.ts).
  const amount = computeHumanPolishAmount({
    family,
    pkg,
    firstPurchaseEligible,
    subscriberEligible,
    rushApproved,
    approvedAmountCents,
  })
  if (!amount.ok) {
    return NextResponse.json({ error: amount.error }, { status: 409 })
  }

  // 9) Success/cancel routes (spec §5.5) — fixed relative paths only (no open redirect).
  let origin: string
  try {
    origin = resolveHumanPolishAppUrl({ request })
  } catch {
    return NextResponse.json(
      { error: "Application URL is not configured." },
      { status: 500 }
    )
  }
  const successUrl = humanPolishAbsoluteUrl(
    origin,
    "/human-polish/success?session_id={CHECKOUT_SESSION_ID}"
  )
  const cancelUrl = humanPolishAbsoluteUrl(origin, "/human-polish")

  const metadata = buildHumanPolishMetadata({
    requestId,
    family,
    pkg,
    phoneNormalized,
    promotionType: amount.promotionType,
    subscriberDiscountApplied: amount.subscriberDiscountApplied,
    rushApproved,
    leadSource,
  })

  const customerEmail = typeof req.contact_email === "string" && req.contact_email ? req.contact_email : undefined

  // 10) Create the Checkout Session (mode: "payment", Stripe Tax enabled).
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: toStripeLineItems(amount.lineItems),
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      customer_email: customerEmail,
      client_reference_id: requestId,
      metadata,
      // Mirror metadata onto the PaymentIntent so the payment_intent.* webhook
      // events can also resolve the originating Human Polish request.
      payment_intent_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[human-polish] Stripe checkout error:", {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
      })
      return NextResponse.json(
        { error: error.message || "Stripe API error." },
        { status: error.statusCode || 500 }
      )
    }
    console.error("[human-polish] checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 })
  }

  // 11) Persist checkout state on the request (server-authoritative snapshot).
  const update: Record<string, unknown> = {
    status: "awaiting_payment",
    payment_status: "pending",
    stripe_checkout_session_id: session.id,
    promotion_type: amount.promotionType,
    subscriber_discount_applied: amount.subscriberDiscountApplied,
    discount_amount: amount.discountAmountCents,
    quoted_amount: amount.totalBeforeTaxCents,
  }
  if (typeof req.standard_amount !== "number") {
    update.standard_amount = amount.standardAmountCents
  }
  // Associate the purchase with the signed-in user if not already linked.
  if (authedUserId && !req.user_id) {
    update.user_id = authedUserId
  }
  const { error: updateError } = await supabase
    .from("human_polish_requests")
    .update(update)
    .eq("id", requestId)
  if (updateError) {
    // The session exists; the webhook can still reconcile via metadata.requestId.
    console.error("[human-polish] failed to persist checkout state")
  }

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 })
  }

  return NextResponse.json({
    url: session.url,
    sessionId: session.id,
    amount: {
      currency: req.currency && typeof req.currency === "string" ? req.currency : "usd",
      standardAmountCents: amount.standardAmountCents,
      totalBeforeTaxCents: amount.totalBeforeTaxCents,
      discountAmountCents: amount.discountAmountCents,
      rushAmountCents: amount.rushAmountCents,
      promotionType: amount.promotionType,
      subscriberDiscountApplied: amount.subscriberDiscountApplied,
      rushApplied: amount.rushAmountCents > 0,
      lineItems: amount.lineItems.map((li) => ({
        label: li.label,
        amountCents: li.amountCents,
        kind: li.kind,
      })),
    },
  })
}
